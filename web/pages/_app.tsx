import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from 'next/head'
import {  Fragment} from "react";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Fragment>
      <Head>
        <title>FromHome Sandwich</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width, viewport-fit=cover" />
        <link rel="shortcut icon" type="image/x-icon" href="/images/logo.png" />
      </Head>
        <Component {...pageProps} />
    </Fragment>
  )
}


export default MyApp
