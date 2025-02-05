import _ from "lodash"
import { Product, Category } from "@/features/domain/product.type"
import { v4 as uuidv4 } from 'uuid';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

export enum PaymentGatewayType {
    Cash = "Cash",
    QRCode = "QRCode"
}

export interface RecepitProduct extends Product {
    amount: number

    calculatePrice(): number
}

export interface Recepit {
    kind: "printing" | "preview"
    // Head of Recepit
    id: string
    merchant_logo: string
    merchant_name: string
    receipt_no: string
    created_at: string                                  // timestamp format YYYY-MM-DD hh:mm:ss
    
    // Body
    products: Array<RecepitProduct>

    // Tail
    payment_gateway_type: PaymentGatewayType            // ช่องทางชำระ
    grand_total: number                                 // ราคาทั้งหมด (net)
    avg: number                                         // เฉลี่ยต่อคน

    calculateGrandTotal(): number
    calculateTotalByCategory(): Map<Category, number>
}

export interface RecepitPreview extends Omit<Recepit, "id" | "receipt_no" | "created_at" | "payment_gateway_type" | "grand_total" | "avg" > {
    setProducts(products: Product[]): RecepitPreview
}

export const newRecepitProduct = (product: Product, amount: number): RecepitProduct => {
    return {
        ...product,
        amount: amount,

        calculatePrice(): number {
            return ((this.price ?? 0) * (this.amount ?? 0))
        },
    }
}

export const newRecepitPreview = (): RecepitPreview => {
    return {
        kind: "preview",
        merchant_logo: "/images/merchange/logo.jpg",
        merchant_name: "From Home Sandwich & Beverage",
        products: [],

        calculateGrandTotal(): number {
            const total = _.reduce(this.products, (sum: number, product: RecepitProduct) => {
                return sum + ((product.price ?? 0) * (product.amount ?? 0))
            }, 0.00);

            return parseFloat(total.toFixed(2))
        },
        calculateTotalByCategory(): Map<Category, number> {
            let m = new Map<Category, number>()
            const sum = (category: Category) => {
                return _.reduce(this.products, (sum: number, product: RecepitProduct) => {
                    if (product.category === category) {
                        return sum + ((product.price ?? 0) * (product.amount ?? 0))
                    }
                    return 0.00
                }, 0.00);
            }

            _.map(Object.values(Category), (category) => {
                m.set(category, sum(category))
            })

            return m
        },

        setProducts(products: RecepitProduct[]): RecepitPreview {
            return {
                ...this,
                products: products, 
            }
        }
    }
}