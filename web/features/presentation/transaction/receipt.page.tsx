import _ from 'lodash'
import React, { useEffect, useState, useMemo } from "react";
import MainLayout from "@/features/core/layouts/main.layout";
import ReceiptPreview from "@/features/presentation/transaction/components/receipt"
import ProductCard from "../products/components/product_card";
import { ProductData, ProductCategoryData } from '@/features/api/api';
import { Product, ProductOption } from '@/features/domain/product.type';
import ButtonLayout from '@/features/core/layouts/button.layout';
import { newRecepitPreview, newRecepitProduct, RecepitPreview, RecepitProduct } from '@/features/domain/receipt.type';

export default function ReceiptPage() {
  const masterProducts = useMemo(() => ProductData, [])
  const masterProductCategories: string[] = ['', ..._.map(ProductCategoryData, (category) => category.toString())]
  const [products, setProducts] = useState<RecepitProduct[]>([])
  const [filterCategory, setfilterCategory] = useState<string>('')
  const [recepitPreview, setRecepitPreview] = useState<RecepitPreview>(newRecepitPreview())

  useEffect(() => {
    setRecepitPreview(recepitPreview.setProducts(products))
  }, [products])

  // -----------------------------------------------
  // HANDLE
  // -----------------------------------------------
  const addProduct = (productId: string, amount: number, optionsIds?: string[]) => {
    // Does not exists Add them
    let index = _.findIndex(masterProducts, (product: Product) => product.id === productId)
    if (index > -1) {
      let cpProduct: RecepitProduct = newRecepitProduct(_.cloneDeep<Product>(masterProducts[index]), amount)
      cpProduct.options = _.filter(masterProducts[index].options, (option: ProductOption) => _.indexOf(optionsIds, option.id) !== -1)

      setProducts(prevState => ([...prevState, cpProduct]))
    }
  }

  const filterProducts = (category: string) => {
    setfilterCategory(category)
  }

  const updateReceipt = (newData: Partial<RecepitPreview>) => {
    setRecepitPreview((prev) => { 
        return {...prev, ...newData }
      }
    );
  };

  const onClear = () => {
    setProducts([])
    setRecepitPreview(newRecepitPreview())
  }

  // -----------------------------------------------
  // RENDER
  // -----------------------------------------------
  return (
  <MainLayout>
    <div className="flex flex-1 gap-[24px]">
      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-hide gap-[20px]">
        <div className='flex flex-rows gap-[14px] px-[24px]'>
          {_.map(masterProductCategories, (item: string, index) => (
            <ButtonLayout 
              key={index}
              title={item.toString() === '' ? 'All': item.toString()}
              isActive={item.toString() === filterCategory}
              size="md"
              onclick={() => {filterProducts(item)}}
              style="inline-flex"
              buttonStyleType='primary'
            />
          ))}
        </div>
        {_.map(masterProducts, (item, i) => {
          return (filterCategory === "" || item.category === filterCategory) && 
            <ProductCard key={i} product={item} onAdd={addProduct}  />
        })} 
      </div>
      <ReceiptPreview receipt={recepitPreview} onClearProduct={onClear} onUpdateReceiptPreview={updateReceipt} />
    </div>
  </MainLayout>
  );
}
  