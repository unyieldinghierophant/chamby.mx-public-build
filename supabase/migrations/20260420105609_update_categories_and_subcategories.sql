-- 1. Deactivate Auto y Lavado category
UPDATE service_categories SET is_active = false WHERE slug = 'auto';

-- 2. Fix "Poda de Árboles" → "Poda de plantas y árboles" in Jardinería
UPDATE service_subcategories
SET name = 'Poda de plantas y árboles',
    slug = 'poda-de-plantas-y-arboles'
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'jardineria')
  AND (slug = 'poda-de-arboles' OR name ILIKE '%poda%arboles%' OR name ILIKE '%poda de árboles%');

-- 3. Add "Mantenimiento de áreas verdes" to Jardinería
INSERT INTO service_subcategories (category_id, slug, name, description, sort_order, is_active)
SELECT id, 'mantenimiento-areas-verdes', 'Mantenimiento de áreas verdes',
       'Cuidado integral y mantenimiento de jardines y áreas verdes', 10, true
FROM service_categories WHERE slug = 'jardineria'
ON CONFLICT (category_id, slug) DO UPDATE
  SET is_active = true, name = EXCLUDED.name;

-- 4. Electrodomésticos (uses 'aire-acondicionado' slug in the UI):
--    Deactivate all existing subcategories so we start clean
UPDATE service_subcategories
SET is_active = false
WHERE category_id = (SELECT id FROM service_categories WHERE slug = 'aire-acondicionado');

-- Re-add/update as a single AC pill + the new services
INSERT INTO service_subcategories (category_id, slug, name, description, sort_order, is_active)
SELECT id, 'mantenimiento-instalacion-ac',
       'Mantenimiento e instalación de Aire Acondicionado',
       'Servicio, instalación y mantenimiento de aires acondicionados', 1, true
FROM service_categories WHERE slug = 'aire-acondicionado'
ON CONFLICT (category_id, slug) DO UPDATE
  SET is_active = true, name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO service_subcategories (category_id, slug, name, description, sort_order, is_active)
SELECT id, 'reparacion-licuadoras',
       'Reparación de licuadoras',
       'Diagnóstico y reparación de licuadoras y electrodomésticos de cocina', 2, true
FROM service_categories WHERE slug = 'aire-acondicionado'
ON CONFLICT (category_id, slug) DO UPDATE
  SET is_active = true, name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO service_subcategories (category_id, slug, name, description, sort_order, is_active)
SELECT id, 'instalacion-electrodomesticos',
       'Instalación de electrodomésticos',
       'Instalación de lavadoras, secadoras, estufas y más', 3, true
FROM service_categories WHERE slug = 'aire-acondicionado'
ON CONFLICT (category_id, slug) DO UPDATE
  SET is_active = true, name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO service_subcategories (category_id, slug, name, description, sort_order, is_active)
SELECT id, 'reparacion-lavadoras-secadoras',
       'Reparación de lavadoras y secadoras',
       'Diagnóstico y reparación de lavadoras y secadoras', 4, true
FROM service_categories WHERE slug = 'aire-acondicionado'
ON CONFLICT (category_id, slug) DO UPDATE
  SET is_active = true, name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;

INSERT INTO service_subcategories (category_id, slug, name, description, sort_order, is_active)
SELECT id, 'reparacion-microondas',
       'Reparación de microondas',
       'Diagnóstico y reparación de microondas', 5, true
FROM service_categories WHERE slug = 'aire-acondicionado'
ON CONFLICT (category_id, slug) DO UPDATE
  SET is_active = true, name = EXCLUDED.name, sort_order = EXCLUDED.sort_order;
