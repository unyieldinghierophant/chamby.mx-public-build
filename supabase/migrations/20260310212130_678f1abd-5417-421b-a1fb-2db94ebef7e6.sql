
-- Part A: Create tables
CREATE TABLE IF NOT EXISTS service_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_subcategories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES service_categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  UNIQUE(category_id, slug)
);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view subcategories" ON service_subcategories FOR SELECT USING (true);

-- Part B: Seed data
INSERT INTO service_categories (slug, name, description, icon, sort_order) VALUES
  ('plomeria', 'Plomería', 'Reparación e instalación de sistemas de agua', '🔧', 1),
  ('electricidad', 'Electricidad', 'Instalaciones eléctricas, apagones y reparaciones', '⚡', 2),
  ('pintura', 'Pintura', 'Pintura interior, exterior e impermeabilización', '🎨', 3),
  ('albanileria', 'Albañilería y Construcción', 'Remodelaciones, muros, pisos y tablaroca', '🧱', 4),
  ('aire-acondicionado', 'Aire Acondicionado', 'Instalación, mantenimiento y reparación de A/C', '❄️', 5),
  ('electrodomesticos', 'Reparación de Electrodomésticos', 'Lavadoras, refrigeradores, estufas y más', '🔌', 6),
  ('jardineria', 'Jardinería', 'Poda, mantenimiento y diseño de jardines', '🌿', 7),
  ('general', 'General / Handyman', 'Cortinas, persianas, montaje de TV, pisos y más', '🛠️', 8);

-- Plomeria
INSERT INTO service_subcategories (category_id, slug, name, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='plomeria'), 'fuga-agua', 'Fuga de agua', 1),
  ((SELECT id FROM service_categories WHERE slug='plomeria'), 'boiler', 'Instalación o reparación de boiler', 2),
  ((SELECT id FROM service_categories WHERE slug='plomeria'), 'drenaje', 'Destape de drenaje', 3),
  ((SELECT id FROM service_categories WHERE slug='plomeria'), 'instalacion-agua', 'Instalación de tuberías', 4),
  ((SELECT id FROM service_categories WHERE slug='plomeria'), 'otro-plomeria', 'Otro problema de plomería', 5);

-- Electricidad
INSERT INTO service_subcategories (category_id, slug, name, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='electricidad'), 'apagon', 'Apagón o corto circuito', 1),
  ((SELECT id FROM service_categories WHERE slug='electricidad'), 'instalacion-electrica', 'Instalación eléctrica', 2),
  ((SELECT id FROM service_categories WHERE slug='electricidad'), 'lamparas', 'Instalación de lámparas/focos', 3),
  ((SELECT id FROM service_categories WHERE slug='electricidad'), 'contactos', 'Reparación de contactos/apagadores', 4),
  ((SELECT id FROM service_categories WHERE slug='electricidad'), 'otro-electricidad', 'Otro problema eléctrico', 5);

-- Pintura
INSERT INTO service_subcategories (category_id, slug, name, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='pintura'), 'interior', 'Pintura interior', 1),
  ((SELECT id FROM service_categories WHERE slug='pintura'), 'exterior', 'Pintura exterior', 2),
  ((SELECT id FROM service_categories WHERE slug='pintura'), 'impermeabilizacion', 'Impermeabilización', 3),
  ((SELECT id FROM service_categories WHERE slug='pintura'), 'otro-pintura', 'Otro trabajo de pintura', 4);

-- Albanileria
INSERT INTO service_subcategories (category_id, slug, name, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='albanileria'), 'remodelacion', 'Remodelación', 1),
  ((SELECT id FROM service_categories WHERE slug='albanileria'), 'muros', 'Construcción de muros', 2),
  ((SELECT id FROM service_categories WHERE slug='albanileria'), 'pisos-azulejo', 'Pisos y azulejo', 3),
  ((SELECT id FROM service_categories WHERE slug='albanileria'), 'tablaroca', 'Tablaroca', 4),
  ((SELECT id FROM service_categories WHERE slug='albanileria'), 'otro-albanileria', 'Otro trabajo de albañilería', 5);

-- Aire Acondicionado
INSERT INTO service_subcategories (category_id, slug, name, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='aire-acondicionado'), 'instalacion-ac', 'Instalación de A/C', 1),
  ((SELECT id FROM service_categories WHERE slug='aire-acondicionado'), 'mantenimiento-ac', 'Mantenimiento de A/C', 2),
  ((SELECT id FROM service_categories WHERE slug='aire-acondicionado'), 'reparacion-ac', 'Reparación de A/C', 3);

-- Electrodomesticos
INSERT INTO service_subcategories (category_id, slug, name, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='electrodomesticos'), 'lavadora', 'Lavadora/Secadora', 1),
  ((SELECT id FROM service_categories WHERE slug='electrodomesticos'), 'refrigerador', 'Refrigerador', 2),
  ((SELECT id FROM service_categories WHERE slug='electrodomesticos'), 'estufa', 'Estufa/Horno', 3),
  ((SELECT id FROM service_categories WHERE slug='electrodomesticos'), 'otro-electrodomestico', 'Otro electrodoméstico', 4);

-- Jardineria
INSERT INTO service_subcategories (category_id, slug, name, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='jardineria'), 'poda', 'Poda de árboles/arbustos', 1),
  ((SELECT id FROM service_categories WHERE slug='jardineria'), 'mantenimiento-jardin', 'Mantenimiento de jardín', 2),
  ((SELECT id FROM service_categories WHERE slug='jardineria'), 'diseno-jardin', 'Diseño de jardín', 3);

-- General / Handyman
INSERT INTO service_subcategories (category_id, slug, name, sort_order) VALUES
  ((SELECT id FROM service_categories WHERE slug='general'), 'montaje-tv', 'Montaje de TV', 1),
  ((SELECT id FROM service_categories WHERE slug='general'), 'cortinas-persianas', 'Cortinas y persianas', 2),
  ((SELECT id FROM service_categories WHERE slug='general'), 'pisos-laminados', 'Pisos laminados', 3),
  ((SELECT id FROM service_categories WHERE slug='general'), 'lavado-presion', 'Lavado a presión', 4),
  ((SELECT id FROM service_categories WHERE slug='general'), 'armado-muebles', 'Armado de muebles', 5),
  ((SELECT id FROM service_categories WHERE slug='general'), 'otro-general', 'Otro servicio', 6);
