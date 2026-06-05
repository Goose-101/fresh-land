export type NotificationPrefs = {
  channels?: { email?: boolean; sms?: boolean; push?: boolean };
  events?: { newResources?: boolean; events?: boolean; digest?: boolean; pathway?: boolean; savedChanges?: boolean };
  digestFrequency?: "daily" | "weekly" | "off";
  quietHours?: { enabled?: boolean; start?: string; end?: string };
  categoryFilters?: string[];
};

export type PrivacyPrefs = {
  communityVisible?: boolean;
  anonymousPosting?: boolean;
  hideFromSearch?: boolean;
};

export type Theme = "light" | "dark" | "system";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  preferred_language: string;
  city: string;
  state: string;
  zip: string | null;
  needs: string[];
  immigration_status: string | null;
  has_children: boolean;
  english_comfort: string;
  years_in_us: number | null;
  is_admin: boolean;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
  preferred_name?: string | null;
  phone?: string | null;
  phone_sms_opt_in?: boolean | null;
  household_size?: number | null;
  children_count?: number | null;
  country_of_origin?: string | null;
  languages_spoken?: string[] | null;
  theme?: Theme | null;
  notification_prefs?: NotificationPrefs | null;
  privacy_prefs?: PrivacyPrefs | null;
  is_paused?: boolean | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
  image_alt: string | null;
};

export type Resource = {
  id: string;
  name: string;
  description: string;
  short_description: string | null;
  category_id: string | null;
  subcategory: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_photos: string[] | null;
  rating_source: string | null;
  review_snippet: string | null;
  languages: string[];
  is_free: boolean;
  cost_description: string | null;
  serves_undocumented: boolean;
  documentation_required: string[] | null;
  hours: string | null;
  hours_structured: Record<string, string> | null;
  eligibility: string | null;
  how_to_apply: string | null;
  what_to_bring: string | null;
  walk_in_available: boolean;
  weekend_hours: boolean;
  evening_hours: boolean;
  phone_intake: boolean;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  click_count: number;
  save_count: number;
  created_at: string;
  updated_at: string;
  ein?: string | null;
  charity_data?: CharityData | null;
  charity_synced_at?: string | null;
  category?: Category;
  distance?: number;
};

export type CharityData = {
  ein: string;
  organization_name?: string;
  mission?: string;
  foundation_type?: string;
  ntee_code?: string;
  ntee_description?: string;
  ruling_year?: number;
  profile_level?: "Platinum" | "Gold" | "Silver" | "Bronze" | "None";
  total_revenue?: number;
  total_expenses?: number;
  fiscal_year?: number;
  is_501c3?: boolean;
  city?: string;
  state?: string;
  website?: string;
};

export type Review = {
  id: string;
  resource_id: string;
  user_id: string | null;
  author_name: string | null;
  author_photo_url: string | null;
  rating: number;
  text: string | null;
  source: string;
  google_time: number | null;
  language: string;
  is_approved: boolean;
  created_at: string;
  relative_time_description?: string;
};

export type Pathway = {
  id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  estimated_time: string | null;
  is_active: boolean;
  created_at: string;
  steps?: PathwayStep[];
};

export type PathwayStep = {
  id: string;
  pathway_id: string;
  step_number: number;
  title: string;
  description: string;
  tips: string | null;
  warning: string | null;
  is_optional: boolean;
  resources?: Resource[];
  completed?: boolean;
};

export type SavedResource = {
  id: string;
  user_id: string;
  resource_id: string;
  notes: string | null;
  saved_at: string;
  resource?: Resource;
};

export type CommunityPost = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  content: string;
  language: string;
  upvotes: number;
  is_approved: boolean;
  is_pinned: boolean;
  created_at: string;
  author?: Profile;
  reply_count?: number;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type AIMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
};

export type Language = {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
};

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", speechCode: "en-US" },
  { code: "es", name: "Spanish", nativeName: "Español", speechCode: "es-ES" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", speechCode: "am-ET" },
  { code: "fr", name: "French", nativeName: "Français", speechCode: "fr-FR" },
  { code: "ar", name: "Arabic", nativeName: "العربية", speechCode: "ar-SA" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechCode: "hi-IN" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", speechCode: "vi-VN" },
];
