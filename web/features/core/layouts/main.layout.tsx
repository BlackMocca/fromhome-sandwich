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
        <div className="flex flex-col w-screen h-screen relative z-[1] py-[22px] px-[25px] gap-2">
          <Navbar />
          <div className="flex flex-1 flex-row gap-[19px]">
            <SidebarLayout menus={SidebarMenu}/>
            {props.children}
          </div>
        </div>
      )}
    </Observer>

  );
}
