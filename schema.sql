--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6 (Ubuntu 16.6-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.6 (Ubuntu 16.6-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: contest_status; Type: TYPE; Schema: public; Owner: branchmanager
--

CREATE TYPE public.contest_status AS ENUM (
    'pending',
    'active',
    'completed',
    'cancelled'
);


ALTER TYPE public.contest_status OWNER TO branchmanager;

--
-- Name: transaction_status; Type: TYPE; Schema: public; Owner: branchmanager
--

CREATE TYPE public.transaction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'reversed'
);


ALTER TYPE public.transaction_status OWNER TO branchmanager;

--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: branchmanager
--

CREATE TYPE public.transaction_type AS ENUM (
    'CONTEST_ENTRY',
    'PRIZE_PAYOUT',
    'DEPOSIT',
    'WITHDRAWAL',
    'REFERRAL_BONUS',
    'PROMOTION'
);


ALTER TYPE public.transaction_type OWNER TO branchmanager;

--
-- Name: auto_populate_contest_buckets(); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.auto_populate_contest_buckets() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- When a new contest is created
    IF TG_OP = 'INSERT' THEN
        -- Add all existing token-bucket relationships to the new contest
        INSERT INTO contest_token_buckets (contest_id, token_id, bucket_id)
        SELECT 
            NEW.id,
            tbm.token_id,
            tbm.bucket_id
        FROM token_bucket_memberships tbm;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_populate_contest_buckets() OWNER TO branchmanager;

--
-- Name: auto_populate_token_buckets(); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.auto_populate_token_buckets() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- When a new token-bucket relationship is created
    IF TG_OP = 'INSERT' THEN
        -- Add this relationship to all active/pending contests
        INSERT INTO contest_token_buckets (contest_id, token_id, bucket_id)
        SELECT 
            c.id,
            NEW.token_id,
            NEW.bucket_id
        FROM contests c
        WHERE c.status IN ('pending', 'active');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_populate_token_buckets() OWNER TO branchmanager;

--
-- Name: check_portfolio_total_weight(); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.check_portfolio_total_weight() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (
        SELECT SUM(weight)
        FROM contest_portfolios
        WHERE contest_id = NEW.contest_id 
        AND wallet_address = NEW.wallet_address
    ) > 100 THEN
        RAISE EXCEPTION 'Total portfolio weight cannot exceed 100%%';
    END IF;
    RETURN NEW;
END
$$;


ALTER FUNCTION public.check_portfolio_total_weight() OWNER TO branchmanager;

--
-- Name: cleanup_bucket_relationships(); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.cleanup_bucket_relationships() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Remove from contest_token_buckets first
    DELETE FROM contest_token_buckets 
    WHERE bucket_id = OLD.id;
    
    -- Remove from token_bucket_memberships
    DELETE FROM token_bucket_memberships 
    WHERE bucket_id = OLD.id;
    
    -- Update contests to remove this bucket from allowed_buckets
    UPDATE contests 
    SET allowed_buckets = array_remove(allowed_buckets, OLD.id)
    WHERE OLD.id = ANY(allowed_buckets);
    
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.cleanup_bucket_relationships() OWNER TO branchmanager;

--
-- Name: cleanup_contest_relationships(); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.cleanup_contest_relationships() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Remove from contest_token_buckets
    DELETE FROM contest_token_buckets 
    WHERE contest_id = OLD.id;
    
    -- Remove from contest_portfolios
    DELETE FROM contest_portfolios 
    WHERE contest_id = OLD.id;
    
    -- Remove from contest_participants
    DELETE FROM contest_participants 
    WHERE contest_id = OLD.id;
    
    -- Remove from contest_token_prices
    DELETE FROM contest_token_prices 
    WHERE contest_id = OLD.id;
    
    -- Remove from contest_token_performance
    DELETE FROM contest_token_performance 
    WHERE contest_id = OLD.id;
    
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.cleanup_contest_relationships() OWNER TO branchmanager;

--
-- Name: cleanup_token_relationships(); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.cleanup_token_relationships() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Remove from contest_token_buckets first
    DELETE FROM contest_token_buckets 
    WHERE token_id = OLD.id;
    
    -- Remove from token_bucket_memberships
    DELETE FROM token_bucket_memberships 
    WHERE token_id = OLD.id;
    
    RETURN OLD;
END;
$$;


ALTER FUNCTION public.cleanup_token_relationships() OWNER TO branchmanager;

--
-- Name: create_contest(text, text, text, timestamp with time zone, timestamp with time zone, numeric, integer, integer[], integer, jsonb); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.create_contest(p_name text, p_contest_code text, p_description text, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_entry_fee numeric, p_max_participants integer, p_allowed_buckets integer[], p_min_participants integer DEFAULT 2, p_settings jsonb DEFAULT '{"prize_distribution": [60, 30, 10]}'::jsonb, OUT success boolean, OUT message text, OUT contest_id integer) RETURNS record
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Validate inputs
    IF p_start_time >= p_end_time THEN
        success := false;
        message := 'Start time must be before end time';
        RETURN;
    END IF;

    IF p_min_participants > p_max_participants THEN
        success := false;
        message := 'Min participants cannot exceed max participants';
        RETURN;
    END IF;

    -- Check for duplicate contest code
    IF EXISTS (SELECT 1 FROM contests WHERE contest_code = p_contest_code) THEN
        success := false;
        message := 'Contest code already exists';
        RETURN;
    END IF;

    -- Validate bucket IDs exist
    IF NOT EXISTS (
        SELECT 1 FROM token_buckets 
        WHERE id = ANY(p_allowed_buckets)
        HAVING COUNT(*) = array_length(p_allowed_buckets, 1)
    ) THEN
        success := false;
        message := 'One or more bucket IDs do not exist';
        RETURN;
    END IF;

    -- Insert the contest
    INSERT INTO contests (
        name,
        contest_code,
        description,
        start_time,
        end_time,
        entry_fee,
        min_participants,
        max_participants,
        allowed_buckets,
        settings,
        status
    ) VALUES (
        p_name,
        p_contest_code,
        p_description,
        p_start_time,
        p_end_time,
        p_entry_fee,
        p_min_participants,
        p_max_participants,
        p_allowed_buckets,
        p_settings,
        'pending'
    ) RETURNING id INTO contest_id;

    success := true;
    message := 'Contest created successfully';
    RETURN;

EXCEPTION WHEN OTHERS THEN
    success := false;
    message := 'Error creating contest: ' || SQLERRM;
    contest_id := NULL;
    RETURN;
END;
$$;


ALTER FUNCTION public.create_contest(p_name text, p_contest_code text, p_description text, p_start_time timestamp with time zone, p_end_time timestamp with time zone, p_entry_fee numeric, p_max_participants integer, p_allowed_buckets integer[], p_min_participants integer, p_settings jsonb, OUT success boolean, OUT message text, OUT contest_id integer) OWNER TO branchmanager;

--
-- Name: delete_contest(integer, boolean); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.delete_contest(p_contest_id integer, OUT success boolean, OUT message text, p_soft_delete boolean DEFAULT true) RETURNS record
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_status contest_status;
    v_participant_count INTEGER;
BEGIN
    -- Check if contest exists
    SELECT status, participant_count 
    INTO v_status, v_participant_count
    FROM contests 
    WHERE id = p_contest_id;

    IF NOT FOUND THEN
        success := false;
        message := 'Contest ID ' || p_contest_id || ' not found';
        RETURN;
    END IF;

    -- Check if contest can be deleted
    IF v_status = 'active' AND v_participant_count > 0 THEN
        success := false;
        message := 'Cannot delete active contest with participants';
        RETURN;
    END IF;

    IF v_status = 'completed' THEN
        success := false;
        message := 'Cannot delete completed contest';
        RETURN;
    END IF;

    IF p_soft_delete THEN
        -- Soft delete: mark as cancelled
        UPDATE contests 
        SET 
            status = 'cancelled'
        WHERE id = p_contest_id;
        
        success := true;
        message := 'Contest cancelled successfully';
    ELSE
        -- Check if contest has any historical data
        IF EXISTS (
            SELECT 1 
            FROM contest_participants 
            WHERE contest_id = p_contest_id
        ) THEN
            success := false;
            message := 'Contest has participant history. Use soft delete instead';
            RETURN;
        END IF;

        -- Hard delete
        DELETE FROM contests WHERE id = p_contest_id;
        
        success := true;
        message := 'Contest permanently deleted';
    END IF;
    
    RETURN;

EXCEPTION WHEN OTHERS THEN
    success := false;
    message := 'Error processing contest deletion: ' || SQLERRM;
    RETURN;
END;
$$;


ALTER FUNCTION public.delete_contest(p_contest_id integer, OUT success boolean, OUT message text, p_soft_delete boolean) OWNER TO branchmanager;

--
-- Name: delete_token(integer); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.delete_token(p_id integer, OUT success boolean, OUT message text) RETURNS record
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if token exists
    IF NOT EXISTS (SELECT 1 FROM tokens WHERE id = p_id) THEN
        success := false;
        message := 'Token ID ' || p_id || ' not found';
        RETURN;
    END IF;

    -- Check if token is used in any portfolios
    IF EXISTS (
        SELECT 1 
        FROM contest_portfolios 
        WHERE token_id = p_id
    ) THEN
        success := false;
        message := 'Token is used in active portfolios and cannot be deleted';
        RETURN;
    END IF;

    -- Perform the delete
    DELETE FROM tokens WHERE id = p_id;
    
    success := true;
    message := 'Token successfully deleted';
    
    RETURN;
EXCEPTION WHEN OTHERS THEN
    success := false;
    message := 'Error deleting token: ' || SQLERRM;
    RETURN;
END;
$$;


ALTER FUNCTION public.delete_token(p_id integer, OUT success boolean, OUT message text) OWNER TO branchmanager;

--
-- Name: delete_token(integer, boolean); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.delete_token(p_id integer, p_soft_delete boolean DEFAULT true, OUT success boolean, OUT message text) RETURNS record
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if token exists
    IF NOT EXISTS (SELECT 1 FROM tokens WHERE id = p_id) THEN
        success := false;
        message := 'Token ID ' || p_id || ' not found';
        RETURN;
    END IF;

    -- Check if token is already inactive (if soft deleting)
    IF p_soft_delete AND NOT (SELECT is_active FROM tokens WHERE id = p_id) THEN
        success := false;
        message := 'Token is already inactive';
        RETURN;
    END IF;

    -- Check active portfolio usage
    IF EXISTS (
        SELECT 1 
        FROM contest_portfolios cp
        JOIN contests c ON cp.contest_id = c.id
        WHERE cp.token_id = p_id
        AND c.status IN ('active', 'pending')
    ) THEN
        success := false;
        message := 'Token is used in active or pending contest portfolios';
        RETURN;
    END IF;

    -- Check token bucket memberships
    IF EXISTS (
        SELECT 1 
        FROM token_bucket_memberships 
        WHERE token_id = p_id
    ) THEN
        success := false;
        message := 'Token is assigned to buckets. Remove bucket assignments first';
        RETURN;
    END IF;

    -- Check historical data
    IF EXISTS (
        SELECT 1 
        FROM contest_token_performance 
        WHERE token_id = p_id
    ) THEN
        IF NOT p_soft_delete THEN
            success := false;
            message := 'Token has historical performance data. Use soft delete instead';
            RETURN;
        END IF;
    END IF;

    IF p_soft_delete THEN
        -- Soft delete: just mark as inactive and clear market data
        UPDATE tokens 
        SET 
            is_active = false,
            market_cap = NULL,
            change_24h = NULL,
            volume_24h = NULL
        WHERE id = p_id;
        
        success := true;
        message := 'Token successfully deactivated';
    ELSE
        -- Hard delete: actually remove the record
        DELETE FROM tokens WHERE id = p_id;
        
        success := true;
        message := 'Token permanently deleted';
    END IF;
    
    RETURN;
EXCEPTION WHEN OTHERS THEN
    success := false;
    message := 'Error processing token deletion: ' || SQLERRM;
    RETURN;
END;
$$;


ALTER FUNCTION public.delete_token(p_id integer, p_soft_delete boolean, OUT success boolean, OUT message text) OWNER TO branchmanager;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: token_buckets; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.token_buckets (
    id integer NOT NULL,
    bucket_code text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_bucket_code CHECK ((bucket_code ~ '^[A-Z0-9-]{2,20}$'::text))
);


ALTER TABLE public.token_buckets OWNER TO branchmanager;

--
-- Name: get_bucket_by_code(text); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.get_bucket_by_code(p_bucket_code text) RETURNS public.token_buckets
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (SELECT * FROM token_buckets WHERE bucket_code = p_bucket_code);
END
$$;


ALTER FUNCTION public.get_bucket_by_code(p_bucket_code text) OWNER TO branchmanager;

--
-- Name: contests; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.contests (
    id integer NOT NULL,
    contest_code text NOT NULL,
    name text NOT NULL,
    description text,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    entry_fee numeric(20,0) DEFAULT 0,
    prize_pool numeric(20,0) DEFAULT 0,
    status public.contest_status DEFAULT 'pending'::public.contest_status,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    current_prize_pool numeric(20,0) DEFAULT 0,
    allowed_buckets integer[],
    participant_count integer DEFAULT 0,
    last_entry_time timestamp with time zone,
    min_participants integer DEFAULT 2,
    max_participants integer,
    entry_deadline timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    updated_at timestamp with time zone,
    CONSTRAINT contests_min_participants_check CHECK ((min_participants >= 2)),
    CONSTRAINT contests_participant_count_check CHECK ((participant_count >= 0)),
    CONSTRAINT valid_contest_code CHECK ((contest_code ~ '^[A-Z0-9-]{3,20}$'::text)),
    CONSTRAINT valid_contest_dates CHECK (((start_time < end_time) AND ((entry_deadline IS NULL) OR (entry_deadline <= start_time)))),
    CONSTRAINT valid_participant_range CHECK ((min_participants <= max_participants))
);


ALTER TABLE public.contests OWNER TO branchmanager;

--
-- Name: get_contest_by_code(text); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.get_contest_by_code(p_contest_code text) RETURNS public.contests
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (SELECT * FROM contests WHERE contest_code = p_contest_code);
END
$$;


ALTER FUNCTION public.get_contest_by_code(p_contest_code text) OWNER TO branchmanager;

--
-- Name: handle_token_status_change(); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.handle_token_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.is_active = false AND OLD.is_active = true THEN
        -- Remove from future/pending contests only
        DELETE FROM contest_token_buckets 
        WHERE token_id = NEW.id
        AND contest_id IN (
            SELECT id 
            FROM contests 
            WHERE status = 'pending'
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_token_status_change() OWNER TO branchmanager;

--
-- Name: tokens; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.tokens (
    id integer NOT NULL,
    address text NOT NULL,
    symbol text NOT NULL,
    name text NOT NULL,
    decimals integer DEFAULT 18,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    market_cap numeric(20,0),
    change_24h numeric(5,2),
    volume_24h numeric(20,0)
);


ALTER TABLE public.tokens OWNER TO branchmanager;

--
-- Name: insert_token(text, text, text, integer, boolean); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.insert_token(p_symbol text, p_name text, p_address text, p_decimals integer DEFAULT 18, p_is_active boolean DEFAULT true) RETURNS public.tokens
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_token tokens;
BEGIN
    INSERT INTO tokens (symbol, name, address, decimals, is_active)
    VALUES (p_symbol, p_name, p_address, p_decimals, p_is_active)
    RETURNING * INTO v_token;
    
    RETURN v_token;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Failed to insert token: %', SQLERRM;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.insert_token(p_symbol text, p_name text, p_address text, p_decimals integer, p_is_active boolean) OWNER TO branchmanager;

--
-- Name: is_valid_contest_code(text); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.is_valid_contest_code(p_contest_code text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM contests WHERE contest_code = p_contest_code);
END
$$;


ALTER FUNCTION public.is_valid_contest_code(p_contest_code text) OWNER TO branchmanager;

--
-- Name: refresh_leaderboard(); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.refresh_leaderboard() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY contest_leaderboard;
    RETURN NULL;
END
$$;


ALTER FUNCTION public.refresh_leaderboard() OWNER TO branchmanager;

--
-- Name: update_audit_fields(); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.update_audit_fields() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END
$$;


ALTER FUNCTION public.update_audit_fields() OWNER TO branchmanager;

--
-- Name: update_contest_status(); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.update_contest_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.start_time <= CURRENT_TIMESTAMP AND NEW.status = 'pending' THEN
        NEW.status := 'active';
    ELSIF NEW.end_time <= CURRENT_TIMESTAMP AND NEW.status = 'active' THEN
        NEW.status := 'completed';
    END IF;
    RETURN NEW;
END
$$;


ALTER FUNCTION public.update_contest_status() OWNER TO branchmanager;

--
-- Name: validate_portfolio_buckets(); Type: FUNCTION; Schema: public; Owner: branchmanager
--

CREATE FUNCTION public.validate_portfolio_buckets() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if the NEW token is in any of the allowed buckets
    IF EXISTS (
        SELECT 1
        FROM token_bucket_memberships tbm
        WHERE tbm.token_id = NEW.token_id  -- Check NEW token
        AND tbm.bucket_id = ANY(
            SELECT unnest(allowed_buckets) 
            FROM contests 
            WHERE id = NEW.contest_id
        )
    ) THEN
        RETURN NEW;
    ELSE
        RAISE EXCEPTION 'Token not in allowed buckets for this contest';
    END IF;
END
$$;


ALTER FUNCTION public.validate_portfolio_buckets() OWNER TO branchmanager;

--
-- Name: active_contests_summary; Type: VIEW; Schema: public; Owner: branchmanager
--

CREATE VIEW public.active_contests_summary AS
SELECT
    NULL::integer AS id,
    NULL::text AS contest_code,
    NULL::text AS name,
    NULL::text AS description,
    NULL::timestamp with time zone AS start_time,
    NULL::timestamp with time zone AS end_time,
    NULL::numeric(20,0) AS entry_fee,
    NULL::numeric(20,0) AS prize_pool,
    NULL::public.contest_status AS status,
    NULL::jsonb AS settings,
    NULL::timestamp with time zone AS created_at,
    NULL::numeric(20,0) AS current_prize_pool,
    NULL::integer[] AS allowed_buckets,
    NULL::integer AS participant_count,
    NULL::timestamp with time zone AS last_entry_time,
    NULL::integer AS min_participants,
    NULL::integer AS max_participants,
    NULL::timestamp with time zone AS entry_deadline,
    NULL::timestamp with time zone AS cancelled_at,
    NULL::text AS cancellation_reason,
    NULL::timestamp with time zone AS updated_at,
    NULL::bigint AS current_participants,
    NULL::text[] AS bucket_names;


ALTER VIEW public.active_contests_summary OWNER TO branchmanager;

--
-- Name: contest_participants; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.contest_participants (
    contest_id integer NOT NULL,
    wallet_address text NOT NULL,
    initial_balance numeric(20,0) DEFAULT 1000000,
    current_balance numeric(20,0) DEFAULT 1000000,
    rank integer,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    entry_transaction_id integer,
    entry_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    final_rank integer,
    prize_amount numeric(20,0),
    prize_paid_at timestamp with time zone,
    prize_transaction_id integer
);


ALTER TABLE public.contest_participants OWNER TO branchmanager;

--
-- Name: users; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.users (
    wallet_address text NOT NULL,
    nickname text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone,
    total_contests integer DEFAULT 0,
    total_wins integer DEFAULT 0,
    total_earnings numeric(20,0) DEFAULT 0,
    rank_score integer DEFAULT 1000,
    settings jsonb DEFAULT '{}'::jsonb,
    balance numeric(20,0) DEFAULT 0,
    is_banned boolean DEFAULT false,
    ban_reason text,
    last_deposit_at timestamp with time zone,
    last_withdrawal_at timestamp with time zone,
    kyc_status text,
    risk_level integer DEFAULT 0,
    updated_at timestamp with time zone,
    CONSTRAINT users_balance_check CHECK ((balance >= (0)::numeric)),
    CONSTRAINT users_risk_level_check CHECK (((risk_level >= 0) AND (risk_level <= 100)))
);


ALTER TABLE public.users OWNER TO branchmanager;

--
-- Name: contest_leaderboard; Type: MATERIALIZED VIEW; Schema: public; Owner: branchmanager
--

CREATE MATERIALIZED VIEW public.contest_leaderboard AS
 SELECT cp.contest_id,
    c.contest_code,
    cp.wallet_address,
    u.nickname,
    cp.current_balance,
    cp.rank,
    row_number() OVER (PARTITION BY cp.contest_id ORDER BY cp.current_balance DESC) AS live_rank
   FROM ((public.contest_participants cp
     JOIN public.users u ON ((cp.wallet_address = u.wallet_address)))
     JOIN public.contests c ON ((cp.contest_id = c.id)))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.contest_leaderboard OWNER TO branchmanager;

--
-- Name: contest_portfolios; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.contest_portfolios (
    contest_id integer NOT NULL,
    wallet_address text NOT NULL,
    token_id integer NOT NULL,
    weight integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contest_portfolios_weight_check CHECK ((weight > 0))
);


ALTER TABLE public.contest_portfolios OWNER TO branchmanager;

--
-- Name: contest_templates; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.contest_templates (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    duration_minutes integer,
    entry_fee numeric DEFAULT 0,
    max_participants integer DEFAULT 2,
    bucket_requirements jsonb,
    scoring_rules jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.contest_templates OWNER TO branchmanager;

--
-- Name: contest_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: branchmanager
--

CREATE SEQUENCE public.contest_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contest_templates_id_seq OWNER TO branchmanager;

--
-- Name: contest_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: branchmanager
--

ALTER SEQUENCE public.contest_templates_id_seq OWNED BY public.contest_templates.id;


--
-- Name: contest_token_buckets; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.contest_token_buckets (
    contest_id integer NOT NULL,
    token_id integer NOT NULL,
    bucket_id integer NOT NULL
);


ALTER TABLE public.contest_token_buckets OWNER TO branchmanager;

--
-- Name: contest_token_performance; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.contest_token_performance (
    contest_id integer NOT NULL,
    wallet_address text NOT NULL,
    token_id integer NOT NULL,
    profit_loss numeric(20,8) DEFAULT 0,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.contest_token_performance OWNER TO branchmanager;

--
-- Name: contest_token_prices; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.contest_token_prices (
    contest_id integer NOT NULL,
    wallet_address text NOT NULL,
    token_id integer NOT NULL,
    amount numeric(20,0) DEFAULT 0,
    price numeric(20,8) NOT NULL,
    "timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.contest_token_prices OWNER TO branchmanager;

--
-- Name: contests_id_seq; Type: SEQUENCE; Schema: public; Owner: branchmanager
--

CREATE SEQUENCE public.contests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contests_id_seq OWNER TO branchmanager;

--
-- Name: contests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: branchmanager
--

ALTER SEQUENCE public.contests_id_seq OWNED BY public.contests.id;


--
-- Name: token_bucket_memberships; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.token_bucket_memberships (
    bucket_id integer NOT NULL,
    token_id integer NOT NULL
);


ALTER TABLE public.token_bucket_memberships OWNER TO branchmanager;

--
-- Name: token_buckets_id_seq; Type: SEQUENCE; Schema: public; Owner: branchmanager
--

CREATE SEQUENCE public.token_buckets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.token_buckets_id_seq OWNER TO branchmanager;

--
-- Name: token_buckets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: branchmanager
--

ALTER SEQUENCE public.token_buckets_id_seq OWNED BY public.token_buckets.id;


--
-- Name: token_prices; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.token_prices (
    token_id integer NOT NULL,
    price numeric(20,8) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.token_prices OWNER TO branchmanager;

--
-- Name: tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: branchmanager
--

CREATE SEQUENCE public.tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tokens_id_seq OWNER TO branchmanager;

--
-- Name: tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: branchmanager
--

ALTER SEQUENCE public.tokens_id_seq OWNED BY public.tokens.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    wallet_address text,
    type public.transaction_type NOT NULL,
    amount numeric(20,0) NOT NULL,
    balance_before numeric(20,0) NOT NULL,
    balance_after numeric(20,0) NOT NULL,
    contest_id integer,
    description text,
    status public.transaction_status DEFAULT 'completed'::public.transaction_status,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp with time zone,
    CONSTRAINT valid_amount CHECK ((amount <> (0)::numeric)),
    CONSTRAINT valid_balance_change CHECK ((balance_after >= (0)::numeric))
);


ALTER TABLE public.transactions OWNER TO branchmanager;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: branchmanager
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO branchmanager;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: branchmanager
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.user_achievements (
    id integer NOT NULL,
    wallet_address text,
    achievement_type text NOT NULL,
    value jsonb,
    achieved_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_achievements OWNER TO branchmanager;

--
-- Name: user_achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: branchmanager
--

CREATE SEQUENCE public.user_achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_achievements_id_seq OWNER TO branchmanager;

--
-- Name: user_achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: branchmanager
--

ALTER SEQUENCE public.user_achievements_id_seq OWNED BY public.user_achievements.id;


--
-- Name: user_contest_summary; Type: VIEW; Schema: public; Owner: branchmanager
--

CREATE VIEW public.user_contest_summary AS
 SELECT u.wallet_address,
    u.nickname,
    count(cp.contest_id) AS total_contests_entered,
    sum(cp.prize_amount) AS total_prizes_won,
    max(c.end_time) AS last_contest_date,
    count(
        CASE
            WHEN (cp.final_rank = 1) THEN 1
            ELSE NULL::integer
        END) AS first_place_wins,
    array_agg(c.contest_code ORDER BY c.end_time DESC) AS recent_contests,
    array_agg(c.name ORDER BY c.end_time DESC) AS recent_contest_names
   FROM ((public.users u
     LEFT JOIN public.contest_participants cp ON ((u.wallet_address = cp.wallet_address)))
     LEFT JOIN public.contests c ON ((cp.contest_id = c.id)))
  GROUP BY u.wallet_address, u.nickname;


ALTER VIEW public.user_contest_summary OWNER TO branchmanager;

--
-- Name: user_social_profiles; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.user_social_profiles (
    wallet_address text NOT NULL,
    platform text NOT NULL,
    platform_user_id text NOT NULL,
    username text NOT NULL,
    verified boolean DEFAULT false,
    verification_date timestamp with time zone,
    last_verified timestamp with time zone,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_social_profiles OWNER TO branchmanager;

--
-- Name: user_stats; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.user_stats (
    wallet_address text NOT NULL,
    contests_entered integer DEFAULT 0,
    contests_won integer DEFAULT 0,
    total_prize_money numeric DEFAULT 0,
    best_score numeric,
    avg_score numeric,
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_stats OWNER TO branchmanager;

--
-- Name: user_token_stats; Type: TABLE; Schema: public; Owner: branchmanager
--

CREATE TABLE public.user_token_stats (
    wallet_address text NOT NULL,
    token_address text NOT NULL,
    times_picked integer DEFAULT 0,
    wins_with_token integer DEFAULT 0,
    avg_score_with_token numeric
);


ALTER TABLE public.user_token_stats OWNER TO branchmanager;

--
-- Name: contest_templates id; Type: DEFAULT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_templates ALTER COLUMN id SET DEFAULT nextval('public.contest_templates_id_seq'::regclass);


--
-- Name: contests id; Type: DEFAULT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contests ALTER COLUMN id SET DEFAULT nextval('public.contests_id_seq'::regclass);


--
-- Name: token_buckets id; Type: DEFAULT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.token_buckets ALTER COLUMN id SET DEFAULT nextval('public.token_buckets_id_seq'::regclass);


--
-- Name: tokens id; Type: DEFAULT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.tokens ALTER COLUMN id SET DEFAULT nextval('public.tokens_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: user_achievements id; Type: DEFAULT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.user_achievements ALTER COLUMN id SET DEFAULT nextval('public.user_achievements_id_seq'::regclass);


--
-- Name: contest_participants contest_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_participants
    ADD CONSTRAINT contest_participants_pkey PRIMARY KEY (contest_id, wallet_address);


--
-- Name: contest_portfolios contest_portfolios_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_portfolios
    ADD CONSTRAINT contest_portfolios_pkey PRIMARY KEY (contest_id, wallet_address, token_id);


--
-- Name: contest_templates contest_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_templates
    ADD CONSTRAINT contest_templates_pkey PRIMARY KEY (id);


--
-- Name: contest_token_buckets contest_token_buckets_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_token_buckets
    ADD CONSTRAINT contest_token_buckets_pkey PRIMARY KEY (contest_id, token_id, bucket_id);


--
-- Name: contest_token_performance contest_token_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_token_performance
    ADD CONSTRAINT contest_token_performance_pkey PRIMARY KEY (contest_id, wallet_address, token_id, "timestamp");


--
-- Name: contest_token_prices contest_token_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_token_prices
    ADD CONSTRAINT contest_token_prices_pkey PRIMARY KEY (contest_id, wallet_address, token_id, "timestamp");


--
-- Name: contests contests_contest_code_key; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contests
    ADD CONSTRAINT contests_contest_code_key UNIQUE (contest_code);


--
-- Name: contests contests_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contests
    ADD CONSTRAINT contests_pkey PRIMARY KEY (id);


--
-- Name: token_bucket_memberships token_bucket_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.token_bucket_memberships
    ADD CONSTRAINT token_bucket_memberships_pkey PRIMARY KEY (bucket_id, token_id);


--
-- Name: token_buckets token_buckets_bucket_code_key; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.token_buckets
    ADD CONSTRAINT token_buckets_bucket_code_key UNIQUE (bucket_code);


--
-- Name: token_buckets token_buckets_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.token_buckets
    ADD CONSTRAINT token_buckets_pkey PRIMARY KEY (id);


--
-- Name: token_prices token_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.token_prices
    ADD CONSTRAINT token_prices_pkey PRIMARY KEY (token_id);


--
-- Name: tokens tokens_address_key; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_address_key UNIQUE (address);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: tokens unique_token_symbol; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT unique_token_symbol UNIQUE (symbol);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_social_profiles user_social_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.user_social_profiles
    ADD CONSTRAINT user_social_profiles_pkey PRIMARY KEY (wallet_address, platform);


--
-- Name: user_social_profiles user_social_profiles_platform_platform_user_id_key; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.user_social_profiles
    ADD CONSTRAINT user_social_profiles_platform_platform_user_id_key UNIQUE (platform, platform_user_id);


--
-- Name: user_stats user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.user_stats
    ADD CONSTRAINT user_stats_pkey PRIMARY KEY (wallet_address);


--
-- Name: user_token_stats user_token_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.user_token_stats
    ADD CONSTRAINT user_token_stats_pkey PRIMARY KEY (wallet_address, token_address);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (wallet_address);


--
-- Name: contest_leaderboard_contest_id_wallet_address_idx; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE UNIQUE INDEX contest_leaderboard_contest_id_wallet_address_idx ON public.contest_leaderboard USING btree (contest_id, wallet_address);


--
-- Name: idx_contest_leaderboard_balance; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_contest_leaderboard_balance ON public.contest_leaderboard USING btree (current_balance DESC);


--
-- Name: idx_contest_participants_joined; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_contest_participants_joined ON public.contest_participants USING btree (joined_at);


--
-- Name: idx_contest_participants_wallet; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_contest_participants_wallet ON public.contest_participants USING btree (wallet_address);


--
-- Name: idx_contest_portfolios_contest; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_contest_portfolios_contest ON public.contest_portfolios USING btree (contest_id);


--
-- Name: idx_contest_portfolios_lookup; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_contest_portfolios_lookup ON public.contest_portfolios USING btree (contest_id, wallet_address);


--
-- Name: idx_contest_portfolios_wallet; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_contest_portfolios_wallet ON public.contest_portfolios USING btree (wallet_address);


--
-- Name: idx_contests_code; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_contests_code ON public.contests USING btree (contest_code);


--
-- Name: idx_contests_status_start; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_contests_status_start ON public.contests USING btree (status, start_time);


--
-- Name: idx_contests_status_time; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_contests_status_time ON public.contests USING btree (status, start_time, end_time);


--
-- Name: idx_token_bucket_memberships_token; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_token_bucket_memberships_token ON public.token_bucket_memberships USING btree (token_id);


--
-- Name: idx_token_buckets_code; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_token_buckets_code ON public.token_buckets USING btree (bucket_code);


--
-- Name: idx_token_prices_updated; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_token_prices_updated ON public.token_prices USING btree (updated_at DESC);


--
-- Name: idx_tokens_active; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_tokens_active ON public.tokens USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_tokens_symbol; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_tokens_symbol ON public.tokens USING btree (symbol);


--
-- Name: idx_transactions_contest; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_transactions_contest ON public.transactions USING btree (contest_id);


--
-- Name: idx_transactions_type_created; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_transactions_type_created ON public.transactions USING btree (type, created_at);


--
-- Name: idx_transactions_wallet; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_transactions_wallet ON public.transactions USING btree (wallet_address);


--
-- Name: idx_user_social_profiles_platform; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_user_social_profiles_platform ON public.user_social_profiles USING btree (platform, platform_user_id);


--
-- Name: idx_users_balance; Type: INDEX; Schema: public; Owner: branchmanager
--

CREATE INDEX idx_users_balance ON public.users USING btree (balance);


--
-- Name: active_contests_summary _RETURN; Type: RULE; Schema: public; Owner: branchmanager
--

CREATE OR REPLACE VIEW public.active_contests_summary AS
 SELECT c.id,
    c.contest_code,
    c.name,
    c.description,
    c.start_time,
    c.end_time,
    c.entry_fee,
    c.prize_pool,
    c.status,
    c.settings,
    c.created_at,
    c.current_prize_pool,
    c.allowed_buckets,
    c.participant_count,
    c.last_entry_time,
    c.min_participants,
    c.max_participants,
    c.entry_deadline,
    c.cancelled_at,
    c.cancellation_reason,
    c.updated_at,
    count(cp.wallet_address) AS current_participants,
    array_agg(DISTINCT tb.name) AS bucket_names
   FROM (((public.contests c
     LEFT JOIN public.contest_participants cp ON ((c.id = cp.contest_id)))
     LEFT JOIN LATERAL unnest(c.allowed_buckets) b(bucket_id) ON (true))
     LEFT JOIN public.token_buckets tb ON ((tb.id = b.bucket_id)))
  WHERE (c.status = 'active'::public.contest_status)
  GROUP BY c.id;


--
-- Name: token_buckets bucket_deletion_cleanup; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER bucket_deletion_cleanup BEFORE DELETE ON public.token_buckets FOR EACH ROW EXECUTE FUNCTION public.cleanup_bucket_relationships();


--
-- Name: contest_portfolios check_portfolio_weight; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER check_portfolio_weight BEFORE INSERT OR UPDATE ON public.contest_portfolios FOR EACH ROW EXECUTE FUNCTION public.check_portfolio_total_weight();


--
-- Name: contests contest_auto_populate_buckets; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER contest_auto_populate_buckets AFTER INSERT ON public.contests FOR EACH ROW EXECUTE FUNCTION public.auto_populate_contest_buckets();


--
-- Name: contests contest_deletion_cleanup; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER contest_deletion_cleanup BEFORE DELETE ON public.contests FOR EACH ROW EXECUTE FUNCTION public.cleanup_contest_relationships();


--
-- Name: contests contest_status_update; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER contest_status_update BEFORE UPDATE ON public.contests FOR EACH ROW EXECUTE FUNCTION public.update_contest_status();


--
-- Name: contest_participants refresh_leaderboard_trigger; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER refresh_leaderboard_trigger AFTER INSERT OR UPDATE ON public.contest_participants FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_leaderboard();


--
-- Name: token_bucket_memberships token_bucket_auto_populate_contests; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER token_bucket_auto_populate_contests AFTER INSERT ON public.token_bucket_memberships FOR EACH ROW EXECUTE FUNCTION public.auto_populate_token_buckets();


--
-- Name: tokens token_deletion_cleanup; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER token_deletion_cleanup BEFORE DELETE ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.cleanup_token_relationships();


--
-- Name: tokens token_status_change; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER token_status_change AFTER UPDATE OF is_active ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.handle_token_status_change();


--
-- Name: contests update_contest_audit; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER update_contest_audit BEFORE UPDATE ON public.contests FOR EACH ROW EXECUTE FUNCTION public.update_audit_fields();


--
-- Name: users update_user_audit; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER update_user_audit BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_audit_fields();


--
-- Name: contest_portfolios validate_portfolio_buckets; Type: TRIGGER; Schema: public; Owner: branchmanager
--

CREATE TRIGGER validate_portfolio_buckets BEFORE INSERT OR UPDATE ON public.contest_portfolios FOR EACH ROW EXECUTE FUNCTION public.validate_portfolio_buckets();


--
-- Name: contest_participants contest_participants_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_participants
    ADD CONSTRAINT contest_participants_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id);


--
-- Name: contest_participants contest_participants_entry_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_participants
    ADD CONSTRAINT contest_participants_entry_transaction_id_fkey FOREIGN KEY (entry_transaction_id) REFERENCES public.transactions(id);


--
-- Name: contest_participants contest_participants_prize_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_participants
    ADD CONSTRAINT contest_participants_prize_transaction_id_fkey FOREIGN KEY (prize_transaction_id) REFERENCES public.transactions(id);


--
-- Name: contest_participants contest_participants_wallet_address_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_participants
    ADD CONSTRAINT contest_participants_wallet_address_fkey FOREIGN KEY (wallet_address) REFERENCES public.users(wallet_address);


--
-- Name: contest_portfolios contest_portfolios_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_portfolios
    ADD CONSTRAINT contest_portfolios_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id);


--
-- Name: contest_portfolios contest_portfolios_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_portfolios
    ADD CONSTRAINT contest_portfolios_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id);


--
-- Name: contest_portfolios contest_portfolios_wallet_address_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_portfolios
    ADD CONSTRAINT contest_portfolios_wallet_address_fkey FOREIGN KEY (wallet_address) REFERENCES public.users(wallet_address);


--
-- Name: contest_token_buckets contest_token_buckets_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_token_buckets
    ADD CONSTRAINT contest_token_buckets_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id);


--
-- Name: contest_token_buckets contest_token_buckets_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_token_buckets
    ADD CONSTRAINT contest_token_buckets_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id);


--
-- Name: contest_token_performance contest_token_performance_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_token_performance
    ADD CONSTRAINT contest_token_performance_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id);


--
-- Name: contest_token_performance contest_token_performance_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_token_performance
    ADD CONSTRAINT contest_token_performance_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id);


--
-- Name: contest_token_performance contest_token_performance_wallet_address_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_token_performance
    ADD CONSTRAINT contest_token_performance_wallet_address_fkey FOREIGN KEY (wallet_address) REFERENCES public.users(wallet_address);


--
-- Name: contest_token_prices contest_token_prices_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_token_prices
    ADD CONSTRAINT contest_token_prices_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id);


--
-- Name: contest_token_prices contest_token_prices_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_token_prices
    ADD CONSTRAINT contest_token_prices_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id);


--
-- Name: contest_token_prices contest_token_prices_wallet_address_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.contest_token_prices
    ADD CONSTRAINT contest_token_prices_wallet_address_fkey FOREIGN KEY (wallet_address) REFERENCES public.users(wallet_address);


--
-- Name: token_bucket_memberships token_bucket_memberships_bucket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.token_bucket_memberships
    ADD CONSTRAINT token_bucket_memberships_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES public.token_buckets(id);


--
-- Name: token_bucket_memberships token_bucket_memberships_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.token_bucket_memberships
    ADD CONSTRAINT token_bucket_memberships_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id);


--
-- Name: token_prices token_prices_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.token_prices
    ADD CONSTRAINT token_prices_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.tokens(id);


--
-- Name: transactions transactions_contest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_contest_id_fkey FOREIGN KEY (contest_id) REFERENCES public.contests(id);


--
-- Name: transactions transactions_wallet_address_fkey; Type: FK CONSTRAINT; Schema: public; Owner: branchmanager
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_wallet_address_fkey FOREIGN KEY (wallet_address) REFERENCES public.users(wallet_address);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO branchmanager;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO branchmanager;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO branchmanager;


--
-- PostgreSQL database dump complete
--

