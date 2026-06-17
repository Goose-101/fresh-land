-- Add major Atlanta-area parks as resources for newcomers.
-- Parks are valuable: free, family-friendly, great for community building,
-- and offer outdoor activities that don't require fluent English.

INSERT INTO resources (
  name, description, short_description, category_id,
  website_url, phone, address, city, state, zip,
  latitude, longitude, languages,
  is_free, serves_undocumented,
  hours, walk_in_available, weekend_hours, evening_hours,
  is_active, is_verified, is_featured
)
SELECT *
FROM (
  VALUES
  -- Stone Mountain Park
  (
    'Stone Mountain Park',
    'Stone Mountain Park is Georgia''s most popular attraction, featuring a giant granite mountain you can hike or ride a cable car up. The park offers walking trails, a laser show in summer evenings, paddle boats, a scenic train, and the Songbird Habitat. Free walking and hiking, with paid attractions inside. Family-friendly, with picnic areas and accessible facilities. Most signs are in English; bring a translation app for detailed exhibits.',
    'Iconic 3,200-acre park with granite mountain, hiking trails, summer laser show, and family attractions east of Atlanta.',
    (SELECT id FROM categories WHERE slug = 'parks' LIMIT 1),
    'https://www.stonemountainpark.com',
    '(800) 401-2407',
    '1000 Robert E Lee Blvd',
    'Stone Mountain', 'GA', '30083',
    33.8053, -84.1452,
    ARRAY['en']::text[],
    true, true,
    'Park: 5AM-midnight daily. Attractions: vary by season.',
    true, true, true,
    true, true, true
  ),
  -- Piedmont Park
  (
    'Piedmont Park',
    'Piedmont Park is Atlanta''s most popular urban park, covering 189 acres in Midtown. It hosts free events year-round including the Atlanta Dogwood Festival, free fitness classes, art exhibitions, and the weekly Green Market on Saturdays (April-December). Features include a large lake, playgrounds, public pool, tennis courts, dog park, and connection to the Atlanta BeltLine. Walking distance from MARTA Midtown station.',
    'Atlanta''s flagship urban park with lake, playgrounds, free events, and BeltLine access in Midtown.',
    (SELECT id FROM categories WHERE slug = 'parks' LIMIT 1),
    'https://piedmontpark.org',
    '(404) 875-7275',
    '400 Park Dr NE',
    'Atlanta', 'GA', '30306',
    33.7858, -84.3733,
    ARRAY['en', 'es']::text[],
    true, true,
    'Daily 6AM-11PM. Some facilities have specific hours.',
    true, true, true,
    true, true, true
  ),
  -- Centennial Olympic Park
  (
    'Centennial Olympic Park',
    'Centennial Olympic Park is a 22-acre public park in downtown Atlanta built for the 1996 Summer Olympics. The famous Fountain of Rings features choreographed water and music shows. Hosts free outdoor concerts, movie nights, and family events. Walking distance to the Georgia Aquarium, World of Coca-Cola, College Football Hall of Fame, and Mercedes-Benz Stadium. Accessible via MARTA Peachtree Center or Dome/GWCC station.',
    'Downtown Atlanta''s 22-acre park with the iconic Fountain of Rings, free concerts, and walking access to major attractions.',
    (SELECT id FROM categories WHERE slug = 'parks' LIMIT 1),
    'https://www.gwcca.org/centennial-olympic-park',
    '(404) 222-7275',
    '265 Park Ave W NW',
    'Atlanta', 'GA', '30313',
    33.7607, -84.3933,
    ARRAY['en', 'es']::text[],
    true, true,
    'Daily 7AM-11PM. Fountain shows: 12:30PM, 3:30PM, 6:30PM, 9PM.',
    true, true, true,
    true, true, false
  ),
  -- Chastain Park
  (
    'Chastain Park',
    'Chastain Park is the largest city park in Atlanta at 268 acres. It includes the popular Cadence Bank Amphitheatre (summer concerts), golf course, tennis courts, equestrian center, swimming pool, ball fields, playgrounds, and the PATH walking trail. The Galloway School and an arts and crafts center are also on-site. Great for families with diverse interests.',
    'Atlanta''s largest city park (268 acres) with concerts, sports facilities, walking trails, and family-friendly amenities.',
    (SELECT id FROM categories WHERE slug = 'parks' LIMIT 1),
    'https://chastainpark.org',
    '(404) 252-6635',
    '4469 Stella Dr NW',
    'Atlanta', 'GA', '30327',
    33.8770, -84.3850,
    ARRAY['en']::text[],
    true, true,
    'Daily 6AM-11PM.',
    true, true, true,
    true, true, false
  ),
  -- Grant Park
  (
    'Grant Park',
    'Grant Park is Atlanta''s oldest park (1883), 131 acres in the heart of the city. Home to Zoo Atlanta (free monthly community days for residents) and the Cyclorama painting. Features playgrounds, sports fields, walking paths, a community pool, and farmer''s market on Sundays. Historic neighborhood with affordable housing nearby.',
    'Atlanta''s oldest park, home to Zoo Atlanta, walking trails, and a weekend farmer''s market.',
    (SELECT id FROM categories WHERE slug = 'parks' LIMIT 1),
    'https://grantpark.org',
    '(404) 521-0938',
    '840 Cherokee Ave SE',
    'Atlanta', 'GA', '30315',
    33.7376, -84.3705,
    ARRAY['en', 'es']::text[],
    true, true,
    'Daily 6AM-11PM. Zoo: 9:30AM-5:30PM.',
    true, true, true,
    true, true, false
  ),
  -- Sweetwater Creek State Park
  (
    'Sweetwater Creek State Park',
    'Sweetwater Creek State Park is just 15 miles west of downtown Atlanta but feels like a wilderness escape. Features the ruins of New Manchester Manufacturing Company (a Civil War-era mill), 15 miles of hiking trails, a fishing lake, boat rentals, picnic areas, and a visitor center. Excellent for families and photography. Parking pass required ($5/day).',
    'State park with hiking trails, historic mill ruins, lake, and fishing — 15 miles west of downtown Atlanta.',
    (SELECT id FROM categories WHERE slug = 'parks' LIMIT 1),
    'https://gastateparks.org/SweetwaterCreek',
    '(770) 732-5871',
    '1750 Mt Vernon Rd',
    'Lithia Springs', 'GA', '30122',
    33.7541, -84.6273,
    ARRAY['en']::text[],
    false, true,
    'Daily 7AM-sunset. Visitor center 8AM-5PM.',
    true, true, false,
    true, true, false
  ),
  -- Kennesaw Mountain National Battlefield Park
  (
    'Kennesaw Mountain National Battlefield Park',
    'Kennesaw Mountain National Battlefield Park is a 2,965-acre national park with hiking trails, Civil War history exhibits, scenic mountain views, and free admission. Multiple hiking trails of varying difficulty including a steep but rewarding climb to the summit. Visitor center has free historical exhibits. Family-friendly with picnic spots and ranger programs.',
    'Free national park 25 miles northwest of Atlanta with hiking trails, Civil War history, and mountain views.',
    (SELECT id FROM categories WHERE slug = 'parks' LIMIT 1),
    'https://www.nps.gov/kemo',
    '(770) 427-4686',
    '900 Kennesaw Mountain Dr',
    'Kennesaw', 'GA', '30152',
    33.9885, -84.5760,
    ARRAY['en', 'es']::text[],
    true, true,
    'Park: dawn-dusk. Visitor center: 9AM-5PM daily.',
    true, true, false,
    true, true, false
  ),
  -- Arabia Mountain National Heritage Area
  (
    'Arabia Mountain National Heritage Area',
    'Arabia Mountain National Heritage Area is a unique geological landscape with 30+ miles of paved PATH trails connecting Davidson-Arabia Mountain Nature Preserve, Panola Mountain State Park, and surrounding communities. Features rare granite outcrops with seasonal wildflowers, peaceful hiking, and educational programs. Mostly flat terrain — great for beginners, strollers, and bikes.',
    'Unique granite mountain landscape with 30+ miles of paved trails for hiking and biking, south of Atlanta.',
    (SELECT id FROM categories WHERE slug = 'parks' LIMIT 1),
    'https://arabiaalliance.org',
    '(770) 484-3060',
    '3787 Klondike Rd',
    'Stonecrest', 'GA', '30038',
    33.6691, -84.1255,
    ARRAY['en']::text[],
    true, true,
    'Daily dawn-dusk.',
    true, true, false,
    true, true, false
  ),
  -- Atlanta BeltLine Eastside Trail
  (
    'Atlanta BeltLine — Eastside Trail',
    'The Atlanta BeltLine is a 22-mile loop of trails, parks, transit, and affordable housing being built around Atlanta on a former railway corridor. The Eastside Trail is the most popular section, 3 miles paved through Old Fourth Ward, Inman Park, and Virginia-Highland. Free public art everywhere, food halls (Krog Street Market, Ponce City Market), free events, and connection to multiple parks.',
    'Free 3-mile paved trail through cool Atlanta neighborhoods with public art, food halls, and connections to parks.',
    (SELECT id FROM categories WHERE slug = 'parks' LIMIT 1),
    'https://beltline.org',
    '(404) 477-3635',
    'Eastside Trail',
    'Atlanta', 'GA', '30307',
    33.7651, -84.3637,
    ARRAY['en', 'es']::text[],
    true, true,
    'Open 24 hours; most foot traffic during daylight.',
    true, true, true,
    true, true, true
  ),
  -- Freedom Park
  (
    'Freedom Park',
    'Freedom Park is a 210-acre linear park east of downtown Atlanta, connecting the Carter Center, the Martin Luther King Jr. National Historical Park, and the Atlanta BeltLine. Features the Freedom Trail (paved walking/biking path), public art installations including monuments to civil rights leaders, and free outdoor events. Walking distance from MARTA''s Inman Park station.',
    'Linear park connecting the Carter Center, MLK Historic District, and BeltLine — with paved trails and civil rights monuments.',
    (SELECT id FROM categories WHERE slug = 'parks' LIMIT 1),
    'https://freedompark.org',
    NULL,
    '550 Freedom Pkwy NE',
    'Atlanta', 'GA', '30307',
    33.7693, -84.3633,
    ARRAY['en', 'es']::text[],
    true, true,
    'Open 24 hours.',
    true, true, true,
    true, true, false
  )
) AS new_parks(
  name, description, short_description, category_id,
  website_url, phone, address, city, state, zip,
  latitude, longitude, languages,
  is_free, serves_undocumented,
  hours, walk_in_available, weekend_hours, evening_hours,
  is_active, is_verified, is_featured
)
WHERE NOT EXISTS (
  SELECT 1 FROM resources r WHERE r.name = new_parks.name
);
