import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.MONGO_URI!;
const dbName = process.env.DB_NAME!;

let db: Db;

export const connectDB = async (): Promise<Db> => {
  if (!db) {
    const client = new MongoClient(url);
    await client.connect();
    db = client.db(dbName);
    console.log(`✅ MongoDB Connected: ${db.databaseName}`);
  }
  return db;
};
