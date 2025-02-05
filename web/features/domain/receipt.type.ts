import _ from "lodash"
import { Product } from "@/features/domain/product.type"
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
}

export interface Recepit {
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
    calculateAvg(): number
}

export interface RecepitPreview extends Omit<Recepit, "id" | "receipt_no" | "created_at" | "payment_gateway_type"> {
    setProducts(products: Product[]): RecepitPreview
}

export const newRecepitPreview = (): RecepitPreview => {
    return {
        merchant_logo: "/images/merchange/logo.jpg",
        merchant_name: "From Home Sandwich & Beverage",
        products: [],
        grand_total: 0,
        avg: 0,

        calculateGrandTotal(): number {
            const total = _.reduce(this.products, (sum: number, product: RecepitProduct) => {
                return sum + (product.price * product.amount);
            }, 0.00);

            return parseFloat(total.toFixed(2))
        },
        calculateAvg(): number {
            if (this.products.length === 0) {
                return  parseFloat((0.00).toFixed(2))
            }

            const total = _.reduce(this.products, (sum: number, product: RecepitProduct) => {
                return sum + (product.price * product.amount);
            }, 0.00);

            const avg = total / this.products.length
            return parseFloat(avg.toFixed(2)); 
        },
        setProducts(products: RecepitProduct[]): void {
            this.products = products
            this.avg = this.calculateAvg()
            this.grand_total = this.calculateGrandTotal()
        }
    }
}