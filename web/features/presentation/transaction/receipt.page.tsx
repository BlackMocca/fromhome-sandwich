import React from "react";
import Image from "next/image";
import MainLayout from "@/features/core/layouts/main.layout";
import ReceiptPreview from "@/features/presentation/transaction/components/receipt"

export default function ReceiptPage() {
    // -----------------------------------------------
    // RENDER
    // -----------------------------------------------
    return (
    <MainLayout>
      <div className="flex flex-1 gap-[24px]">
        <div className="flex flex-1 overflow-visible overflow-y-auto bg-white">
          main 
        </div>
        <ReceiptPreview />
      </div>
    </MainLayout>
    );
  }
  