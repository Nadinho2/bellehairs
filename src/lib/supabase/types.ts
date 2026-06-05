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
  order_id_display: string | null;
  source: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_phone_2: string | null;
  whatsapp_number: string | null;
  delivery_address: string | null;
  state: string | null;
  city: string | null;
  delivery_method: string | null;
  delivery_fee: number | null;
  order_note: string | null;
  items: unknown;
  total_amount: number | null;
  status: OrderStatus;
  assigned_to: string | null;
  internal_notes: string | null;
  reminders_sent: string[] | null;
  reminder_stopped: boolean | null;
  bot_session_id: string | null;
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

// ============================================================
// Lead & Order Management Dashboard Types
// ============================================================

export type ProfileRow = {
  id: string;
  full_name: string;
  role: "admin" | "staff";
  created_at: string;
};

export type LeadRow = {
  id: string;
  whatsapp_number: string;
  customer_name: string | null;
  enquiry_about: string | null;
  last_message: string | null;
  last_message_at: string | null;
  follow_up_status: "not_contacted" | "in_conversation" | "converted";
  assigned_to: string | null;
  converted_order_id: string | null;
  notes: string | null;
  source: string;
  created_at: string;
};

export type CustomerRow = {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  state: string | null;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
  tag: "vip" | "regular" | "first_timer" | "cold_lead";
  notes: string | null;
  created_at: string;
};

export type StaffActivityLogRow = {
  id: string;
  staff_id: string | null;
  staff_name: string | null;
  action: string;
  entity_type: "order" | "lead" | "customer" | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
};

export type ProductEnquiryRow = {
  id: string;
  product_name: string;
  product_id: string | null;
  enquiry_count: number;
  order_count: number;
  last_enquired_at: string | null;
};
