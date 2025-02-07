# DegenDuel API Documentation

## Base URLs

- **Main API:** `https://degenduel.me/api/`
- **Data API:** `https://data.degenduel.me/api/`

---

## POST Create New Contest

- **Endpoint:** `/contests`
- **Method:** `POST`
- **Description:** Creates a new contest with the provided details.
- **Request Body (JSON):**
  ```json
  {
    "name": "The Game is My Valentine",
    "contest_code": "FEB-2025-02-1",
    "description": "My girlfriend is crypto",
    "entry_fee": "6969",
    "start_time": "2025-02-01T00:00:00Z",
    "end_time": "2025-02-28T23:59:59Z",
    "min_participants": 31,
    "max_participants": 69,
    "allowed_buckets": [1, 2, 3, 4, 5, 6, 7, 8, 9]
  }
  ```
- **Response:** None specified.

---

## PUT Update Contest Details

- **Endpoint:** `/contests/{{contest_id}}`
- **Method:** `PUT`
- **Description:** Updates an existing contest with new details.
- **Request Body (JSON):**
  ```json
  {
    "name": "Jeet Orgy",
    "contest_code": "VDAY-2025-02",
    "entry_fee": "0.69",
    "start_time": "2025-02-01T00:00:00Z",
    "end_time": "2025-02-28T23:59:59Z",
    "min_participants": 31,
    "max_participants": 69,
    "allowed_buckets": [1, 2, 3, 4, 5, 6, 7, 8, 9]
  }
  ```
- **Response:** None specified.

---

## GET Contests List

- **Endpoint:** `/contests`
- **Method:** `GET`
- **Description:** Retrieves a paginated list of contests based on filters.
- **Query Parameters:**
  - `status`: Filter by contest status (e.g., `active`, `completed`).
  - `limit`: Number of contests to retrieve.
  - `offset`: Starting point for pagination.
- **Response:** None specified.

---

## POST Enter User Into Contest

- **Endpoint:** `/contests/{{contest_id}}/join`
- **Method:** `POST`
- **Description:** Adds a user to a contest.
- **Request Body (JSON):**
  ```json
  {
    "wallet_address": "{{wallet_address}}"
  }
  ```
- **Response:** None specified.

---

## POST Set User's Contest Portfolio

- **Endpoint:** `/contests/{{contest_id}}/portfolio`
- **Method:** `POST`
- **Description:** Sets the user's portfolio for a contest.
- **Request Body (JSON):**
  ```json
  {
    "wallet_address": "{{wallet_address}}",
    "tokens": [
      { "token_id": 5, "weight": 50 },
      { "token_id": 6, "weight": 30 },
      { "token_id": 7, "weight": 20 }
    ]
  }
  ```
- **Response:** None specified.

---

## GET User's Contest Portfolio

- **Endpoint:** `/contests/{{contest_id}}/portfolio/{{wallet_address}}`
- **Method:** `GET`
- **Description:** Retrieves the portfolio of a specific user in a contest.
- **Response:** None specified.

---

## GET Contest Detail

- **Endpoint:** `/contests/{{contest_id}}`
- **Method:** `GET`
- **Description:** Retrieves details of a specific contest.
- **Response:** None specified.

---

## POST Contest Start

- **Endpoint:** `/contests/{{contest_id}}/start`
- **Method:** `POST`
- **Description:** Starts a contest.
- **Request Body (JSON):**
  ```json
  {
    "wallet_address": "{{AdminWalletAddress}}"
  }
  ```
- **Response:** None specified.

---

## POST Contest End

- **Endpoint:** `/contests/{{contest_id}}/end`
- **Method:** `POST`
- **Description:** Ends a contest.
- **Request Body (JSON):**
  ```json
  {
    "wallet_address": "{{AdminWalletAddress}}"
  }
  ```
- **Response:** None specified.

---

## GET Tokens List

- **Endpoint:** `/dd-serv/tokens/list`
- **Method:** `GET`
- **Description:** Retrieves a list of tokens.
- **Query Parameters:**
  - `detail`: `simple` for basic info, `full` for detailed info.
- **Response:** None specified.

---

## POST Bulk Price Requests

- **Endpoint:** `/prices/bulk`
- **Method:** `POST`
- **Description:** Retrieves prices for multiple tokens.
- **Request Body (JSON):**
  ```json
  {
    "addresses": [
      "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
      "So11111111111111111111111111111111111111112",
      "Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump"
    ]
  }
  ```
- **Response:** None specified.

---

## POST Bulk Price History Requests

- **Endpoint:** `/dd-serv/tokens/bulk-price-history`
- **Method:** `POST`
- **Description:** Retrieves historical price data for multiple tokens.
- **Request Body (JSON):**
  ```json
  {
    "addresses": [
      "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC",
      "So11111111111111111111111111111111111111112",
      "Gu3LDkn7Vx3bmCzLafYNKcDxv2mH7YN44NJZFXnypump"
    ]
  }
  ```
- **Response:** None specified.

---

## GET User Detail

- **Endpoint:** `/users/{{AdminWalletAddress}}`
- **Method:** `GET`
- **Description:** Retrieves details of a specific user.
- **Response:** None specified.
