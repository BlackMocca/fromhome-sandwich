import _ from 'lodash'
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import MainLayout from "@/features/core/layouts/main.layout";
import ReceiptPreview from "@/features/presentation/transaction/components/receipt"
import ProductCard from "../products/components/product_card";
import { ProductData, ProductCategoryData } from '@/features/api/api';
import { Category, Product, ProductOption } from '@/features/domain/product.type';
import ButtonLayout from '@/features/core/layouts/button.layout';
import classNames from 'classnames';

export default function ReceiptPage() {
  const masterProducts = useMemo(() => ProductData, [])
  const masterProductCategories: string[] = ['', ..._.map(ProductCategoryData, (category) => category.toString())]
  const [products, setProducts] = useState<Product[]>([])
  const [filterCategory, setfilterCategory] = useState<string>('')

  // -----------------------------------------------
  // HANDLE
  // -----------------------------------------------
  const addProduct = (productId: string, amount: number, optionsIds?: string[]) => {
    if (_.findIndex(products, (product: Product) => product.id === productId) === -1) {
      // Does not exists Add them
      let index = _.findIndex(masterProducts, (product: Product) => product.id === productId)
      if (index > -1) {
        let cpProduct = _.cloneDeep(masterProducts[index])
        cpProduct.options = _.filter(masterProducts[index].options, (option: ProductOption) => _.indexOf(optionsIds, option.id) !== -1)
   
        setProducts(prevState => ([...prevState, cpProduct]))
      }
    }
  }
  console.log(products)

  const onDeleteProduct = (productId: string) => {
    setProducts(prevState => (_.filter(prevState, (product: Product) => product.id !== productId)))
  }

  const filterProducts = (category: string) => {
    setfilterCategory(category)
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
            <ProductCard key={i} product={item} onAdd={addProduct} onDelete={onDeleteProduct} />
        })} 
      </div>
      <ReceiptPreview />
    </div>
  </MainLayout>
  );
}
  