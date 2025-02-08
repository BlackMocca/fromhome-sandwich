import Image from "next/image";
import _ from "lodash";
import { Fragment, useEffect } from "react";
import ReceiptPage from "@/features/presentation/transaction/receipt.page";
import { useRouter } from "next/router";
import { SidebarMenu, ISidebarMenu } from "../features/domain/config";
import HomePage from "../features/presentation/home/home.page";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let menu: ISidebarMenu | undefined = _.find(
      SidebarMenu,
      (item: ISidebarMenu) => item.category === "receipt"
    );
    router.push(menu ? menu.route : "/");
  }, [router]);

  return <HomePage />;
}
