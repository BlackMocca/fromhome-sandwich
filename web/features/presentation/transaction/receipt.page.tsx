import _ from "lodash";
import React, { useEffect, useState, useMemo } from "react";
import MainLayout from "@/features/core/layouts/main.layout";
import ReceiptPreview from "@/features/presentation/transaction/components/receipt";
import ProductCard from "../products/components/product_card";
import {
  GetProductBySaleGateway,
  ProductCategoryData,
} from "@/features/api/api";
import { Product, ProductOption } from "@/features/domain/product.type";
import ButtonLayout from "@/features/core/layouts/button.layout";
import { SaleGateway } from "../../domain/receipt.type";
import {
  newRecepitPreview,
  newRecepitProduct,
  RecepitProduct,
  RecepitPreview,
  Recepit,
} from "@/features/domain/receipt.type";

interface ReceiptPageProps {
  sale_gateway: SaleGateway;
}

const newDefaultReceiptPreview = (props: ReceiptPageProps) => {
  return newRecepitPreview({ sale_gateway: props.sale_gateway });
};

export default function ReceiptPage(props: ReceiptPageProps) {
  const masterProducts = GetProductBySaleGateway(props.sale_gateway);
  const masterProductCategories: string[] = [
    "",
    ..._.map(ProductCategoryData, (category) => category.toString()),
  ];
  const [products, setProducts] = useState<RecepitProduct[]>([]);
  const [filterCategory, setfilterCategory] = useState<string>("");
  const [recepit, setRecepit] = useState<RecepitPreview | Recepit>(
    newDefaultReceiptPreview(props)
  );

  useEffect(() => {
    if (recepit.kind === "preview") {
      setRecepit((recepit as RecepitPreview).setProducts(products));
    }
  }, [products]);

  // -----------------------------------------------
  // HANDLE
  // -----------------------------------------------
  const addProduct = (
    productId: string,
    amount: number,
    optionsIds?: string[]
  ) => {
    // Does not exists Add them
    let index = _.findIndex(
      masterProducts,
      (product: Product) => product.id === productId
    );
    if (index > -1) {
      let cpProduct: RecepitProduct = newRecepitProduct(
        _.cloneDeep<Product>(masterProducts[index]),
        amount
      );
      cpProduct.options = _.filter(
        masterProducts[index].options,
        (option: ProductOption) => _.indexOf(optionsIds, option.id) !== -1
      );

      setProducts((prevState) => [...prevState, cpProduct]);
    }
  };

  const filterProducts = (category: string) => {
    setfilterCategory(category);
  };

  const updateReceipt = (newData: Partial<RecepitPreview>) => {
    setRecepit((prev) => {
      return { ...prev, ...newData };
    });
  };

  const onClear = () => {
    setProducts([]);
    setRecepit(newDefaultReceiptPreview(props));
  };

  const onCreateBill = async (receipt: Recepit) => {
    const response = await fetch("/api/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(receipt),
    });

    const data = await response.json();
    if (response.ok) {
      receipt.receipt_no = data.receipt_no;
      setRecepit(receipt);

      console.log("Receipt saved successfully!");
    } else {
      alert("Error: " + data.error);
    }

    console.log(receipt);
  };

  // -----------------------------------------------
  // RENDER
  // -----------------------------------------------
  return (
    <MainLayout>
      <div className="flex flex-1 gap-[24px]">
        <div className="flex flex-1 flex-col overflow-y-auto scrollbar-hide gap-[20px]">
          <div className="flex flex-rows gap-[14px] px-[24px]">
            {_.map(masterProductCategories, (item: string, index) => (
              <ButtonLayout
                key={index}
                title={item.toString() === "" ? "All" : item.toString()}
                isActive={item.toString() === filterCategory}
                size="md"
                onclick={() => {
                  filterProducts(item);
                }}
                style="inline-flex"
                buttonStyleType="primary"
              />
            ))}
          </div>
          {_.map(masterProducts, (item, i) => {
            return (
              (filterCategory === "" || item.category === filterCategory) && (
                <ProductCard key={i} product={item} onAdd={addProduct} />
              )
            );
          })}
        </div>
        <ReceiptPreview
          receipt={recepit}
          onClear={onClear}
          onUpdateReceiptPreview={updateReceipt}
          onCreate={onCreateBill}
        />
      </div>
    </MainLayout>
  );
}
