import { Product } from "@/features/domain/product.type"

export enum PaymentGatewayType {
    Cash = "Cash"
}

export interface Recepit {
    // Head of Recepit
    id: string
    merchant_logo: string
    merchant_name: string
    receipt_no: string
    created_at: string                                  // timestamp format YYYY-MM-DD hh:mm:ss
    
    // Body
    products: Array<Product>

    // Tail
    payment_gateway_type: PaymentGatewayType            // ช่องทางชำระ
    vat_percent: number
    vat: number                                         // vat
    grand_total: number                                 // ราคาทั้งหมด (net)
} 