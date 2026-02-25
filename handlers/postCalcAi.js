import { calcAi } from "../calc-ai.js";

// middleware buat cek math_text pakai method post
export const postCalcAiMiddleware = async (req, res, next) => {
  const { math_text } = req.body ?? {};

  if (!math_text)
    return res.status(400).json({
      message: "math_text field diperlukan!",
    });

  next();
};
// controller buat yg method post
export const postCalcAiController = async (req, res) => {
  const { math_text } = req.body;

  const result = await calcAi(math_text);

  if (result.error) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
};
