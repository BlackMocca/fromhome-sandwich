import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from 'next/head'
import {  Fragment} from "react";
import AuthLayout from "@/features/core/layouts/auth.layout";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Fragment>
      <Head>
        <title>FromHome Sandwich</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width, viewport-fit=cover" />
        <link rel="shortcut icon" type="image/x-icon" href="/images/logo.png" />
      </Head>
        <AuthLayout>
          <Component {...pageProps} />
        </AuthLayout>
    </Fragment>
  )
}


export default MyApp
