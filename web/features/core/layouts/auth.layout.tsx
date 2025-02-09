import { useRouter } from "next/router"
import { Fragment, useContext, useEffect } from "react"
import { Observer } from "mobx-react-lite"
import { authContext } from "../context/auth.context"

interface IAuthLayout {
    children: React.ReactNode
}

export default function AuthLayout({children}: IAuthLayout) {
    const router = useRouter()
    const auth = useContext(authContext)

    useEffect(() => {
        // if (!auth.isLoggedIn) {
        //     router.push("/signin")
        // }
    }, [router])


    return (
        <Observer>
            {() => (
                <Fragment>
                    {children}
                </Fragment>
            )}
        </Observer>
    )
}