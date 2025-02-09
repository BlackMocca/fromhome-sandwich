import { MerchantData } from "@/features/api/api";
import { authContext } from "@/features/core/context/auth.context";
import ButtonLayout from "@/features/core/layouts/button.layout";
import { GetRootMenuURL } from "@/features/domain/config";
import Image from "next/image"
import { Router, useRouter } from "next/router";
import { Fragment, useContext, useState } from "react";

export interface ISigninPageProps {
    master_accounts: string
}

export default function SigninPage({ master_accounts }: ISigninPageProps) {
    const router = useRouter()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isAuthFail, setIsAuthFail] = useState(false)

    const auth = useContext(authContext)

    const handleSubmit = async () => {
        let isAuthorize = await auth.authorize(master_accounts, username, password)
        if (isAuthorize) {
            // add cookie here
            console.log("add cookie")
            auth.setDomainToken("some-token")

            setIsAuthFail(false)

            router.push(GetRootMenuURL())
            return
        } 

        setIsAuthFail(true)
    }

    return (
        <div className="flex justify-center items-center fixed top-0 left-0 w-screen h-dvh bg-black bg-opacity-50 backdrop-blur-md">
            <div className="flex flex-col w-1/4 bg-white px-4 py-8 gap-4 justify-center items-center">
                <div className="relative w-[150px] h-[150px]">
                    <Image
                        src={MerchantData.logo}
                        alt="logo"
                        fill={true}
                        priority={true}
                        sizes="(max-width: 2400px) 100vw"
                        className="object-cover overflow-visible"
                    />
                </div>
                <div>
                    <label className="py-2">
                    Username
                        <input
                            type="text"
                            className="w-full border border-primary rounded-lg px-3 py-2"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </label>
                    <label className="py-2">
                    Password
                        <input
                            type="password"
                            className="w-full border border-primary rounded-lg px-3 py-2"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                </div>
                <div className="flex flex-1 flex-col gap-4 justify-center">
                    {isAuthFail ? 
                        (<p className="text-red-500 text-center">Invalid Username or Password</p>)
                        : (<Fragment></Fragment>)
                    }
                    <ButtonLayout
                        title="เข้าสู่ระบบ"
                        size="md"
                        onclick={handleSubmit}
                        isActive={false}
                        buttonStyleType="success"
                        style="min-w-[33%]"
                    />
                </div>
            </div>
        </div>
    )
}