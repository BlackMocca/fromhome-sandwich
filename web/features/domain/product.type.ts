export enum Category {
  BeverageBottle = "Beverage (ขวด)",
  BeverageCup = "Beverage (แก้ว)",
  Sandwich = "Sandwich",
  Package = "Package",
  Promotion = "Promotion",
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
