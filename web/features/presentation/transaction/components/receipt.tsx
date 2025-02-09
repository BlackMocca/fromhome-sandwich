import _ from "lodash";
import React, { useEffect, useState, useMemo, useRef, Fragment } from "react";
import {
  Recepit,
  RecepitPreview,
  RecepitProduct,
  newRecepit,
} from "@/features/domain/receipt.type";
import Image from "next/image";
import ButtonLayout from "@/features/core/layouts/button.layout";
import { ProductOption } from "@/features/domain/product.type";
import classNames from "classnames";
import { formatDate, ParseYear, Format } from "@/features/core/helper";
import html2canvas from "html2canvas";

interface IReceiptPreview {
  receipt: Recepit | RecepitPreview;
  onUpdateReceiptPreview?(newData: Partial<RecepitPreview>): void;
  onCreate?(data: Recepit): void;
  onClear?(): void;
}

interface ICustomerInfo {
  customer_name: string;
}

interface modalInputCustomerInfoProps {
  isDisplay: boolean;
  onCancel: () => void;
  callbackOnSubmit: (info: Partial<ICustomerInfo>) => void;
}

const ModalInputCustomerInfo = ({
  isDisplay,
  onCancel,
  callbackOnSubmit,
}: modalInputCustomerInfoProps): React.JSX.Element => {
  const [customerName, setCustomerName] = useState("");

  const handleSubmit = () => {
    callbackOnSubmit({ customer_name: customerName });
  };

  return (
    <div
      className={classNames(
        "flex justify-center items-center fixed top-0 left-0 w-screen h-dvh bg-black bg-opacity-50 backdrop-blur-md",
        { hidden: !isDisplay }
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="flex flex-col w-1/2 bg-white px-4 py-8 gap-4">
        <fieldset className="border-2 border-primary rounded-[27px] p-4 text-base">
          <legend className="text-lg font-semibold px-2 py-1 rounded-md">
            Customer Information
          </legend>
          <label className="py-2">
            ชื่อลูกค้า
            <input
              type="text"
              className="w-full border border-primary rounded-lg px-3 py-2"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>
        </fieldset>
        <div className="flex flex-1 flex-row gap-4 justify-evenly">
          <ButtonLayout
            title="ยกเลิก"
            size="md"
            onclick={() => {
              onCancel();
            }}
            isActive={false}
            buttonStyleType="error"
            style="min-w-[33%]"
          />
          <ButtonLayout
            title="ตกลง"
            size="md"
            onclick={handleSubmit}
            isActive={false}
            buttonStyleType="success"
            style="min-w-[33%]"
          />
        </div>
      </div>
    </div>
  );
};

export default function ReceiptPreview(props: IReceiptPreview) {
  const [showModal, setShowModal] = useState(false);
  const [isDisableOnCreateButton, setIsDisableOnCreateButton] = useState(false);

  const captureRef = useRef<HTMLDivElement>(null);
  const { grandTotal, date, receip_no } = useMemo(() => {
    switch (props.receipt.kind) {
      case "printing":
        return {
          grandTotal: (props.receipt as Recepit).grand_total,
          date: formatDate(
            (props.receipt as Recepit).created_at,
            ParseYear.THAI,
            Format.DISPLAY_TIMESTAMP
          ),
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
  }, [props.receipt]);

  // -----------------------------------------------
  // Handle
  // -----------------------------------------------
  const onSubmit = () => {
    let recepit = newRecepit(props.receipt as RecepitPreview);
    props.onCreate?.(recepit);
  };

  const onCustomerInfoSubmit = (customerInfo: Partial<ICustomerInfo>) => {
    props.onUpdateReceiptPreview?.(customerInfo);
    setShowModal(false);
  };

  const download = async () => {
    if (captureRef.current && props.receipt.kind === "printing") {
      const style = document.createElement("style");
      document.head.appendChild(style);
      style.sheet?.insertRule(
        "body > div:last-child img { display: inline-block; }"
      );
      captureRef.current.scrollTop = captureRef.current.scrollHeight;
      const canvas = await html2canvas(captureRef.current, {
        scale: window.devicePixelRatio,
        x: 0,
        y: 0,
        logging: true,
      });
      console.log(canvas);

      const image = canvas.toDataURL("image/jpeg", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `${
        (props.receipt as Recepit)?.receipt_no !== ""
          ? (props.receipt as Recepit)?.receipt_no
          : "screenshot"
      }.jpg`;
      link.click();
    }
  };

  // -----------------------------------------------
  // RENDER
  // -----------------------------------------------
  return (
    <div
      className={classNames(
        "flex flex-col flex-between w-[304px] border border-black rounded-[27px] overflow-y-auto text-black text-xs scrollbar-hide",
        {
          "flip-y": props.receipt.kind === "printing",
        }
      )}
    >
      <div ref={captureRef} className="px-[14px] py-[24px]">
        {/* head bill */}
        <div className="flex py-[16px] justify-center relative">
          <img src={props.receipt.merchant_logo} width={100} height={89} />
        </div>
        {props.receipt.customer_name ? (
          <div className="flex w-full py-[8px] justify-center">
            <p className="font-semiBold text-4xl">
              {props.receipt.customer_name}
            </p>
          </div>
        ) : (
          <></>
        )}
        <div className="flex flex-1 flex-col gap-1 py-[16px]">
          <p>Date: {date}</p>
          <p>Receipt No: {receip_no}</p>
        </div>

        <div className="w-full border-b border-black border-dashed"></div>

        {/* body bill */}
        <div className="flex flex-col py-[16px]">
          {_.map(
            props.receipt.products,
            (product: RecepitProduct, i: number) => (
              <div className="flex flex-row justify-between py-1" key={i}>
                <div className="text-left">
                  <p className="text-sm">{product.name}</p>
                  <p>
                    {product.amount} x ฿{product.price.toFixed(2)}
                  </p>

                  {_.map(
                    product.options,
                    (option: ProductOption, j: number) => (
                      <p className="pl-4" key={j}>
                        - {option.name}
                      </p>
                    )
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm">{product.calculatePrice()}</p>
                </div>
              </div>
            )
          )}
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

        {/* tail bill */}
        {props.receipt?.socials ? (
          <Fragment>
            <div className="w-full border-b border-black border-dashed"></div>
            <div className="flex flex-col justify-center items-center py-[16px]">
              <p className="py-2">{props.receipt?.socials.slogan}</p>
              <div className="flex flex-row justify-center items-center gap-1">
                {_.map(props.receipt?.socials.icons, (icon, i) => (
                  <img
                    key={i}
                    src={`/images/icon/${icon}.svg`}
                    alt={`icon-${icon}`}
                    width={16}
                    height={16}
                  />
                ))}
                <p>{props.receipt?.socials.search}</p>
              </div>
            </div>
          </Fragment>
        ) : (
          <></>
        )}
      </div>

      {/* tail bill sohw only preview */}
      <div className="flex flex-col gap-2 h-full text-2xl justify-end items-end px-[14px] pb-[24px]">
        {props.receipt.kind === "preview" ? (
          <>
            <ModalInputCustomerInfo
              isDisplay={showModal}
              onCancel={() => {
                setShowModal(false);
              }}
              callbackOnSubmit={onCustomerInfoSubmit}
            />
            <ButtonLayout
              title="ล้างข้อมูล"
              buttonStyleType="error"
              size="lg"
              isActive={false}
              onclick={() => {
                setIsDisableOnCreateButton(false);
                props.onClear?.();
              }}
            />
            <ButtonLayout
              title="เพิ่ม/แก้ไข ชื่อลูกค้า"
              buttonStyleType={
                _.size(props.receipt.products) === 0 ? "disable" : "primary"
              }
              size="lg"
              isActive={false}
              onclick={() => setShowModal(true)}
            />
            <ButtonLayout
              title="สร้างบิล"
              buttonStyleType={
                _.size(props.receipt.products) === 0 || isDisableOnCreateButton
                  ? "disable"
                  : "success"
              }
              size="lg"
              isActive={false}
              onclick={(e) => {
                setIsDisableOnCreateButton(true);
                onSubmit();
              }}
            />
          </>
        ) : (
          <>
            <ButtonLayout
              title="สร้างบิลใหม่"
              buttonStyleType="error"
              size="lg"
              isActive={false}
              onclick={() => {
                setIsDisableOnCreateButton(false);
                props.onClear?.();
              }}
            />

            <ButtonLayout
              title="Download"
              buttonStyleType={
                _.size(props.receipt.products) === 0 ? "disable" : "primary"
              }
              size="lg"
              isActive={false}
              onclick={() => setTimeout(() => download(), 0)}
            />
          </>
        )}
      </div>
    </div>
  );
}
