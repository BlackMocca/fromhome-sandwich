import _ from 'lodash'
import { Observer } from 'mobx-react-lite'
import Navbar from './navbar.layout'
import { ISidebarMenu, SidebarMenu } from '@/features/domain/config';
import ButtonLayout from './button.layout';
import { useRouter } from 'next/router';

type ISidebarLayout = {
    menus: ISidebarMenu[]
}

export default function SidebarLayout({ menus = SidebarMenu}: ISidebarLayout) {
    var router = useRouter()

    var isActive = (menuPath: string) => {return router.pathname === menuPath}

    return (
    <div className="min-w-[227px] h-full border rounded-[27px] bg-primary">
        <div className="flex flex-col h-full px-[18px] py-[16px] justify-between ">
            <div className="flex flex-col gap-[12px]">
                {_.filter(menus, {positon: "top"}).map((item, i) => {
                    return <ButtonLayout key={i} title={item.title} isActive={isActive(item.route)} size='lg' onclick={() => { router.push(item.route) }} />
                }
                )}
            </div>
            <div className="flex flex-col gap-[12px]">
                {_.filter(menus, {positon: "bottom"}).map((item, i) => {
                    return <ButtonLayout key={i} title={item.title} isActive={isActive(item.route)} size='lg' onclick={() => { router.push(item.route) }} />
                }
                )}
            </div>
        </div>
    </div>
    );
}
