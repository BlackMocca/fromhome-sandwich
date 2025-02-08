import { NextApiRequest, NextApiResponse } from "next";
import { Recepit } from "@/features/domain/receipt.type";
import { saveRecipt } from "@/features/api/repository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const receipt: Recepit = req.body;
    await saveRecipt(receipt)
    
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.error("Failed to save receipt:", error)
    res.status(500).json({ error: (error as Error).message });
  }
}
