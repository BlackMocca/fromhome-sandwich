import Image from "next/image";
import { Fragment, useEffect } from "react";
import ReceiptPage from "@/features/presentation/transaction/receipt.page";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push("/receipt");
  }, [router]);

  return <ReceiptPage />
}
