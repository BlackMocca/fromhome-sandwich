import React from "react";
import { Recepit, RecepitPreview } from '@/features/domain/receipt.type'
import Image from "next/image";
import ButtonLayout from "@/features/core/layouts/button.layout";

interface IReceiptPreview {
  mode: "preview" | "printing"
  receipt: Recepit | RecepitPreview
}

export default function ReceiptPreview(props: IReceiptPreview) {

    // -----------------------------------------------
    // RENDER
    // -----------------------------------------------
    return (
      <div className="flex flex-col flex-between w-[304px] border border-black rounded-[27px] px-[14px] py-[24px] text-black text-xs">
        <div>
          <div className="flex relative text-2xl justify-center items-center">
            <p>Bill</p>
            <div className="absolute w-[19px] h-[18px] top-0 right-0">
              <Image 
                src={"/images/plus.png"}
                alt="plus"
                layout="fill"
                objectFit="cover"
              />
            </div>
          </div>

          {/* head bill */}
          <div className="flex flex-1 justify-between py-[16px]">
            <p>Date: 28/01/68</p>
            <p>Receipt No: 1-01-68</p>
          </div>

          <div className="w-full border-b border-black border-dashed"></div>

          {/* body bill */}
          <div className="flex flex-col py-[16px]">
            <div className="flex flex-row justify-between pb-[16px]">
              <div className="text-left">
                <p className="text-sm font-semibold">Matcha Latte</p>
                <p>1 x ฿70.00</p>
                <p className="pl-4">- หวานน้อยมาก</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">140.00</p>
              </div>
            </div>

            <div className="flex flex-row justify-between">
              <div className="text-left">
                <p className="text-sm font-semibold">Matcha Latte</p>
                <p>1 x ฿70.00</p>
                <p className="pl-4">- หวานน้อยมาก</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">140.00</p>
              </div>
            </div>

            
          </div>
            
          <div className="w-full border-b border-black border-dashed"></div>

          {/* result bill */}
          <div className="flex justify-between py-[16px] text-base leading-8">
            <div className="text-left">
              <p className="font-semibold">ราคารวม</p>
              <p className="text-xs">เฉลี่ยต่อคน</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">140.00</p>
              <p className="text-xs">70.00</p>
            </div>
          </div>
        </div>

        {/* tail bill sohw only preview */}
        <div className="flex h-full text-2xl justify-center items-end">
          <ButtonLayout 
            title="ตกลง"
            buttonStyleType="primary"
            size="lg"
            isActive={false}
            onclick={() => {}}
          />
        </div>
      </div>
    );
  }
  