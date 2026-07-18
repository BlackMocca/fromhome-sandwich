/** Disbursement (เบิกเงิน) entity — รายการเบิกเงินพร้อมราคา วันที่ และสถานะจ่าย */

/** สถานะการจ่าย: paid = จ่ายแล้ว, unpaid = ค้างจ่าย */
export type DisbursementStatus = 'paid' | 'unpaid';

/** ป้ายภาษาไทยสำหรับสถานะ */
export const DISBURSEMENT_STATUS_LABELS: Record<DisbursementStatus, string> = {
  paid: 'จ่ายแล้ว',
  unpaid: 'ค้างจ่าย',
};

/** รายการเบิกเงิน */
export interface Disbursement {
  id: number;
  withdraw_no: string;
  withdraw_date: string;        // 'YYYY-MM-DD'
  description: string;          // รายการ
  amount: number;               // ราคา / จำนวนเงิน
  status: DisbursementStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** ข้อมูลนำเข้าสำหรับสร้างรายการเบิก (ใช้ใน createDisbursement) */
export interface CreateDisbursementInput {
  withdraw_no: string;
  withdraw_date: string;
  description: string;
  amount: number;
  status: DisbursementStatus;
  note?: string | null;
}
