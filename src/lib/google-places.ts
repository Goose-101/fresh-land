import { createAdminClient } from "./supabase/server";

// Places API (New) — https://developers.google.com/maps/documentation/places/web-service/op-overview
// Legacy Places API is deprecated for new projects. Field names differ.
const BASE = "https://places.googleapis.com/v1";

export type PlaceReview = {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  language?: string;
};

export type PlaceDetails = {
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: PlaceReview[];
  photos?: { photo_reference: string }[];
  opening_hours?: { weekday_text?: string[] };
  geometry?: { location: { lat: number; lng: number } };
};

// Map a Places API (New) response into the legacy-shaped PlaceDetails the
// rest of our app expects, so callers don't have to change.
function adaptPlace(p: any): PlaceDetails | null {
  if (!p) return null;

  const reviews: PlaceReview[] = (p.reviews || []).map((r: any) => ({
    author_name: r.authorAttribution?.displayName || "Anonymous",
    author_url: r.authorAttribution?.uri,
    profile_photo_url: r.authorAttribution?.photoUri,
    rating: Number(r.rating) || 0,
    relative_time_description: r.relativePublishTimeDescription || "",
    text: r.text?.text || r.originalText?.text || "",
    time: r.publishTime ? Math.floor(new Date(r.publishTime).getTime() / 1000) : 0,
    language: r.text?.languageCode || r.originalText?.languageCode,
  }));

  return {
    name: p.displayName?.text,
    formatted_address: p.formattedAddress,
    formatted_phone_number: p.nationalPhoneNumber || p.internationalPhoneNumber,
    website: p.websiteUri,
    rating: typeof p.rating === "number" ? p.rating : undefined,
    user_ratings_total:
      typeof p.userRatingCount === "number" ? p.userRatingCount : undefined,
    reviews,
    photos: (p.photos || []).map((ph: any) => ({ photo_reference: ph.name })),
    opening_hours: p.regularOpeningHours?.weekdayDescriptions
      ? { weekday_text: p.regularOpeningHours.weekdayDescriptions }
      : undefined,
    geometry: p.location
      ? { location: { lat: p.location.latitude, lng: p.location.longitude } }
      : undefined,
  };
}

const FIELD_MASK = [
  "displayName",
  "formattedAddress",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "reviews",
  "photos",
  "regularOpeningHours.weekdayDescriptions",
  "location",
].join(",");

export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetails | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !placeId) return null;

  try {
    const res = await fetch(`${BASE}/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[places-new] HTTP", res.status, body.slice(0, 300));
      return null;
    }
    const json = await res.json();
    return adaptPlace(json);
  } catch (e: any) {
    console.error("[places-new] fetch failed", e?.message);
    return null;
  }
}

export async function getPlaceReviews(placeId: string): Promise<PlaceReview[]> {
  const d = await getPlaceDetails(placeId);
  return d?.reviews || [];
}

export async function syncResourceWithGoogle(
  resourceId: string,
  placeId: string
): Promise<void> {
  const details = await getPlaceDetails(placeId);
  if (!details) return;
  const supabase = await createAdminClient();

  await supabase
    .from("resources")
    .update({
      google_rating: details.rating,
      google_review_count: details.user_ratings_total,
      website_url: details.website,
      phone: details.formatted_phone_number,
      latitude: details.geometry?.location.lat,
      longitude: details.geometry?.location.lng,
      hours_structured: details.opening_hours?.weekday_text
        ? { weekday_text: details.opening_hours.weekday_text }
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId);

  if (details.reviews?.length) {
    await supabase
      .from("resource_reviews")
      .delete()
      .eq("resource_id", resourceId)
      .eq("source", "google");

    const rows = details.reviews.map((r) => ({
      resource_id: resourceId,
      author_name: r.author_name,
      author_photo_url: r.profile_photo_url || null,
      rating: r.rating,
      text: r.text,
      source: "google",
      google_time: r.time,
      language: r.language || "en",
      is_approved: true,
    }));
    await supabase.from("resource_reviews").insert(rows);
  }
}

// Per Google Maps Platform ToS, reviews must be cached for <= 30 days.
const REVIEW_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function ensureFreshGoogleReviews(
  resourceId: string,
  placeId: string | null | undefined
): Promise<void> {
  if (!placeId) return;
  try {
    const supabase = await createAdminClient();
    const { data: oldest } = await supabase
      .from("resource_reviews")
      .select("created_at")
      .eq("resource_id", resourceId)
      .eq("source", "google")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const stale =
      !oldest ||
      Date.now() - new Date(oldest.created_at).getTime() > REVIEW_TTL_MS;

    if (stale) {
      await syncResourceWithGoogle(resourceId, placeId);
    }
  } catch (e: any) {
    console.error("[google-reviews] ensure failed", e?.message);
  }
}
