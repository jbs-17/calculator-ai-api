import { app } from "./app.js";
import { logger } from "./utils/logger.js";

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

app.listen(process.env.APP_PORT, (error) => {
  if (error) {
    logger.error({ msg: "server gagal running!" });
    process.exit(1);
  }
  logger.info(`server berjalan pada port ${process.env.APP_PORT}`);
});
