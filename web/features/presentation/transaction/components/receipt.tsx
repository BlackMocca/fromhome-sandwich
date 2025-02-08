import _ from "lodash"
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Recepit, RecepitPreview, RecepitProduct, newRecepit } from '@/features/domain/receipt.type'
import Image from "next/image";
import ButtonLayout from "@/features/core/layouts/button.layout";
import { ProductOption } from "@/features/domain/product.type";
import classNames from "classnames";
import { formatDate, ParseYear, Format } from "@/features/core/helper";
import html2canvas from "html2canvas";

interface IReceiptPreview {
  receipt: Recepit | RecepitPreview
  onClearProduct?(): void
  onUpdateReceiptPreview?(newData: Partial<RecepitPreview>): void
}

export default function ReceiptPreview(props: IReceiptPreview) {
    const [receipt, setReceipt] = useState<Recepit | undefined >(undefined)
    const captureRef = useRef<HTMLDivElement>(null);
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

    const download = async () => {
      if (captureRef.current) {
        const style = document.createElement('style');
        document.head.appendChild(style);
        style.sheet?.insertRule('body > div:last-child img { display: inline-block; }');
        captureRef.current.scrollTop = captureRef.current.scrollHeight
        const canvas = await html2canvas(captureRef.current, {
          scale: window.devicePixelRatio,
          useCORS: true,
          x:0,
          y:0,
          logging: true, 
                    
          imageTimeout: 0,
        });
        console.log(canvas)
        
        const image = canvas.toDataURL("image/jpeg", 100);
        const link = document.createElement("a");
        link.href = image;
        link.download =  `${receipt?.receipt_no !== "" ? receipt?.receipt_no: "screenshot"}.jpg`;
        link.click();
      }
    };

    // -----------------------------------------------
    // RENDER
    // -----------------------------------------------
    return (
      <div className={classNames(
          "flex flex-col flex-between w-[304px] border border-black rounded-[27px] overflow-y-auto text-black text-xs scrollbar-hide",
          {"flip-y": receipt !== undefined},
        )}
      >
        <div ref={captureRef} className="px-[14px] py-[24px]">

          {/* head bill */}
          <div className="flex py-[16px] justify-center relative">
            <img src={props.receipt.merchant_logo} width={100} height={89} />
          </div>
          { props.receipt.customer_name ? (
            <div className="flex w-full py-[8px] justify-center">
              <p className="font-semiBold text-4xl">{props.receipt.customer_name}</p>
            </div>
          ): <></>}
          <div className="flex flex-1 flex-col gap-1 py-[16px]">
            <p>Date: {date}</p>
            <p>Receipt No: {receip_no}</p>
          </div>

          <div className="w-full border-b border-black border-dashed"></div>

          {/* body bill */}
          <div className="flex flex-col py-[16px]">
            {_.map(props.receipt.products, (product: RecepitProduct, i: number) => (
              <div className="flex flex-row justify-between py-1" key={i}>
                <div className="text-left">
                  <p className="text-sm">{product.name}</p>
                  <p>{product.amount} x ฿{product.price.toFixed(2)}</p>

                  {_.map(product.options, (option: ProductOption, j: number) => (
                    <p className="pl-4" key={j}>- {option.name}</p>
                  ))}

                </div>
                <div className="text-right">
                  <p className="text-sm">{product.calculatePrice()}</p>
                </div>
              </div>
            ))}
          </div>
            
          <div className="w-full border-b border-black border-dashed"></div>

          {/* result bill */}
          <div className="flex justify-between py-[16px] text-base leading-8">
            <div className="text-left">
              <p>ราคารวม</p>
            </div>
            <div className="text-right">
              <p>{grandTotal}</p>
            </div>
          </div>
        </div>

        {/* tail bill sohw only preview */}
        <div className="flex flex-col gap-2 h-full text-2xl justify-end items-end px-[14px] pb-[24px]">
        {receipt === undefined ? (
          <>
            <ButtonLayout 
              title="ล้างสินค้า"
              buttonStyleType="error"
              size="lg"
              isActive={false}
              onclick={() => props.onClearProduct?.()}
            />
            <ButtonLayout 
              title="เพิ่ม/แก้ไข ชื่อลูกค้า"
              buttonStyleType={_.size(props.receipt.products) === 0 ? "disable":"primary"}
              size="lg"
              isActive={false}
              onclick={() => props.onUpdateReceiptPreview?.({customer_name: "ASDC"})}
            />
            <ButtonLayout 
              title="สร้างบิล"
              buttonStyleType={_.size(props.receipt.products) === 0 ? "disable":"success"}
              size="lg"
              isActive={false}
              onclick={() => onSubmit()}
            />
          </>
        ):
          <ButtonLayout 
            title="Download"
            buttonStyleType={_.size(props.receipt.products) === 0 ? "disable":"primary"}
            size="lg"
            isActive={false}
            onclick={ async () => await download()}
          />
        }
        </div>
      </div>
    );
  }
  