
-- Add admin role to all asaga2003 accounts that don't already have it
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('a093f9f2-4b19-41d1-832d-53882d0b2d1a', 'admin'),  -- asaga2003+1
  ('a55a71c5-ec82-4b11-95d2-14ee50d10e53', 'admin'),  -- asaga2003+10
  ('84c28b14-99e4-400c-8e9a-ae82018bcf4a', 'admin'),  -- asaga2003+11
  ('5ac3c25e-7624-4da5-8024-6222dadea015', 'admin'),  -- asaga2003+12
  ('5d5fa36e-681b-405b-aad7-ada7274bd370', 'admin'),  -- asaga2003+13
  ('6d82210c-84c8-4dc3-b8d9-0adbd8317a5b', 'admin'),  -- asaga2003+2
  ('af82c566-b7f6-4129-bc5a-e85d2e7e97ba', 'admin'),  -- asaga2003+3
  ('b93d3862-ebcd-402f-9b64-2e689077d5c5', 'admin'),  -- asaga2003+4
  ('41cbd7fe-c6c6-46b4-9530-7e79a95da72d', 'admin'),  -- asaga2003+6
  ('e6c56839-227b-4cbc-ac17-1606e18e4721', 'admin'),  -- asaga2003+7
  ('b9d3dece-1fcf-4c58-8a0c-66b485573f30', 'admin'),  -- asaga2003+8
  ('8718e624-bf0f-4665-8666-a02243955797', 'admin')   -- asaga2003+9
ON CONFLICT (user_id, role) DO NOTHING;
