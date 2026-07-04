import { SaleGateway } from "./receipt.type";

export interface ISidebarMenu {
  title: string;
  route: string;
  positon: "top" | "bottom";
  category: string;
}

export const GetRootMenuURL = () => {
  for (const item of SidebarMenu) {
    if (item.category === "receipt") {
      return item.route
    }
  }
  return "/"
}

export const SidebarMenu: ISidebarMenu[] = [
  {
    title: "Condo",
    route: `/receipt/${SaleGateway.CONDO}`,
    positon: "top",
    category: "receipt",
  },
  {
    title: "RobinHood",
    route: `/receipt/${SaleGateway.ROBINHOOD}`,
    positon: "top",
    category: "receipt",
  },
  {
    title: "Lineman",
    route: `/receipt/${SaleGateway.LINEMAN}`,
    positon: "top",
    category: "receipt",
  },
  {
    title: "GrabFood",
    route: `/receipt/${SaleGateway.GRABFOOD}`,
    positon: "top",
    category: "receipt",
  },
  {
    title: "ประวัติออเดอร์",
    route: "/history-receipt",
    positon: "bottom",
    category: "history",
  },
  {
    title: "ออกจากระบบ",
    route: "/",
    positon: "bottom",
    category: "auth",
  },
];
