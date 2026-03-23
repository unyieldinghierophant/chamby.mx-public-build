

## Fix: Move `pg_net` Extension Out of Public Schema

### Problem
The `pg_net` extension is installed in the `public` schema. Supabase recommends extensions live in a dedicated `extensions` schema to avoid polluting the public namespace and potential name collisions.

### What We'll Do
Create a migration that safely moves `pg_net` from `public` to the `extensions` schema. The extension's functions already live in the `net` schema (not `public`), so this is purely an ownership/metadata change — no function references break.

### Migration SQL
```sql
ALTER EXTENSION pg_net SET SCHEMA extensions;
```

### Risk Assessment
- **Very low risk**: `pg_net` functions live in the `net` schema, not `public`. Moving the extension metadata to `extensions` doesn't relocate those functions.
- No edge functions or client code reference `pg_net` directly through the `public` schema.
- This is a standard Supabase-recommended remediation.

