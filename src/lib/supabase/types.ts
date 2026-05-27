export type DbProductCategory = "Wigs" | "Weavon" | "Accessories";
export type DbHairType = "Human Hair" | "Vietnamese Hair" | "Blend Hair";
export type DbTexture =
  | "Straight"
  | "Bone Straight"
  | "Curly"
  | "Pixie Curl"
  | "Jerry Curl"
  | "Burmese Curl";

export type ProductRow = {
  id: string;
  name: string;
  category: DbProductCategory;
  hair_type: DbHairType | null;
  texture: DbTexture | null;
  closure_type: string | null;
  accessory_type: string | null;
  lengths: string[] | null;
  price: number;
  length_prices?: Record<string, number> | null;
  description: string | null;
  images: string[] | null;
  in_stock: boolean | null;
  is_new_arrival: boolean | null;
  is_best_seller: boolean | null;
  is_featured: boolean | null;
  created_at: string;
};

export type HomepageHeroGridRow = {
  slot: string;
  product_id: string | null;
  updated_at?: string;
  updated_by?: string | null;
};

export type SocialFeedRow = {
  id: string;
  image_url: string;
  slot_number: number;
};

export type HomepageCategoryCardRow = {
  category: DbProductCategory;
  image_url: string;
  updated_at?: string | null;
};

export type SubscriberRow = {
  id: string;
  email: string;
  source: string;
  created_at: string;
};

export type EmailCampaignSegment = "all" | "customers" | "leads";
export type EmailCampaignStatus = "scheduled" | "sending" | "sent" | "failed";

export type EmailCampaignRow = {
  id: string;
  subject: string;
  body_html: string;
  segment: EmailCampaignSegment;
  scheduled_at: string | null;
  status: EmailCampaignStatus;
  sent_at: string | null;
  sent_count: number | null;
  created_at: string;
};

export type EmailTemplateCategory = "payment_reminder" | "system" | "marketing";

export type EmailTemplateRow = {
  key: string;
  name: string;
  category: EmailTemplateCategory | string;
  subject: string;
  body_html: string;
  offer: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
  updated_by?: string | null;
};

export type OrderEmailEventKind = "payment_reminder" | "system" | "marketing";

export type OrderEmailEventRow = {
  id: string;
  order_id: string;
  template_key: string;
  template_name: string | null;
  kind: OrderEmailEventKind | string;
  reminder_code: string | null;
  sent_to: string;
  subject: string;
  body_html: string;
  offer: Record<string, unknown> | null;
  sent_by: string | null;
  sent_by_email: string | null;
  sent_at: string;
  created_at: string;
};

export type ReviewRow = {
  id: string;
  customer_name: string;
  product_id: string;
  rating: number;
  review_text: string | null;
  is_visible: boolean | null;
  created_at: string;
};

export type OrderRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_phone_2: string | null;
  delivery_address: string | null;
  state: string | null;
  city: string | null;
  delivery_method: string | null;
  delivery_fee: number | null;
  order_note: string | null;
  items: unknown;
  total_amount: number | null;
  status: OrderStatus;
  status_history?: OrderStatusHistoryEntry[] | null;
  created_at: string;
};

export type OrderStatus =
  | "order_received"
  | "payment_received"
  | "order_confirmed"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type OrderStatusHistoryEntry = {
  from: OrderStatus | null;
  to: OrderStatus;
  at: string;
};

export type OrderRowInsert = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_phone_2?: string | null;
  delivery_address?: string | null;
  state?: string | null;
  city?: string | null;
  delivery_method: string;
  delivery_fee: number;
  order_note?: string | null;
  items: unknown;
  total_amount: number;
  status: OrderStatus;
};
