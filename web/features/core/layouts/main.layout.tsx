import { Observer } from 'mobx-react-lite'
import Navbar from './navbar.layout'
import SidebarLayout from './sidebar.layout';
import { SidebarMenu } from '@/features/domain/config';

type IMainLayoutProps = {
  children: React.ReactElement
}

export default function MainLayout(props: IMainLayoutProps) {
  return (
    <Observer>
      {() => (
        <div className="flex flex-col w-screen h-dvh relative z-[1] py-[16px] px-[16px] gap-2">
          <Navbar />
          <div className="flex flex-row gap-[19px] py-[8px] overflow-hidden">
            <SidebarLayout menus={SidebarMenu}/>
            {props.children}
          </div>
        </div>
      )}
    </Observer>

  );
}
