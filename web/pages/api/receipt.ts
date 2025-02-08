import { NextApiRequest, NextApiResponse } from "next";
import { Recepit } from "@/features/domain/receipt.type";
import { saveRecipt, getLastReceiptOfDate } from "@/features/api/repository";
import { Format, formatDate, now, ParseYear } from "@/features/core/helper";
import { SaleGateway } from "../../features/domain/receipt.type";

/// format ${deliveryCode}{YYYYDDMM}0001
const formatReceiptNo = (
  delivery: SaleGateway,
  date: string,
  lastestNum?: number
) => {
  let no = 1;
  if (lastestNum) {
    no = lastestNum;
  }
  return `${delivery}${formatDate(
    date,
    ParseYear.THAI,
    Format.RECEPIT_FORMAT
  )}${no.toString().padStart(4, "0")}`;
};

const generateReciptNo = async (delivery: SaleGateway): Promise<string> => {
  let currentDate = now().format(Format.DATE);
  let lastestReceiptNo: string | undefined = await getLastReceiptOfDate(
    currentDate
  );

  if (lastestReceiptNo) {
    let no =
      parseInt(
        lastestReceiptNo.substring(
          lastestReceiptNo.length - 4,
          lastestReceiptNo.length
        )
      ) + 1;
    return formatReceiptNo(delivery, currentDate, no);
  }
  return formatReceiptNo(delivery, currentDate);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const receipt: Recepit = req.body;
    if (!receipt?.sale_gateway) {
      res.status(400).json({ error: "invalid sale_gateway" });
      return;
    }

    const receipt_no = await generateReciptNo(receipt.sale_gateway);
    receipt.receipt_no = receipt_no;

    await saveRecipt(receipt);

    res
      .status(200)
      .json({ message: "success", receipt_no: receipt.receipt_no });
  } catch (error) {
    console.error("Failed to save receipt:", error);
    res.status(500).json({ error: (error as Error).message });
  }
}
