

## Problem

The user `asaga2003@gmail.com` does not have an `admin` role in the `user_roles` table. They only have `client`. The Header code correctly checks `isAdmin` from `useUserRole()`, which queries `user_roles` — but since no admin row exists, the "Panel Admin" menu item is hidden.

## Plan

**Insert the admin role** for user `asaga2003@gmail.com` into the `user_roles` table:

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'asaga2003@gmail.com';
```

No code changes needed — the Header already has the conditional rendering for `isAdmin`. Once the role is inserted, the "Panel Admin" link will appear in both the desktop dropdown and the mobile hamburger menu.

## Technical Note

The published site at `chamby.mx` may also be running an older deploy (the dropdown shows "Pagos" and "Seguridad" instead of "Facturas" and "Configuración"). You may want to re-publish after confirming the admin link works in the preview.

