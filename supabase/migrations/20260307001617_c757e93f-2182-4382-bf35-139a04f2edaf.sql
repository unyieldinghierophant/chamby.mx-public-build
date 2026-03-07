INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'asaga2003@gmail.com';