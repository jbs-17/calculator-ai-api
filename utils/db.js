import { MongoClient } from "mongodb";
import { logger } from "./logger.js";

let client = null;

/**
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

    return client;
  } catch (error) {
    logger.error({ error, msg: "mongodb client gagal terkoneksi!" });
    process.exit(1);
  }
}

export async function inCollection(collection_name) {
  return (await getDbClient()).db("calc_ai").collection(collection_name);
}
