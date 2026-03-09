import { MongoClient } from 'mongodb';

let client;
let clientPromise;

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'quickloot';

if (!uri) {
  throw new Error('MONGO_URL environment variable is not set');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  const c = await clientPromise;
  return c.db(dbName);
}

export default clientPromise;
