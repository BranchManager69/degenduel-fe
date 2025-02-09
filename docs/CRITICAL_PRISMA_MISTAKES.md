# Critical Prisma Migration Error Documentation

## The Catastrophic Mistake

During an attempt to consolidate maintenance mode settings, a catastrophic error was made by running:

```bash
npx prisma migrate reset --force
```

This command was run without:

1. Checking for existing data
2. Verifying backup existence
3. Understanding the full implications
4. READING THE DOCUMENTATION PROPERLY

## Why This Command is Dangerous

The `prisma migrate reset` command:

1. DROPS ALL TABLES in the database
2. Recreates them from scratch
3. Destroys all production data
4. Cannot be undone

## How This Error Occurred

1. Initial Problem:

   - Encountered error: "The table `system_settings` does not exist in the shadow database"
   - CORRECT approach would have been to:
     - Check actual database state first
     - Create a proper baseline migration
     - Never use `--force` on a production database

2. Critical Mistake:
   - Instead of carefully diagnosing the issue
   - Jumped to using a destructive command
   - Failed to read warning messages
   - Ignored the implications of `--force`

## Proper Approach That Should Have Been Taken

1. First, check actual database state:

   ```sql
   \d system_settings
   ```

2. If table exists but isn't tracked:

   ```bash
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
   ```

3. Create baseline migration WITHOUT resetting:

   ```bash
   npx prisma migrate dev --create-only
   ```

4. Manually mark migration as applied:
   ```bash
   npx prisma migrate resolve --applied [migration_name]
   ```

## Critical Rules for Future Reference

1. NEVER use `migrate reset` on production
2. NEVER use `--force` without understanding implications
3. ALWAYS verify backup existence
4. ALWAYS check current database state
5. ALWAYS use `--create-only` for migrations on existing databases
6. WHEN IN DOUBT, CREATE A BACKUP FIRST

## Recovery Process Documentation

[To be completed after recovery attempt]

## Final Note

This error represents a fundamental failure to follow basic database safety protocols. It must never be repeated.
