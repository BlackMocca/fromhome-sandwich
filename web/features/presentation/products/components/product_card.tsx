import _ from "lodash"
import { Product } from "@/features/domain/product.type"
import Image from "next/image"
import ButtonLayout from "@/features/core/layouts/button.layout"

export default function ProductCard(props: Product) {
    return (
        <div className="flex bg-primary p-[24px] border-0 rounded-[27px]">
            <div className="flex flex-1 flex-row gap-[38px]">
                <div className="relative w-[170px] h-[170px] border-0 rounded-[27px] overflow-hidden">
                    <Image 
                        src={props.image}
                        alt={props.name}
                        layout="fill" 
                        objectFit="cover"
                        priority={true}
                    />
                </div>
                <div className="flex flex-col flex-1 gap-[16px] text-secondary text-2xl">
                    <p>{props.name}</p>
                    <p>฿{props.price}</p>
                    
                    {_.size(props.options) > 0 && (
                        <div className="flex flex-row flex-wrap gap-2">
                            {_.map(props.options, (option, i) => (
                                <ButtonLayout
                                    key={i}
                                    title={option.name}
                                    isActive={false}
                                    onclick={() => {}}
                                    size="sm"
                                    style="inline-flex text-sm"
                                />
                            ))}
                        </div>
                    )}

                    <div className="flex flex-row w-[24px] text-xl gap-4">
                        <ButtonLayout title="-" isActive={false} onclick={() => {}} size="sm" />
                            <input 
                                type="text" 
                                min="1" 
                                max="20" 
                                step={1} 
                                autoComplete="off" 
                                value="1"
                                className="w-[16px] text-secondary text-center bg-primary"    
                            />
                        <ButtonLayout title="+" isActive={false} onclick={() => {}} size="sm" />
                    </div>
                    <div className="flex justify-end">
                        <ButtonLayout title="เพิ่มเข้าบิล" isActive={false} onclick={() => {}} size="md" style="inline-flex"/>
                    </div>
                </div>
            </div>
        </div>
    )
}