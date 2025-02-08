import { Recepit } from "../domain/receipt.type";
import { connect } from "../core/lib/database"
import { Db, InsertOneResult } from "mongodb"
import dayjs from "dayjs";
import { Format, formatDate, ParseYear } from "@/features/core/helper"
import _ from "lodash";

const COL_RECEIPTS = "receipts"

export const saveRecipt = async (data: Recepit): Promise<InsertOneResult> => {
    try {
        const db: Db = await connect()
        const col = db.collection(COL_RECEIPTS)
        return await col.insertOne(data)
    } catch(error) {
        throw error 
    }
}

export const getLastReceiptOfDate = async (date: string): Promise<string> => {
    try {
        const db: Db = await connect()
        const col = db.collection(COL_RECEIPTS)
        const receipts = await col.find<Recepit>({
            date: {
                "$gte": formatDate(date, ParseYear.CHRIST, Format.DATE ),
                "$lt": formatDate(dayjs(date).add(1, 'day').format(Format.TIMESTAMP) , ParseYear.CHRIST, Format.DATE ),
            }
        }, {
            limit: 1,
            sort: {
                created_at: -1
            }
        }).toArray()
        
        if (_.size(receipts) > 0) {
            return receipts[0].receipt_no
        }
    } catch(error) {
        throw error
    }

    return ""
}
