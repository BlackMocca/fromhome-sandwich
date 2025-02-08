import { NextApiRequest, NextApiResponse } from "next";
import { Recepit } from "@/features/domain/receipt.type";
import { saveRecipt, getLastReceiptOfDate } from "@/features/api/repository";
import { Format, now } from "@/features/core/helper";

const generateReciptNo = async (): Promise<string> => {
    let lastestReceiptNo = await getLastReceiptOfDate(now().format(Format.DATE))
    lastestReceiptNo = "2"
    return lastestReceiptNo
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const receipt: Recepit = req.body;

    const receipt_no = await generateReciptNo()
    receipt.receipt_no = receipt_no

    await saveRecipt(receipt)
    
    res.status(200).json({ message: "success", "receipt_no": receipt.receipt_no });
  } catch (error) {
    console.error("Failed to save receipt:", error)
    res.status(500).json({ error: (error as Error).message });
  }
}
