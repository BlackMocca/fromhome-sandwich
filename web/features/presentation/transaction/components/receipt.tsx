import React from "react";
import { Recepit } from '@/features/domain/receipt.type'
import Image from "next/image";

// export default function ReceiptPreview(props: Recepit) {
export default function ReceiptPreview() {

    // -----------------------------------------------
    // RENDER
    // -----------------------------------------------
    return (
      <div className="flex w-[304px] bg-red-500">
        <div className="">
          asdads
          {/* <Image 
            src={props.merchant_logo}
            alt="merchant_logo"
            priority={true}
          /> */}
        </div>
      </div>
    );
  }
  