import Image from "next/image";
import ReceiptPage from "@/features/presentation/transaction/receipt.page";
import { useRouter } from "next/router";
import { SaleGateway } from "../../../features/domain/receipt.type";

export default function Receipt() {
  const router = useRouter();
  const saleGateway: SaleGateway = router.query.sale_gateway as SaleGateway;

  return <ReceiptPage sale_gateway={saleGateway} />;
}
