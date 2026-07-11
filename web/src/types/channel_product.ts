import type { Product } from "./product";
import type { ChannelProductAddon } from "./channel_product_addon";

/** ChannelProduct entity — Channel-specific product 
 *  name, category_id, cover_url come from master product via joined `products`
 *  price, cost can be overridden per channel
 */
export interface ChannelProduct {
  id: number;
  channel_id: number;
  product_id: number;
  
  // Mutable fields (can be overridden per channel)
  price: number;
  cost: number;
  
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Populated from joins
  products?: Product;
  channel_product_addons?: ChannelProductAddon[];
}

