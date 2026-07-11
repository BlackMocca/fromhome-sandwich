import { ProductAddon } from "./product_addon";

/** ProductMappingAddon entity — Mapping products to their addons/options */
export interface ProductMappingAddon {
  product_id: number;
  addon_id: number;

  // Populate Query
  product_addons?: ProductAddon
}
