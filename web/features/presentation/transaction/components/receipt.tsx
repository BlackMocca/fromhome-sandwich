import _ from "lodash"
import React, { useEffect, useState, useMemo } from "react";
import { Recepit, RecepitPreview, RecepitProduct, newRecepit } from '@/features/domain/receipt.type'
import Image from "next/image";
import ButtonLayout from "@/features/core/layouts/button.layout";
import { ProductOption } from "@/features/domain/product.type";
import classNames from "classnames";
import { formatDate, ParseYear, Format } from "@/features/core/helper";

interface IReceiptPreview {
  receipt: Recepit | RecepitPreview
}

export default function ReceiptPreview(props: IReceiptPreview) {
    const [receipt, setReceipt] = useState<Recepit | undefined >(undefined)
    const { grandTotal, date, receip_no } = useMemo(() => {
      if (receipt) {
        return {
          grandTotal: receipt.grand_total,
          date: formatDate(receipt.created_at, ParseYear.THAI, Format.DISPLAY_TIMESTAMP),
          receip_no: receipt.receipt_no
        }
      }
      switch (props.receipt.kind) {
        case "printing":
          return {
            grandTotal: (props.receipt as Recepit).grand_total,
            date: formatDate((props.receipt as Recepit).created_at, ParseYear.THAI, Format.DISPLAY_TIMESTAMP),
            receip_no: (props.receipt as Recepit).receipt_no,
          };
        case "preview":
          return {
            grandTotal: (props.receipt as RecepitPreview).calculateGrandTotal(),
            date: "",
            receip_no: "",
          };
        default:
          return { grandTotal: 0, date: "", receip_no: "" };
      }
    }, [props.receipt, receipt]);

    // -----------------------------------------------
    // Handle
    // -----------------------------------------------
    const onSubmit = () => {
      let recepit = newRecepit((props.receipt as RecepitPreview))
      setReceipt(recepit)
    }

    // -----------------------------------------------
    // RENDER
    // -----------------------------------------------
    return (
      <div className={classNames(
          "flex flex-col flex-between w-[304px] border border-black rounded-[27px] px-[14px] py-[24px] text-black text-xs !overflow-y-auto scrollbar-hide",
          {"flip-y": receipt !== undefined},
        )}
      >
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
          <div className="flex flex-1 flex-col py-[16px] gap-1">
            <p>Date: {date}</p>
            <p>Receipt No: {receip_no}</p>
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
            onclick={() => onSubmit()}
          />
        </div>
      </div>
    );
  }
  