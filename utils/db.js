import { MongoClient } from "mongodb";
import { logger } from "./logger.js";

let client = null;
let connect_attempt = 0;

/**
 * get mongo db client 
 * @return {InstanceType<typeof MongoClient>}
 */
export async function getDbClient() {
  if (client) return client;

  client = new MongoClient(process.env.MONGODB_URI);

  try {
    logger.info("mongo client coba koneksi...");
    await client.connect();
    logger.info("mongo client berhasil terkoneksi!");

    logger.info("mencoba ping database...");
    await client.db("calc_ai").command({ ping: 1 });
    logger.info("pong dari database!");

    connect_attempt = 0;
    return client;
  } catch (error) {
    logger.error({ error, msg: "mongodb client gagal terkoneksi!" });
    connect_attempt++;

    if(connect_attempt > 3){
      process.exit(1);
    }

    await getDbClient();

  }
}

/**
 * db calc_ai , untuk pakai collection 
 */
export async function inCollection(collection_name) {
  return (await getDbClient()).db("calc_ai").collection(collection_name);
}
