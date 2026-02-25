import { calcGroq } from "../calc-groq.js";

/**
 * middleware buat method get
*/ 
export const getCalcAiMiddleware = async (req, res, next) => {
  const { math_text } = req.query;
  if (!math_text)
    return res.status(400).json({
      message: "math_text query diperlukan!",
    });

  next();
};
export const getCalcAiController = async (req, res) => {
  const { math_text } = req.query;

  const result = await calcGroq(math_text);

  if (result.error) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
};
