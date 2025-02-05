import _ from "lodash"
import React from "react";
import { Recepit, RecepitPreview, RecepitProduct } from '@/features/domain/receipt.type'
import Image from "next/image";
import ButtonLayout from "@/features/core/layouts/button.layout";
import { ProductOption } from "@/features/domain/product.type";

interface IReceiptPreview {
  receipt: Recepit | RecepitPreview
}

export default function ReceiptPreview(props: IReceiptPreview) {
    let grandTotal: number = 0, 
        avg: number = 0
    let date: string = "", 
        receip_no: string = ""
        
    switch (props.receipt.kind) {
      case "printing":
        grandTotal = (props.receipt as Recepit).grand_total
        avg = (props.receipt as Recepit).avg
        break
      case "preview":
        grandTotal = (props.receipt as RecepitPreview).calculateGrandTotal()
        break
    }

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
                fill={true}
                priority={true}
                className="object-cover"
                sizes="(max-width: 2400px) 100vw"
              />
            </div>
          </div>

          {/* head bill */}
          <div className="flex flex-1 justify-between py-[16px]">
            <p>Date: 28/01/68 {date}</p>
            <p>Receipt No: 1-01-68 {receip_no}</p>
          </div>

          <div className="w-full border-b border-black border-dashed"></div>

          {/* body bill */}
          <div className="flex flex-col py-[16px]">
            {_.map(props.receipt.products, (product: RecepitProduct, i: number) => (
              <div className="flex flex-row justify-between py-1" key={i}>
                <div className="text-left">
                  <p className="text-sm font-semibold">{product.name}</p>
                  <p>{product.amount} x ฿{product.price.toFixed(2)}</p>

                  {_.map(product.options, (option: ProductOption, j: number) => (
                    <p className="pl-4" key={j}>- {option.name}</p>
                  ))}

                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{product.calculatePrice()}</p>
                </div>
              </div>
            ))}

            
          </div>
            
          <div className="w-full border-b border-black border-dashed"></div>

          {/* result bill */}
          <div className="flex justify-between py-[16px] text-base leading-8">
            <div className="text-left">
              <p className="font-semibold">ราคารวม</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{grandTotal}</p>
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
  