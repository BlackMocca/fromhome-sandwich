import _ from "lodash"
import { Product, Category } from "@/features/domain/product.type"
import { v4 as uuidv4 } from 'uuid';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { MerchantData } from "@/features/api/api";

dayjs.extend(utc);
dayjs.extend(timezone);

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
    customer_name?: string
    receipt_no: string
    created_at: string                                  // timestamp format YYYY-MM-DD HH:mm:ss
    
    // Body
    products: Array<RecepitProduct>

    // Tail
    grand_total: number                                 // ราคาทั้งหมด (net)

    calculateGrandTotal(): number
    calculateTotalByCategory(): Map<Category, number>
}

export const newRecepit = (recepit: RecepitPreview): Recepit => {
    return {
        kind: "printing",
        id: uuidv4(),
        merchant_logo: recepit.merchant_logo,
        merchant_name: recepit.merchant_name,
        receipt_no: "",
        created_at: dayjs().tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss"),
        products: [...recepit.products],
        grand_total: recepit.calculateGrandTotal(),
        calculateGrandTotal: recepit.calculateGrandTotal,
        calculateTotalByCategory: recepit.calculateTotalByCategory,
    }
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
        merchant_logo: MerchantData.logo,
        merchant_name: MerchantData.name,
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