import { Recepit } from "../domain/receipt.type";
import { connect } from "../core/lib/database"
import { Db, UpdateResult } from "mongodb"

export const saveRecipt = async (data: Recepit): Promise<UpdateResult> => {
    try {
        const db: Db = await connect()
        const col = db.collection("receipts")
        return await col.updateOne(
            {
                receipt_no: data.receipt_no,
            }, 
            { $set: data },
            {
                upsert: true
            }
        )
    } catch (error) {
        throw error;
    }
}
