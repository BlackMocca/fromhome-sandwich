import Image from "next/image";
import ReceiptPage from "@/features/presentation/transaction/receipt.page";
import { useRouter } from "next/router";
import { SaleGateway } from "../../../features/domain/receipt.type";
import { useEffect } from "react";

export default function Receipt() {
  const router = useRouter();
  let saleGateway: SaleGateway | undefined = router.query
    .sale_gateway as SaleGateway;

  useEffect(() => {
    saleGateway = router.query.sale_gateway as SaleGateway;
  }, [router.query.sale_gateway]);

  if (!saleGateway) {
    return <div></div>;
  }

  return <ReceiptPage sale_gateway={saleGateway} />;
}
