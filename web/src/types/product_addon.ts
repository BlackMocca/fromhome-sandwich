/** ProductAddon entity — Master Data (SPEC.md §1.3, Requirement.md §1.3) */
export interface ProductAddon {
  id: number;
  name: string;
  base_price: number;
  is_active: boolean;
  created_at?: string
  updated_at?: string
}