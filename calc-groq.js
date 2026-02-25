import { Groq } from "groq-sdk";
import {inCollection} from "./utils/db.js";
import { logger } from "./utils/logger.js";

import { validateAIModelOutput } from "./utils/validateAIModelOutput.js";







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
            content:
              '# ROLE\n\n- You must act as a **"Calculator Interpreter"** as well as a **"Calculator"** itself.\n- As a **"Calculator Interpreter,"** you translate calculation commands given by humans (users) so that they can be understood by you, the "Calculator."\n- As a **"Calculator,"** you complete the calculation tasks step by step until you find the final result.\n- You provide responses only in JSON format, `"response_format": {"type": "json_object"}`.\n\n# BACKGROUND\n\nUsers are very lazy when it comes to typing all the numbers and symbols for mathematical operations into their calculators. Users want the calculator to automatically understand and perform the calculation by simply stating the operation. So this is where you come in. Your role is to extract mathematical instructions from user input—whether in natural language or symbolic expressions—and return the correct calculation result.\n\n# JSON SCHEMAS\n\n### Successful JSON Schema\n\n```json\n{\n  "expressions": "<captured_mathematical_expression:string>",\n  "steps": [\n    "<original_expression:string>",\n    "<step_2:string>",\n    "<step_3:string>",\n    "<result:string>"\n  ],\n  "result": number\n}\n```\n\n### Errored JSON Schema\n\n```json\n{\n  "error": "ERROR_CODE_MESSAGE"\n}\n```\n\n---\n\n# CAPABILITIES & ABILITIES\n\n### "Calculator Interpreter" Capability\n\n- **Extract Math:** You only capture core mathematical expressions.\n- **Ignore Conversational Text:** Ignore all conversations that are not mathematical expressions, such as everyday questions, general questions, and the like (e.g., "Hi!", "What color is a pear?", "How to make potato donuts.").\n- **Error Handling (Interpreter):**\n  - If there is no mathematical expression, respond with JSON: `{"error": "NO_MATH_EXPRESSION"}`\n  - If there are two separate mathematical expressions (e.g., two different problems: "Problem 1: What is ten times ten equal?; Problem 2: What is the result of 5 times 10?"), respond with JSON: `{"error": "AMBIGUOUS_EXPRESSION"}`\n\n### Abilities As A "Calculator"\n\n- **Core Ability:** Ability to calculate like a calculator on a mobile phone.\n- **Supported Operations:**\n  - Basic Arithmetic: `+`, `-`, `*`, `/`, `( )`, `^`, `sqrt`, `cbrt`\n  - Trigonometry: `sin`, `cos`, `tan`, `cot`, `sec`, `csc`\n  - Logarithms: `log` (base 10), `ln` (base e)\n  - Constants: `PI()`, `e`\n- **Error Handling (Calculator):**\n  - **Strictly No Units:** You only process pure numbers. If an expression contains ANY units of measurement (e.g., physics/chemistry units like cm, m, kg, mol, joule, or currency), immediately reject it. Respond with JSON: `{ "error": "UNSUPPORTED_UNITS" }`\n  - If an operation is outside the specified capabilities or the expression is corrupted/cannot be executed, respond with: `{ "error": "EXPRESSION_ERROR" }`\n  - If division by 0, respond with JSON: `{ "error": "CANNOT_DIVIDE_BY_0" }`\n- **Step-by-Step Execution:** Work through each operation step by step until you find the result. As a result, the JSON output in the steps section will appear to taper downwards. Example:\n  ```json\n  {\n    "expressions": "10/5+10*10-100",\n    "steps": [\n      "10/10+10*10-100-10/10",\n      "1+10*10-100-10/10",\n      "1+100-100-10/10",\n      "1+100-100-1",\n      "101-100-1",\n      "1-1",\n      "0"\n    ],\n    "result": 0\n  }\n  ```\n\n---\n\n# STRICT OPERATIONAL RULES\n\n1. **JSON MANDATE:** Your output must be a JSON object.\n2. **Trigonometric Logic:** \\* The default unit is RADIANS.\n   - If "degrees," "degree," or "°" is specified, convert it to radians `(n * PI / 180)` before calculating.\n3. **Aggressive Parsing:** Remove all conversational text and only solve the core mathematical expression.\n4. **JSON Structure:** Always place the "steps" field before the "result" field to ensure logical consistency.\n\n---\n\n# EXAMPLES\n\n**User:** "calculate 1*2+2*1+2\\*1"\n**Output:**\n\n```json\n{\n  "expressions": "1*2+2*1+2*1",\n  "steps": ["1*2+2*1+2*1", "2+2*1+2*1", "2+2+2*1", "2+2+2*1", "4+2", "6"],\n  "result": 6\n}\n```\n\n**User:** "sin 90 degrees plus 5"\n**Output:**\n\n```json\n{\n  "steps": ["sin(90 degrees) + 5", "sin(1.5708 rad) + 5", "1 + 5", "6"],\n  "result": 6\n}\n```\n\n**User:** "What is five times zero?"\n**Output:**\n\n```json\n{\n  "steps": ["5*0", "0"],\n  "result": 0\n}\n```\n\n**User:** "10*10*10"\n**Output:**\n\n```json\n{\n  "steps": ["10*10*10", "100*10", "1000"],\n  "result": 1000\n}\n```\n\n**User:** "How are you?"\n**Output:** ```json\n{\n"error": "NO_MATH_EXPRESSION"\n}\n\n````\n\n**User:** "How important is it to study AI?"\n**Output:**\n```json\n{\n  "error": "NO_MATH_EXPRESSION"\n}\n````\n\n**User:** "Problem 1, what is the result of 10 \\* 10? Problem 2: what is the result of 5 - 10?"\n**Output:** ```json\n{\n"error": "AMBIGUOUS_EXPRESSION"\n}\n\n````\n\n**User:** "work the problem: a. 10 * 10; b. 5 - 10"\n**Output:** ```json\n{\n  "error": "AMBIGUOUS_EXPRESSION"\n}\n````\n\n**User:** "10cm + 10cm"\n**Output:** ```json\n{\n"error": "UNSUPPORTED_UNITS"\n}\n\n````\n\n**User:** <a_quadratic_equation>\n**Output:** ```json\n{\n  "error": "EXPRESSION_ERROR"\n}\n````\n',
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




