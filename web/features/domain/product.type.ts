export interface ProductOption {
    id: string,
    name: string,
    price?: number
}

export interface Product {
    id: string,
    name: string,
    category: string[],
    price: number,
    options?: Array<ProductOption>
}