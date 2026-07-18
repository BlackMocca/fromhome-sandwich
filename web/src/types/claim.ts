/** Claim (เคลมสินค้า) entity — ของหมดอายุ / เสียหาย / สูญหาย ที่ต้นทุนยังคงอยู่กับเรา */

/** เหตุผลการเคลม */
export type ClaimReason = 'expired' | 'damaged' | 'lost' | 'other';

/** สถานะเคลม (cancelled = ไม่นับใน Dashboard) */
export type ClaimStatus = 'active' | 'cancelled';

/** ป้ายภาษาไทยสำหรับเหตุผลการเคลม */
export const CLAIM_REASON_LABELS: Record<ClaimReason, string> = {
  expired: 'หมดอายุ',
  damaged: 'เสียหาย',
  lost: 'สูญหาย',
  other: 'อื่นๆ',
};

/** ป้ายภาษาไทยสำหรับสถานะ */
export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  active: 'ปกติ',
  cancelled: 'ยกเลิก',
};

/** เคลม (Header) */
export interface Claim {
  id: number;
  claim_no: string;
  claim_date: string;          // 'YYYY-MM-DD'
  reason: ClaimReason;
  status: ClaimStatus;
  total_quantity: number;
  total_cost: number;          // ต้นทุนของเสียทั้งหมด (cost ที่ยังอยู่กับเรา)
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** รายการสินค้าที่เคลม (Line Item — snapshot ณ ตอนเคลม) */
export interface ClaimItem {
  id: number;
  claim_id: number;
  product_id: number | null;
  product_name: string;
  unit_cost: number;           // ต้นทุน/หน่วย (snapshot จาก product.cost)
  quantity: number;
  line_cost: number;           // unit_cost * quantity
  note: string | null;
  created_at: string;
}

/** ข้อมูลนำเข้าสำหรับสร้างรายการเคลม (ใช้ใน createClaim) */
export interface CreateClaimItemInput {
  product_id: number | null;
  product_name: string;
  unit_cost: number;
  quantity: number;
  line_cost: number;
  note?: string | null;
}

export interface CreateClaimInput {
  claim_no: string;
  claim_date: string;
  reason: ClaimReason;
  note?: string | null;
  total_quantity: number;
  total_cost: number;
  items: CreateClaimItemInput[];
}

/**
 * แถวสรุปต้นทุนของเสียรายวัน (สำหรับ Dashboard)
 * query จาก claims กรอง claim_date ในช่วง + status='active' แล้วรวมฝั่ง client
 */
export interface ClaimLossRow {
  claim_date: string;
  total_cost: number;
}
