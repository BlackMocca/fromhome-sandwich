import SigninPage, { ISigninPageProps } from "@/features/presentation/auth/siginin";

export default function Signin({master_accounts}: ISigninPageProps) {
    return  (
        <SigninPage master_accounts={master_accounts}/>
    )
}

export const getServerSideProps = async () => {
    return {
        props: {
            master_accounts: process.env.USER_PWD || "admin:admin"
        },
    }
}