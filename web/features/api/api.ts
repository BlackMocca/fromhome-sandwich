import { Category, Product } from "../domain/product.type";
import { SaleGateway } from "../domain/receipt.type";
import { ProductCondoData } from "./product.condo";
import { ProductRobinHoodData } from "./product.robinhood"

export const ProductCategoryData: Category[] = Object.values(Category);

export const MerchantData = {
  name: "From Home Sandwich & Beverage",
  logo: "/images/merchant/logo.jpg",
  socials: {
    slogan: "Joy in every bite, Joy in every moment",
    search: "fromhome.th",
    icons: ["facebook", "instagram"],
  },
};

export const GetProductBySaleGateway = (
  saleGateway: SaleGateway
): Product[] => {
  switch (saleGateway) {
    case SaleGateway.ROBINHOOD:
      return ProductRobinHoodData;
    case SaleGateway.LINEMAN:
      return [];
    case SaleGateway.GRABFOOD:
      return [];
    case SaleGateway.CONDO:
      return ProductCondoData;
    default:
      return ProductCondoData;
  }
};
