import type { ProductAddon } from "./product_addon";

/** ChannelProductAddon — Junction mapping channel_product to addon with price override */
export interface ChannelProductAddon {
  channel_product_id: number;
  addon_id: number;
  price: number;

  // Populated from join
  product_addons?: ProductAddon;
}
