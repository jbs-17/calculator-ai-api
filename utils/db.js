import { MongoClient} from "mongodb";
import { logger } from "./logger.js";


/**
 * @type {InstanceType<typeof MongoClient> | null}
 */
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


/**
 * untuk tutup mongodbclient
 */
async function closeDbClient() {
  try {
    logger.info("mencoba menutup mongodb client...");
    await client.close();
    logger.info("mongodb client berhasil ditutup!");
    process.exit(0); 
  } catch (error) {
    logger.error({ msg: "gagal menutup koneksi mongodb client", error });
    process.exit(1); 
  }
}



// tutup koneksi client dengan aman untuk signal ignal tertentu
process.on("SIGINT", async () => {
  await closeDbClient(); 
});

process.on("SIGTERM", async () => {
  await closeDbClient(); 
});

process.on("uncaughtException", async (err) => {
  logger.fatal({msg:"uncaughtException", err});
  await closeDbClient(); 
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  logger.fatal({msg:"unhandledRejection", reason});
  await closeDbClient();
  process.exit(1);
});
