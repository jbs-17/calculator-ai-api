/**
 * valdasi output si model ai apakah sesuai system promt
 * return true jika ok
 * lempar error jika tidak sesuai
 */
export function validateAIModelOutput(json_ai_output){
       const keys = Object.keys(json_ai_output);

       // jika hanya ada pesan error maka sudah sesuai skema
       if(keys.includes("error")) return true;

       // sesuaikah dengan skema success menjawab
       const success_schema_ok = keys.includes("expressions") && keys.includes("result");
       if(success_schema_ok) return true;

       const error = new Error("Model AI gagal memberikan keluaran sesuai perintah!");
       error.json_ai_output = json_ai_output;

       throw error;
}