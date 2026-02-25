import express from "express";
import { logger } from "./utils/logger.js";
import { getCalcAiMiddleware, getCalcAiController } from "./handlers/getCalcAi.js";
import { postCalcAiMiddleware, postCalcAiController } from "./handlers/postCalcAi.js";
import { apiKeyInHeaderMiddleware } from "./handlers/apiKeyInHeaderMiddleware.js";

export const app = express();

app.use(express.json());

app.get("/", async (req, res) => {
  res.status(200).json({
    message: "OK",
  });
});

// akses api pakai post method
app.post(
  "/api/calc_ai",
  apiKeyInHeaderMiddleware,
  postCalcAiMiddleware,
  postCalcAiController,
);

// akses api pakai method get
app.get(
  "/api/calc_ai",
  apiKeyInHeaderMiddleware,
  getCalcAiMiddleware,
  getCalcAiController,
); // perlu api key

// get _hidden buat test
app.get("/api/calc_ai/_hidden", getCalcAiMiddleware, getCalcAiController); // _hidden buat test aja

// test errorr
app.get("/test/error", (req, res) => {
  throw new Error("Error sengaja!");
});

// handler endpoint tidak ada
app.use((req, res, next) => {
  res.status(404).json({
    error: "Endpoint yang diakses nampaknya tidak ada atau tidak tersedia!",
  });
});

// handler error
app.use((err, req, res, next) => {
  logger.error({ err, msg: "terjadi error pada app!" });

  res.status(500).json({
    error: "Terjadi error di internal server!",
  });
});


//
