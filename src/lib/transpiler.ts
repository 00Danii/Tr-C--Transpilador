import { tokenize as jsTokenize } from "@/lib/javascript/lexer";
import { parse as jsParse } from "@/lib/javascript/parser";
import { generatePython } from "./python/generatePython";
import { tokenize as pyTokenize } from "@/lib/python/lexer";
import { parse as pyParse } from "@/lib/python/parser";
import { generateJs } from "./javascript/generateJs";
import { generatePhp } from "./php/generatePhp";

export function transpileCode(
  code: string,
  fromLang: string,
  toLang: string
): string {
  try {
    if (fromLang === "javascript" && toLang === "python") {
      const tokens = jsTokenize(code);
      console.log(tokens);
      const ast = jsParse(tokens);
      console.log(ast);
      return generatePython(ast);
    }
    if (fromLang === "python" && toLang === "javascript") {
      const tokens = pyTokenize(code);
      console.log(tokens);
      const ast = pyParse(tokens);
      console.log(ast);
      return generateJs(ast);
    }
    if (fromLang === "javascript" && toLang === "php") {
      const tokens = jsTokenize(code);
      console.log(tokens);
      const ast = jsParse(tokens);
      console.log(ast);
      return generatePhp(ast);
    }
    // Otros casos...
    return "// Transpilación no soportada para estos lenguajes.";
  } catch (err: any) {
    return `// Error: ${err.message}`;
  }
}
