import Image from "next/image";
import { useRouter } from "next/router";

export default function Navbar() {
    const router = useRouter()

    const handleRedirect = () => {
      router.push("/")
    };

    return (
      <div className="w-full">
        <div className="flex flex-row items-center">
          <div className="flex flex-row items-center cursor-pointer" onClick={handleRedirect}>
            <div className="relative w-[55px] h-[55px]">
              <Image
                src="/images/logo.png"
                alt="logo"
                layout="fill" 
                objectFit="cover"
              />
            </div>
            <div className="relative w-[155px] h-[26px]">
              <Image
                src="/images/logo_text.png"
                alt="logo_text"
                layout="fill" 
                objectFit="cover"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  