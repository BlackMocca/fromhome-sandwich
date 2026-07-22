/** Ingredient Purchase (บันทึกการซื้อวัตถุดิบ) entity */

export interface IngredientPurchase {
  id: number;
  ingredient_id: number;
  purchase_date: string;          // 'YYYY-MM-DD'
  quantity: number;
  unit: string;
  amount: number;                 // Total cost / Amount paid
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** ข้อมูลนำเข้าสำหรับสร้างรายการซื้อวัตถุดิบ */
export interface CreateIngredientPurchaseInput {
  ingredient_id: number;
  purchase_date: string;          // 'YYYY-MM-DD' (default to today)
  quantity: number;               // Must be > 0
  unit: string;                   // e.g., กล่อง, กก., ลู่น, แพ็ค
  amount: number;                 // Total cost / Amount paid. Must be >= 0
  note?: string | null;
}

/** ข้อมูลนำเข้าสำหรับอัปเดตรายการซื้อวัตถุดิบ */
export interface UpdateIngredientPurchaseInput {
  ingredient_id?: number;
  purchase_date?: string;         // 'YYYY-MM-DD'
  quantity?: number;              // Must be > 0 if provided
  unit?: string;
  amount?: number;                // Must be >= 0 if provided
  note?: string | null;
}
