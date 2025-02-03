import React from "react";
import { Recepit } from '@/features/domain/receipt.type'
import Image from "next/image";

export default function ReceiptPreview(props: Recepit) {
    // -----------------------------------------------
    // RENDER
    // -----------------------------------------------
    return (
      <div className="flex w-[909px] h-[500px] bg-white">
        <div className="">
          {/* <Image 
            src={props.merchant_logo}
            alt="merchant_logo"
            priority={true}
          /> */}
        </div>
      </div>
    );
  }
  