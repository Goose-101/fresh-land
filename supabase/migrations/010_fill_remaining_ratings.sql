-- =============================================================
-- Migration 010 — Fill remaining NULL ratings with estimates
-- =============================================================
-- 21 entries from 009 were left with NULL ratings because I had less
-- reputational signal for them. Per user request, populate them with my best
-- training-data estimates so users see something on every card.
--
-- Every value below is tagged rating_source = 'estimated' so the UI's "est."
-- badge fires. Replace with live numbers via syncResourceWithGoogle() once a
-- GOOGLE_PLACES_API_KEY is set.

update resources set google_rating = 4.2, google_review_count = 35, rating_source = 'estimated'
  where name = 'Korean American Federation of Atlanta' and rating_source is null;

update resources set google_rating = 4.3, google_review_count = 28, rating_source = 'estimated'
  where name = 'Vietnamese American Community of Atlanta' and rating_source is null;

update resources set google_rating = 4.6, google_review_count = 45, rating_source = 'estimated'
  where name = 'Bhutanese Community Association of Georgia' and rating_source is null;

update resources set google_rating = 4.4, google_review_count = 18, rating_source = 'estimated'
  where name = 'Eritrean Community Association of Atlanta' and rating_source is null;

update resources set google_rating = 4.3, google_review_count = 22, rating_source = 'estimated'
  where name = 'Filipino American Association of Greater Atlanta' and rating_source is null;

update resources set google_rating = 4.5, google_review_count = 110, rating_source = 'estimated'
  where name = 'Indian American Cultural Association' and rating_source is null;

update resources set google_rating = 4.2, google_review_count = 16, rating_source = 'estimated'
  where name = 'Iranian Cultural Center of Georgia' and rating_source is null;

update resources set google_rating = 4.3, google_review_count = 30, rating_source = 'estimated'
  where name = 'Brazilian American Chamber of the Southeast' and rating_source is null;

update resources set google_rating = 4.5, google_review_count = 60, rating_source = 'estimated'
  where name = 'Center for Civil & Human Rights Education' and rating_source is null;

update resources set google_rating = 4.4, google_review_count = 25, rating_source = 'estimated'
  where name = 'Hellenic Cultural Society of Greater Atlanta' and rating_source is null;

update resources set google_rating = 4.2, google_review_count = 35, rating_source = 'estimated'
  where name = 'Atlanta Legal Aid Society - South Fulton' and rating_source is null;

update resources set google_rating = 4.7, google_review_count = 40, rating_source = 'estimated'
  where name = 'Pro Bono Partnership of Atlanta' and rating_source is null;

update resources set google_rating = 4.3, google_review_count = 25, rating_source = 'estimated'
  where name = 'Atlanta CareerRise' and rating_source is null;

update resources set google_rating = 4.6, google_review_count = 32, rating_source = 'estimated'
  where name = 'Refugee Career Hub' and rating_source is null;

update resources set google_rating = 4.4, google_review_count = 55, rating_source = 'estimated'
  where name = 'Access to Capital for Entrepreneurs (ACE)' and rating_source is null;

update resources set google_rating = 4.3, google_review_count = 38, rating_source = 'estimated'
  where name = 'Center for Working Families' and rating_source is null;

update resources set google_rating = 4.7, google_review_count = 45, rating_source = 'estimated'
  where name = 'AARP Tax-Aide - Decatur Library' and rating_source is null;

update resources set google_rating = 4.5, google_review_count = 70, rating_source = 'estimated'
  where name = 'Atlanta Prosperity Campaign / United Way VITA' and rating_source is null;

update resources set google_rating = 4.7, google_review_count = 30, rating_source = 'estimated'
  where name = 'Tubman House Atlanta' and rating_source is null;

update resources set google_rating = 4.4, google_review_count = 28, rating_source = 'estimated'
  where name = 'Crittenton Children''s Center' and rating_source is null;

update resources set google_rating = 4.3, google_review_count = 95, rating_source = 'estimated'
  where name = 'Salvation Army Atlanta - Disaster Services' and rating_source is null;