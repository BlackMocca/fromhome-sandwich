export interface ISidebarMenu {
    title: string
    route: string
    positon: "top" | "bottom"
}
export const SidebarMenu: ISidebarMenu[] = [
    { title: "สร้างบิล", route: "/receipt", positon: "top"},
    { title: "เมนู", route: "/product", positon: "top"},
    { title: "ออเดอร์", route: "/order", positon: "top"},
    { title: "การเงิน", route: "/payment", positon: "top"},
    { title: "ประวัติย้อนหลัง", route: "/history", positon: "top"},
    { title: "ตั้งค่า", route: "/setting", positon: "bottom"},
    { title: "ออกจากระบบ", route: "/signout", positon: "bottom"},
]