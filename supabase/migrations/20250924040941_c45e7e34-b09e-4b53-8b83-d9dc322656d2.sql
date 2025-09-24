-- Make asaga2003@gmail.com account a verified provider admin
-- Update client role to provider
UPDATE clients 
SET role = 'provider' 
WHERE email = 'asaga2003@gmail.com';

-- Update profile to be verified tasker
UPDATE profiles 
SET 
  verification_status = 'verified',
  is_tasker = true,
  updated_at = now()
WHERE user_id IN (
  SELECT auth.uid() FROM auth.users WHERE email = 'asaga2003@gmail.com'
);

-- Get client ID for document insertion
DO $$
DECLARE
  client_uuid uuid;
BEGIN
  SELECT id INTO client_uuid FROM clients WHERE email = 'asaga2003@gmail.com';
  
  -- Insert verified documents if client exists
  IF client_uuid IS NOT NULL THEN
    -- Insert required verified documents
    INSERT INTO documents (client_id, doc_type, verification_status, file_url, uploaded_at)
    VALUES 
      (client_uuid, 'id_card', 'verified', 'https://example.com/fake-id.pdf', now()),
      (client_uuid, 'proof_of_address', 'verified', 'https://example.com/fake-address.pdf', now()),
      (client_uuid, 'criminal_record', 'verified', 'https://example.com/fake-criminal.pdf', now())
    ON CONFLICT (client_id, doc_type) DO UPDATE SET
      verification_status = 'verified',
      uploaded_at = now();
  END IF;
END $$;