import _ from 'lodash'
import React from "react";
import Image from "next/image";
import MainLayout from "@/features/core/layouts/main.layout";
import ReceiptPreview from "@/features/presentation/transaction/components/receipt"
import ProductCard from "../products/components/product_card";
import { ProductData } from '@/features/api/api';

export default function ReceiptPage() {
  const products = ProductData
  // -----------------------------------------------
  // RENDER
  // -----------------------------------------------
  return (
  <MainLayout>
    <div className="flex flex-1 gap-[24px]">
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-hide gap-[20px]">
        {_.map(products, (item, i) => {
          return <ProductCard key={i} {...item} />
        })} 
      </div>
      <ReceiptPreview />
    </div>
  </MainLayout>
  );
}
  