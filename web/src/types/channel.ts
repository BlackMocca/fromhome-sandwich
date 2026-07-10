/** Channel entity — Sales channel (Requirement.md §2.1) */
export interface Channel {
  id: number;
  code: string;         // e.g., "LMN", "RBN", "GRB"
  name: string;         // e.g., "Lineman", "Robinhood", "Grabfood"
  gp_percentage?: number;// Gross Profit % (สูตร: ต้นทุน = ราคาขาย / (1 + GP%))
  cover_url?: string
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/** ProductChannelMapping — Bridge table for channel-specific pricing */
export interface ProductChannelMapping {
  channel_id: number;
  product_id: number;
  override_price: number | null;  // null = use base_price from Master
}
