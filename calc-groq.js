import { Groq } from "groq-sdk";
import {inCollection} from "./utils/db.js";
import { logger } from "./utils/logger.js";
import fsp from "node:fs/promises";
import { validateAIModelOutput } from "./utils/validateAIModelOutput.js";


const system_promt = await fsp.readFile("./etc/system_promt.md", "utf-8");





/**
 * @typedef {{expressions: string, steps : string[], result: number| string}} calc_result 
 */


/**
 * @param {string} math_text
 * @returns {Promise<calc_result>}
*/
export async function calcGroq(math_text) {
  const api_keys = [
    process.env.GROQ_API_KEY_0,
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3
  ].filter(key => key);

  let attempt = 0;

  let result = null;

  while (attempt < api_keys.length) {
    const current_key = api_keys[attempt];

    const groq = new Groq({
      apiKey: current_key
    });

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: system_promt
          },
          {
            role: "user",
            content: math_text,
          },
        ],
        model: "llama-3.3-70b-versatile", // cukup cerdas
        temperature: 0, // biar tidak ngarang
        max_completion_tokens: 512, // dikit saja
        top_p: 1, // ?
        stream: false, // no stream
        response_format: {
          type: "json_object", // output json
        },
        stop: null, // ?
      });

      result = JSON.parse(chatCompletion.choices[0].message.content);
      validateAIModelOutput(result);
      return result;
    } catch (error){
      attempt++;
      logger.error({error, msg : "error groq!"});
    }finally{
      inCollection("calc_ai_logs")
      .then(col => col.insertOne({
        math_text, result, time : new Date(), api_key : api_keys[attempt]
      }))
      .catch(error => logger.error({msg: "error logging hasil ai", error}));
    }
  }

  return {
    error: "Layanan tidak tersedia untuk saat ini! Perlu beberapa waktu untuk pulih."
  }


}




