'use client';

import { useOrder } from '@/contexts/OrderContext';

export function ChannelMismatchModal() {
  const { pendingItem, channelName, pendingChannelName, confirmReplace, cancelPending } = useOrder();

  if (!pendingItem) return null;

  const productName = pendingItem.channelProduct.products?.name ?? 'สินค้า';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={cancelPending}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-action/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-primary">สินค้าคนละช่องทาง</h3>
        </div>

        {/* Body */}
        <div className="text-sm text-primary/70 mb-6 leading-relaxed space-y-2">
          <p>
            บิลปัจจุบันมีสินค้าจากช่องทาง
            <span className="font-semibold text-primary"> {channelName ?? 'อื่น'} </span>
            อยู่แล้ว
          </p>
          <p>
            ต้องการเพิ่ม
            <span className="font-semibold text-primary"> {productName} </span>
            จากช่องทาง
            <span className="font-semibold text-primary"> {pendingChannelName ?? 'อื่น'} </span>
          </p>
          <p className="font-semibold text-destructive">
            หากยืนยัน ข้อมูลบิลเดิมจะถูกล้างทั้งหมด แล้วเริ่มบิลใหม่ด้วยสินค้าจากช่องทางนี้แทน
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={cancelPending}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-primary font-medium hover:bg-surface transition-colors text-sm"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={confirmReplace}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 active:scale-95 transition-all text-sm shadow-md"
          >
            ยืนยันล้างและเพิ่มใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
