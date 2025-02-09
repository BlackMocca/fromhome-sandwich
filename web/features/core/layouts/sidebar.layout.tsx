import _ from "lodash";
import { Observer } from "mobx-react-lite";
import Navbar from "./navbar.layout";
import { ISidebarMenu, SidebarMenu } from "@/features/domain/config";
import ButtonLayout from "./button.layout";
import { useRouter } from "next/router";
import { useContext } from "react";
import { authContext } from "../context/auth.context";

type ISidebarLayout = {
  menus: ISidebarMenu[];
};

export default function SidebarLayout({ menus = SidebarMenu }: ISidebarLayout) {
  const router = useRouter();
  const auth = useContext(authContext)

  const isActive = (menuPath: string) => {
    return router.asPath === menuPath;
  };

  const onSignout = () => {
    auth.removeDomainToken()
    router.push("/");
  }

  return (
    <div className="min-w-[227px] border rounded-[27px] bg-primary">
      <div className="flex flex-col h-full px-[18px] py-[16px] justify-between ">
        <div className="flex flex-col gap-[12px]">
          {_.filter(menus, { positon: "top" }).map((item, i) => {
            return (
              <ButtonLayout
                key={i}
                title={item.title}
                isActive={isActive(item.route)}
                size="lg"
                onclick={() => {
                  router.push(item.route);
                }}
                buttonStyleType={"secondary"}
              />
            );
          })}
        </div>
        <div className="flex flex-col gap-[12px]">
          {_.filter(menus, { positon: "bottom" }).map((item, i) => {
            return (
              <ButtonLayout
                key={i}
                title={item.title}
                isActive={isActive(item.route)}
                size="lg"
                onclick={() => {
                  if (item.category === "auth") {
                    onSignout()
                    return
                  }
                  router.push(item.route);
                }}
                buttonStyleType={"secondary"}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
