import { inCollection } from "../utils/db.js";

/**
 * middleware buat cek api key 
 */
export const apiKeyInHeaderMiddleware = async (req, res, next) => {
  const api_key = req.headers["x-api-key"] ?? "";

  if (!api_key)
    return res.status(401).json({
      error: "Unauthorized! Api key diperlukan!",
    });

    

  const exist = await (await inCollection("api_keys")).findOne({ api_key });

  if (!exist)
    return res.status(401).json({
      error: "Unauthorized! Api key tidak valdi!",
    });

  next();
};
