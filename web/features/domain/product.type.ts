export enum Category {
  Beverage = "Beverage",
  Sandwich = "Sandwich",
  Package = "Package",
}

export interface ProductOption {
  id: string;
  name: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  options?: Array<ProductOption>;
}
