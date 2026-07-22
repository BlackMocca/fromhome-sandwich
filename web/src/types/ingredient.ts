/** Ingredient master entity */

export interface Ingredient {
  id: number;
  name: string;
  default_unit: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}
