import { getSupabase, isSupabaseConfigured } from "./supabase";

export { isSupabaseConfigured };

export type ContactInquiryInput = {
  name: string;
  email: string;
  inquiry_type: string;
  message: string;
};

export type ListingRequestInput = {
  shop_name: string;
  prefecture: string;
  area?: string | null;
  address?: string | null;
  station?: string | null;
  conditions?: string[];
  reference_url?: string | null;
  site_url?: string | null;
  map_url?: string | null;
  comment?: string | null;
  poster_name?: string | null;
  email?: string | null;
};

function emptyToNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createContactInquiry(input: ContactInquiryInput): Promise<void> {
  const { error } = await getSupabase().from("contact_inquiries").insert({
    name: input.name.trim(),
    email: input.email.trim(),
    inquiry_type: input.inquiry_type,
    message: input.message.trim(),
    status: "new",
  });
  if (error) throw error;
}

export async function createListingRequest(input: ListingRequestInput): Promise<void> {
  const { error } = await getSupabase().from("listing_requests").insert({
    shop_name: input.shop_name.trim(),
    prefecture: input.prefecture.trim(),
    area: emptyToNull(input.area),
    address: emptyToNull(input.address),
    station: emptyToNull(input.station),
    conditions: input.conditions ?? [],
    reference_url: emptyToNull(input.reference_url),
    site_url: emptyToNull(input.site_url),
    map_url: emptyToNull(input.map_url),
    comment: emptyToNull(input.comment),
    poster_name: emptyToNull(input.poster_name),
    email: emptyToNull(input.email),
    status: "new",
  });
  if (error) throw error;
}

export type CreateReviewInput = {
  cafe_id: number;
  shop_name: string;
  reviewer_name?: string | null;
  visited_at?: string | null;
  dog_size: string;
  seat_location: string;
  rating: number;
  comment: string;
};

export async function createReview(input: CreateReviewInput): Promise<void> {
  const { error } = await getSupabase().from("reviews").insert({
    cafe_id: input.cafe_id,
    shop_name: input.shop_name,
    reviewer_name: input.reviewer_name?.trim() || null,
    visited_at: input.visited_at || null,
    dog_size: input.dog_size,
    seat_location: input.seat_location,
    rating: input.rating,
    comment: input.comment.trim(),
    status: "pending",
    source: "user",
  });
  if (error) throw error;
}
