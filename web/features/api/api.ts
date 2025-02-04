import { Category, Product } from "../domain/product.type";

export const ProductCategoryData: Category[] = Object.values(Category);

export const ProductData: Product[] = [
    {
        id: "1",
        name: "cocoa",
        category: Category.Beverage,
        price: 60,
        image: "/images/products/cocoa.jpg",
        options: [
            {
                id: "1",
                name: "หวานน้อยมาก",
            },
            {
                id: "2",
                name: "หวานน้อย",
            },
            {
                id: "3",
                name: "หวานปกติ",
            }
        ]
    },

    {
        id: "2",
        name: "sandwich",
        category: Category.Sandwich,
        price: 60,
        image: "/images/products/cocoa.jpg",
        options: [
            {
                id: "1",
                name: "หวานน้อยมาก",
            },
            {
                id: "2",
                name: "หวานน้อย",
            },
            {
                id: "3",
                name: "หวานปกติ",
            }
        ]
    },
    {
        id: "3",
        name: "cocoa",
        category: Category.Beverage,
        price: 60,
        image: "/images/products/cocoa.jpg",
        options: [
            {
                id: "1",
                name: "หวานน้อยมาก",
            },
            {
                id: "2",
                name: "หวานน้อย",
            },
            {
                id: "3",
                name: "หวานปกติ",
            }
        ]
    },
    {
        id: "4",
        name: "cocoa",
        category: Category.Beverage,
        price: 60,
        image: "/images/products/cocoa.jpg",
        options: [
            {
                id: "1",
                name: "หวานน้อยมาก",
            },
            {
                id: "2",
                name: "หวานน้อย",
            },
            {
                id: "3",
                name: "หวานปกติ",
            }
        ]
    },
    {
        id: "5",
        name: "cocoa",
        category: Category.Beverage,
        price: 60,
        image: "/images/products/cocoa.jpg",
        options: [
            {
                id: "1",
                name: "หวานน้อยมาก",
            },
            {
                id: "2",
                name: "หวานน้อย",
            },
            {
                id: "3",
                name: "หวานปกติ",
            }
        ]
    }
]