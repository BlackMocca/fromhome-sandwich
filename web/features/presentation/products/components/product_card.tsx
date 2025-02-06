import _ from "lodash"
import { Product } from "@/features/domain/product.type"
import Image from "next/image"
import ButtonLayout from "@/features/core/layouts/button.layout"
import { useState } from "react"
import classNames from "classnames"
import { MerchantData } from "@/features/api/api"

interface IProductCard {
    product: Product
    onAdd?: (productId: string, amount: number, optionIds?: string[]) => void
}

export default function ProductCard(props: IProductCard) {
    const [selectOptions, setSelectOptions] = useState<string[]>([])
    const [amount, setAmount] = useState<number>(1)

    const onClickOptions = (optionId: string): void =>  {
        if (_.includes(selectOptions, optionId)) {
            // exists remove in slice
            setSelectOptions(prevState => _.filter(prevState, (prevOptionId) => prevOptionId !== optionId))
        } else {
            // does not exists add in slice
            setSelectOptions(prevState => [...prevState, optionId])
        }
    }

    // @count canbe -1 or 1
    const onClickCountAmount = (count: -1 | 1): void => {
        setAmount(prevState => (prevState + count > 0) ? prevState + count: 1 )
    }

    const resetState = (): void => {
        setSelectOptions([])
        setAmount(1)
    }

    return (
        <div className="flex bg-primary p-[24px] border-0 rounded-[27px]">
            <div className="flex flex-1 flex-row gap-[38px]">
                <div className="relative w-[170px] h-[170px] border-0 rounded-[27px] overflow-hidden">
                    <Image 
                        src={props.product.image}
                        alt={props.product.name}
                        fill={true}
                        priority={true}
                        sizes="(max-width: 2400px) 100vw"
                        className="object-cover"
                        onError={(e) => {(e.target as HTMLImageElement).src = MerchantData.logo}}
                    />
                </div>
                <div className="flex flex-col flex-1 gap-[16px] text-secondary text-2xl">
                    <p>{props.product.name}</p>
                    <p>฿{props.product.price}</p>
                    
                    {_.size(props.product.options) > 0 && (
                        <div className="flex flex-row flex-wrap gap-2">
                            {_.map(props.product.options, (option, i) => (
                                <ButtonLayout
                                    key={i}
                                    title={option.name}
                                    isActive={_.includes(selectOptions, option.id)}
                                    onclick={() => { onClickOptions(option.id) }}
                                    size="sm"
                                    style="inline-flex text-sm"
                                    buttonStyleType={'secondary'}
                                />
                            ))}
                        </div>
                    )}

                    <div className="flex flex-row w-[24px] text-xl gap-4">
                        <ButtonLayout title="-" isActive={false} onclick={() => {onClickCountAmount(-1)}} size="sm" buttonStyleType={'secondary'} />
                            <input 
                                type="text" 
                                min="1" 
                                max="100" 
                                step={1} 
                                autoComplete="off" 
                                value={amount}
                                disabled={true}
                                className="w-[24px] text-secondary text-center bg-primary"    
                            />
                        <ButtonLayout title="+" isActive={false} onclick={() => {onClickCountAmount(1)}} size="sm" buttonStyleType={'secondary'} />
                    </div>
                    <div className="flex gap-4 justify-end">
                        <ButtonLayout 
                            title="เพิ่มรายการ"
                            isActive={(false)} 
                            onclick={() => { 
                                props.onAdd?.(props.product.id, amount, selectOptions) 
                                resetState()
                            }} 
                            size="md" 
                            style="bg-success text-secondary"
                            buttonStyleType={'success'}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}