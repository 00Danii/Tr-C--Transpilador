import { tokenize as jsTokenize } from "@/lib/javascript/lexer";
import { parse as jsParse } from "@/lib/javascript/parser";
import { generatePython } from "./python/generatePython";

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
    // Otros casos...
    return "// Transpilación no soportada para estos lenguajes.";
  } catch (err: any) {
    return `// Error: ${err.message}`;
  }
}
