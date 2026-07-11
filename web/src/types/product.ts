/** Product entity — Master Data (SPEC.md §1.2, Requirement.md §2) */
export interface Product {
  id: number;
  category_id: number;
  name: string;
  base_price: number;   // ราคาขายมาตรฐาน
  cost: number;         // ต้นทุน (ใช้คำนวณกำไร Dashboard โดยตรง)
  image_url?: string;    // รูปภาพสินค้า
}

