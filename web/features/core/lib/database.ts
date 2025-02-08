import { MongoClient, Db } from "mongodb";

const mongoURI = process.env.MONGO_URI || ""

const client = new MongoClient(mongoURI, {
    appName: "fromhome-sandwich",
    retryWrites: true,
    w: "majority",
});

const isConnect = async (): Promise<Boolean> => {
  try {
    const admin = client.db().admin();
    await admin.ping();

    return true;  
  } catch (error) {
    throw error
  }
}

export const connect = async (): Promise<Db> => {
    try {
      if (await isConnect()) {
        return client.db()
      }
      await client.connect();
      const db = client.db();
      return db;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw new Error("Failed to connect to MongoDB");
    }
}