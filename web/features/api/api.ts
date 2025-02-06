import { Category, Product } from "../domain/product.type";

export const ProductCategoryData: Category[] = Object.values(Category);

export const MerchantData = {
    name: "From Home Sandwich & Beverage",
    logo: "/images/merchant/logo.jpg"
}

export const ProductData: Product[] = [
    {
        id: "1",
        name: "โกโก้ (Cocoa)",
        category: Category.Beverage,
        price: 60,
        image: "/images/products/cocoa.jpg",
        options: [
            {
                id: "1",
                name: "ไม่หวาน",
            },
            {
                id: "2",
                name: "หวานน้อย",
            },
            {
                id: "3",
                name: "หวานปกติ",
            },
            {
                id: "4",
                name: "หวานมาก",
            }
        ]
    },

    {
        id: "2",
        name: "มัทฉะลาเต้ (Matcha Latte)",
        category: Category.Beverage,
        price: 70,
        image: "/images/products/matcha.jpg",
        options: [
            {
                id: "1",
                name: "ไม่หวาน",
            },
            {
                id: "2",
                name: "หวานน้อย",
            },
            {
                id: "3",
                name: "หวานปกติ",
            },
            {
                id: "4",
                name: "หวานมาก",
            }
        ]
    },
    {
        id: "3",
        name: "แซนด์วิสโบโลน่าไข่ข้น",
        category: Category.Sandwich,
        price: 70,
        image: "/images/products/sw_bolona_egg.jpg",
        options: []
    },
    {
        id: "4",
        name: "แซนด์วิสปูอัดไข่ข้น",
        category: Category.Sandwich,
        price: 70,
        image: "/images/products/sw_crabstick_egg.jpg",
        options: []
    },
    {
        id: "5",
        name: "แซนด์วิสโบโลน่าปูอัด",
        category: Category.Sandwich,
        price: 70,
        image: "/images/products/sw_bolona_crabstick.jpg",
        options: []
    },
    {
        id: "6",
        name: "แซนด์วิสปูอัดทูน่า",
        category: Category.Sandwich,
        price: 70,
        image: "/images/products/sw_crabstick_tuna.jpg",
        options: []
    },
    {
        id: "7",
        name: "แซนด์วิสโบโลน่าทูน่า",
        category: Category.Sandwich,
        price: 70,
        image: "",
        options: []
    },
    {
        id: "8",
        name: "แซนด์วิสทูน่าไข่ข้น",
        category: Category.Sandwich,
        price: 70,
        image: "",
        options: []
    }
]