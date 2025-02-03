import { Observer } from 'mobx-react-lite'
import Navbar from './navbar.layout'

type IMainLayoutProps = {
  children: React.ReactElement
}

export default function MainLayout(props: IMainLayoutProps) {
  return (
    <Observer>
      {() => (
        <div className="flex flex-col w-screen h-screen relative z-[1] py-[22px] px-[25px]">
          <Navbar />
          <div className="flex flex-row">
            <div>sidebar</div>
            <div>main</div>
            <div>receipt</div>
          </div>
        </div>
      )}
    </Observer>

  );
}
