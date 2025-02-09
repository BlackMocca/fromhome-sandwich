import { SaleGateway } from "./receipt.type";
import _ from "lodash"

export interface ISidebarMenu {
  title: string;
  route: string;
  positon: "top" | "bottom";
  category: string;
}

export const GetRootMenuURL = () => {
  let menu: ISidebarMenu | undefined = _.find(
    SidebarMenu,
    (item: ISidebarMenu) => item.category === "receipt"
  );
  return menu?.route ? menu.route : "/"
}

export const SidebarMenu: ISidebarMenu[] = [
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
