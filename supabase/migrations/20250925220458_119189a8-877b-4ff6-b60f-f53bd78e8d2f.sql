-- Add tags column to existing services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create indexes for search functionality
CREATE INDEX IF NOT EXISTS idx_services_name_search ON public.services USING gin (to_tsvector('spanish', name));
CREATE INDEX IF NOT EXISTS idx_services_category_search ON public.services USING gin (to_tsvector('spanish', category));
CREATE INDEX IF NOT EXISTS idx_services_tags_search ON public.services USING gin (tags);

-- Update existing services with appropriate tags
UPDATE public.services SET tags = ARRAY['limpieza', 'hogar', 'casa', 'apartamento', 'aseo', 'orden'] WHERE name = 'Limpieza del Hogar';
UPDATE public.services SET tags = ARRAY['plomería', 'fontanería', 'tuberías', 'grifos', 'fugas', 'agua'] WHERE name = 'Plomería Básica';
UPDATE public.services SET tags = ARRAY['electricidad', 'circuitos', 'instalaciones eléctricas', 'cableado', 'contactos', 'apagadores'] WHERE name = 'Electricidad Doméstica';
UPDATE public.services SET tags = ARRAY['jardinería', 'plantas', 'jardines', 'mantenimiento', 'poda', 'riego'] WHERE name = 'Jardinería';
UPDATE public.services SET tags = ARRAY['mudanzas', 'transporte', 'carga', 'descarga', 'embalaje', 'traslado'] WHERE name = 'Mudanzas';

-- Add the new services with their categories and comprehensive tags
INSERT INTO public.services (name, category, description, duration_hours, price_from, price_to, tags) VALUES
  -- Core Services
  ('Fontanería Profesional', 'Fontanería', 'Servicios especializados de fontanería e hidroneumáticos', 2, 50, 200, ARRAY['fontanería', 'plomería', 'hidroneumáticos', 'sistemas presión constante', 'sistema contraincendios', 'tuberías', 'fugas', 'instalaciones hidráulicas']),
  ('Servicios Eléctricos Especializados', 'Electricista', 'Instalaciones y reparaciones eléctricas profesionales', 3, 60, 250, ARRAY['electricidad', 'circuitos', 'instalaciones eléctricas', 'cableado', 'tableros eléctricos', 'contactos', 'apagadores']),
  ('Pintura y Decoración', 'Pintura', 'Pintura interior y exterior profesional', 8, 100, 500, ARRAY['pintar interiores', 'exteriores', 'barniz', 'esmalte', 'impermeabilizante', 'decoración']),
  ('Impermeabilización de Techos', 'Impermeabilización', 'Protección contra filtraciones de agua', 4, 150, 600, ARRAY['techos', 'sellado', 'protección agua', 'azoteas', 'losas', 'goteras']),
  ('Trabajos de Albañilería', 'Albañilería', 'Construcción y reparaciones con concreto y materiales', 6, 200, 800, ARRAY['concreto', 'colados', 'tablaroca', 'vitro piso', 'azulejo', 'construcción', 'mampostería', 'muros']),
  ('Carpintería y Ebanistería', 'Carpintería', 'Fabricación y reparación de muebles de madera', 4, 100, 400, ARRAY['muebles', 'puertas', 'closets', 'madera', 'reparación muebles', 'instalación']),
  
  -- Extended Services  
  ('Instalación de Tablaroca', 'Albañilería', 'Muros y divisiones con sistema drywall', 4, 80, 300, ARRAY['drywall', 'paneles', 'divisiones', 'muros falsos', 'acabados', 'tablaroca']),
  ('Instalación de Pisos', 'Albañilería', 'Colocación de vitro piso, azulejo y cerámicos', 6, 150, 500, ARRAY['pisos', 'recubrimientos', 'cerámica', 'instalación pisos', 'vitro piso', 'azulejo']),
  ('Sistemas Hidroneumáticos', 'Fontanería', 'Especialista en sistemas de presión constante', 4, 200, 800, ARRAY['hidroneumáticos', 'bombas', 'presión constante', 'sistemas de agua']),
  ('Sistema Contraincendios', 'Fontanería', 'Instalación y mantenimiento de sistemas contra incendios', 8, 500, 2000, ARRAY['contraincendios', 'seguridad', 'extintores', 'rociadores']),
  ('Chofer Privado', 'Transporte', 'Servicios de conductor personal', 2, 30, 100, ARRAY['conductor', 'transporte', 'manejo', 'vehículo', 'chofer']),
  ('Trabajos en Aluminio', 'Construcción', 'Ventanas, puertas y estructuras de aluminio', 4, 150, 600, ARRAY['ventanas', 'puertas aluminio', 'cancelería aluminio', 'estructuras', 'aluminio']),
  ('Herrería y Soldadura', 'Construcción', 'Trabajos en metal y soldadura', 4, 100, 400, ARRAY['metal', 'soldadura', 'puertas metal', 'protecciones', 'estructuras metálicas', 'herrería']),
  ('Cancelería de Aluminio', 'Construcción', 'Ventanas y puertas de cristal con aluminio', 6, 200, 800, ARRAY['ventanas', 'puertas cristal', 'aluminio', 'vidrios', 'cancelería']),
  ('Aire Acondicionado', 'Climatización', 'Instalación y mantenimiento de equipos de clima', 3, 100, 500, ARRAY['clima', 'refrigeración', 'mantenimiento aire', 'instalación clima', 'reparación aire']),
  ('Servicios Automotrices', 'Automotriz', 'Lavado de autos y servicios básicos', 2, 25, 100, ARRAY['autolavado', 'cambio de batería de auto', 'cambio de llanta', 'parche de llanta', 'servicios generales']);