# Chamby Admin Panel Setup Guide

## Accessing the Admin Panel

The admin panel is located at:
- **Production**: `https://admin.chamby.mx/admin/dashboard`
- **Development**: `http://localhost:5173/admin/dashboard`

## Creating Your First Admin User

To set up your first admin user, you need to manually add the admin role in the Supabase database.

### Step 1: Get Your User ID

1. Sign in to your Chamby account
2. Go to Supabase Dashboard → Authentication → Users
3. Find your user and copy the User ID (UUID)

### Step 2: Add Admin Role

Run this SQL query in Supabase SQL Editor:

```sql
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Optionally, add admin user details
INSERT INTO public.admin_users (user_id, department, is_active)
VALUES ('YOUR_USER_ID_HERE', 'operations', true)
ON CONFLICT (user_id) DO NOTHING;
```

### Step 3: Access Admin Panel

1. Sign out and sign back in to refresh your session
2. Navigate to `/admin/dashboard`
3. You should now have full admin access

## Admin Panel Features

### 1. Dashboard
- Real-time KPIs (jobs, payments, users, providers)
- Charts and analytics
- Recent activity feed
- Top providers leaderboard

### 2. Users & Providers
- Search and filter users
- View client vs provider accounts
- Verify/suspend users
- View user profiles and KYC documents

### 3. Jobs & Bookings
- Master list of all jobs
- Filter by status, category, date
- View job details and timeline
- Cancel or resolve jobs manually

### 4. Payments & Escrow
- View all payment transactions
- Manage provider invoices
- Release or hold payments
- Track platform fees and revenue

### 5. Support & Disputes
- View support tickets
- Manage disputes between clients and providers
- Track resolution status
- Internal notes and escalation

### 6. Content Management
- Manage service categories
- Configure pricing tiers
- Edit FAQ entries
- Create promo codes
- Manage notification templates
- Control banners and ads

### 7. Admin Roles & Permissions
- Create new admin users
- Assign departments (operations, finance, support, content)
- View admin activity logs
- Manage permission levels

## Admin Roles

### Admin
- Full system access
- Can manage all modules
- Create/modify other admins

### Moderator
- User and content management
- Support access
- Cannot manage payments or roles

### Finance
- Payment and financial data access
- Job oversight
- Cannot modify users or content

### Support
- Customer support and disputes
- User viewing (read-only)
- Cannot access payments

## Security Features

- Admin actions are logged in `admin_activity_log`
- Protected routes require admin role
- Automatic session validation
- Audit trail for all modifications

## Database Structure

### Tables
- `admin_users`: Admin-specific data and permissions
- `user_roles`: Role assignments (admin, provider, client)
- `admin_activity_log`: Audit trail of admin actions
- `admin_dashboard_stats`: Cached dashboard statistics

### Functions
- `is_admin(user_id)`: Check if user has admin role
- `get_top_providers(limit)`: Get top-performing providers
- `has_role(user_id, role)`: Generic role checking

## Customization

The admin panel uses Chamby's brand colors:
- Primary Blue: `#3771C8`
- Accent Orange: `#dd5b3b`

All colors are themed through the design system in `index.css` and `tailwind.config.ts`.

## Troubleshooting

### Can't access admin panel
- Verify admin role is correctly set in `user_roles` table
- Check that user is authenticated
- Clear browser cache and cookies
- Check browser console for errors

### Stats not loading
- Verify database views exist (`admin_dashboard_stats`)
- Check RLS policies allow admin access
- Ensure database functions are created

### Permission errors
- Confirm `is_admin()` function exists
- Verify RLS policies use the function correctly
- Check user session is valid

## Support

For technical issues or questions about the admin panel, contact the development team or check the Supabase logs at:
- Auth logs: View authentication issues
- Database logs: View query errors
- Edge function logs: View API errors
