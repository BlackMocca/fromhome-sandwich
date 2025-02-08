import { MongoClient, Db } from "mongodb";

const mongoURI = process.env.MONGODB_URI || ""

const client = new MongoClient(mongoURI, {
    appName: "fromhome-sandwich",
    retryWrites: true,
    w: "majority",
});

export const connect = async (): Promise<Db> => {
    try {
      await client.connect();
      const db = client.db();
      return db;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw new Error("Failed to connect to MongoDB");
    }
}