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
          <div className="flex flex-row items-center cursor-pointer gap-4" onClick={handleRedirect}>
            <div className="relative w-[55px] h-[55px]">
              <Image
                src="/images/logo.png"
                alt="logo"
                fill={true}
                sizes="(max-width: 2400px) 100vw"
                className="object-cover"
              />
            </div>
            <div className="relative w-[155px] h-[26px]">
              <Image
                src="/images/logo_text.png"
                alt="logo_text"
                fill={true}
                priority={true}
                sizes="(max-width: 2400px) 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  