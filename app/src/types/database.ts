export type UserRole = "super_admin" | "client";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  business_name: string;
  slug: string;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  category: string | null;
  website: string | null;
  google_review_url: string;
  logo_url: string | null;
  welcome_message: string;
  is_active: boolean;
  qr_version: number;
  last_qr_generated_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Only these fields are ever exposed on a public review page.
export interface PublicClient {
  id: string;
  business_name: string;
  slug: string;
  category: string | null;
  website: string | null;
  google_review_url: string;
  logo_url: string | null;
  welcome_message: string;
  is_active: boolean;
}
