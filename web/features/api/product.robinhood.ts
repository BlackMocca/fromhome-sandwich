import { Category, Product } from "../domain/product.type";

export const ProductRobinHoodData: Product[] = [
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
      },
    ],
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
      },
    ],
  },
  {
    id: "3",
    name: "ชาไทย (Thai Tea)",
    category: Category.Beverage,
    price: 60,
    image: "",
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
      },
    ],
  },
  {
    id: "4",
    name: "ชามะลิ (Jasmine Tea)",
    category: Category.Beverage,
    price: 45,
    image: "",
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
      },
    ],
  },
  {
    id: "5",
    name: "แซนด์วิชโบโลน่าไข่ข้น",
    category: Category.Sandwich,
    price: 70,
    image: "/images/products/sw_bolona_egg.jpg",
    options: [
      {
        id: "20",
        name: "ขนมปังโฮลวีท",
        price: 10
      },
    ],
  },
  {
    id: "6",
    name: "แซนด์วิชปูอัดไข่ข้น",
    category: Category.Sandwich,
    price: 70,
    image: "/images/products/sw_crabstick_egg.jpg",
    options: [
      {
        id: "20",
        name: "ขนมปังโฮลวีท",
        price: 10
      },
    ],
  },
  {
    id: "7",
    name: "แซนด์วิชโบโลน่าปูอัด",
    category: Category.Sandwich,
    price: 70,
    image: "/images/products/sw_bolona_crabstick.jpg",
    options: [
      {
        id: "20",
        name: "ขนมปังโฮลวีท",
        price: 10
      },
    ],
  },
  {
    id: "8",
    name: "แซนด์วิชปูอัดทูน่า",
    category: Category.Sandwich,
    price: 70,
    image: "/images/products/sw_crabstick_tuna.jpg",
    options: [
      {
        id: "20",
        name: "ขนมปังโฮลวีท",
        price: 10
      },
    ],
  },
  {
    id: "9",
    name: "แซนด์วิชโบโลน่าทูน่า",
    category: Category.Sandwich,
    price: 70,
    image: "",
    options: [
      {
        id: "20",
        name: "ขนมปังโฮลวีท",
        price: 10
      },
    ],
  },
  {
    id: "10",
    name: "แซนด์วิชทูน่าไข่ข้น",
    category: Category.Sandwich,
    price: 70,
    image: "",
    options: [
      {
        id: "20",
        name: "ขนมปังโฮลวีท",
        price: 10
      },
    ],
  },
  {
    id: "11",
    name: "แพ็คเกจ กะติ๊ด",
    category: Category.Package,
    price: 350,
    image: "",
    options: [
      {
        id: "5",
        name: "โกโก้ 2 ขวด",
      },
      {
        id: "6",
        name: "มัทฉะลาเต้ 2 ขวด",
      },
      {
        id: "7",
        name: "ชาไทย 2 ขวด",
      },
    ],
  },
  {
    id: "12",
    name: "แพ็คเกจ ปุ๊กปิ๊ก",
    category: Category.Package,
    price: 525,
    image: "",
    options: [
      {
        id: "8",
        name: "โกโก้ 3 ขวด",
      },
      {
        id: "9",
        name: "มัทฉะลาเต้ 3 ขวด",
      },
      {
        id: "10",
        name: "ชาไทย 3 ขวด",
      },
    ],
  },
  {
    id: "13",
    name: "แพ็คเกจ เบิ้ม",
    category: Category.Package,
    price: 690,
    image: "",
    options: [
      {
        id: "11",
        name: "โกโก้ 4 ขวด",
      },
      {
        id: "12",
        name: "มัทฉะลาเต้ 4 ขวด",
      },
      {
        id: "13",
        name: "ชาไทย 4 ขวด",
      },
    ],
  },
  {
    id: "14",
    name: "แพ็คเกจ โฮม (6 กล่อง)",
    category: Category.Package,
    price: 350,
    image: "",
    options: [],
  },
  {
    id: "15",
    name: "แพ็คเกจ หมู่บ้าน (12 กล่อง)",
    category: Category.Package,
    price: 525,
    image: "",
    options: [],
  },
  {
    id: "16",
    name: "แพ็คเกจ อบต. (18 กล่อง)",
    category: Category.Package,
    price: 690,
    image: "",
    options: [],
  },
  {
    id: "17",
    name: "คู่หูคู่ซี้ แซนด์วิช + เครื่องดื่ม",
    category: Category.Promotion,
    price: 125,
    image: "/images/products/promotion_duo.jpg",
    options: [
      {
        "id": "15",
        "name": "โกโก้ 1 ขวด"
      },
      {
        "id": "16",
        "name": "มัทฉะลาเต้ 1 ขวด"
      },
      {
        "id": "17",
        "name": "แซนด์วิช ปูอัด-โบโลน่า"
      }, 
      {
        "id": "18",
        "name": "แซนด์วิช ทูน่า-ปูอัด"
      },
      {
        "id": "19",
        "name": "แซนด์วิช ทูน่า-โบโลน่า"
      },
    ],
  },
  {
    id: "18",
    name: "เซตแบ่งปัน โกโก้ 2 มัทฉะ 1",
    category: Category.Promotion,
    price: 180,
    image: "/images/products/promotion_duo.jpg",
    options: [
      {
        "id": "5",
        "name": "โกโก้ 2 ขวด"
      },
      {
        "id": "16",
        "name": "มัทฉะลาเต้ 1 ขวด"
      }
    ],
  },
];
