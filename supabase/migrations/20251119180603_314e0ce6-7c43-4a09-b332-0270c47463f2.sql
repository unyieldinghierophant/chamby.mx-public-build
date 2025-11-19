-- First, mark a provider as verified for testing
UPDATE profiles 
SET verification_status = 'verified'
WHERE id = '8be23337-6043-41b1-8559-b51629ef0e91';

-- Now insert a test job with status='active' to trigger notifications
INSERT INTO jobs (
  title,
  description,
  category,
  rate,
  status,
  client_id,
  location,
  visit_fee_paid
) VALUES (
  'TEST: Reparación de fuga urgente',
  'Prueba del sistema de notificaciones - fuga en tubería principal',
  'plomeria',
  500,
  'active',
  'f24a4912-6ab9-4b1a-89d1-13072bfc6283',
  'Colonia Centro, CDMX',
  true
);