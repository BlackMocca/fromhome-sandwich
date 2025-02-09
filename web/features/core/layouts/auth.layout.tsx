import { useRouter } from "next/router"
import { Fragment, useContext, useEffect } from "react"
import { Observer } from "mobx-react-lite"
import { authContext } from "../context/auth.context"

interface IAuthLayout {
    children: React.ReactNode
}

export default function AuthLayout({children}: IAuthLayout) {
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