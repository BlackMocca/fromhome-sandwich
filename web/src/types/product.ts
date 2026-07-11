/** Product entity — Master Data (SPEC.md §1.2, Requirement.md §2) */
export interface Product {
  id: number;
  category_id: number;
  name: string;
  cover_url?: string;    // รูปภาพปกสินค้า
  base_price: number;   // ราคาขายมาตรฐาน
  cost: number;         // ต้นทุน (ใช้คำนวณกำไร Dashboard โดยตรง)
  is_active: boolean;
}

