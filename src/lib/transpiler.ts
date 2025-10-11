import { tokenize as jsTokenize } from "@/lib/javascript/lexer";
import { parse as jsParse } from "@/lib/javascript/parser";
import { generatePython } from "./python/generatePython";
import { tokenize as pyTokenize } from "@/lib/python/lexer";
import { parse as pyParse } from "@/lib/python/parser";
import { generateJs } from "./javascript/generateJs";
import { generatePhp } from "./php/generatePhp";
import { tokenize as phpTokenize } from "./php/lexer";
import { parse as phpParse } from "./php/parser";
import { generateJava } from "./java/generateJava";
import { java } from "@codemirror/lang-java";
import { tokenize as javaTokenize } from "./java/lexer";
import { parse as javaParse } from "./java/parser";
// Import PSeInt modules
import { tokenize as pseintTokenize } from "./pseint/lexer";
import { parse as pseintParse } from "./pseint/parser";

export function transpileCode(
  code: string,
  fromLang: string,
  toLang: string
): string {
  try {
    // js -> python
    if (fromLang === "javascript" && toLang === "python") {
      const tokens = jsTokenize(code);
      console.log(tokens);
      const ast = jsParse(tokens);
      console.log(ast);
      return generatePython(ast);
    }

    // python -> js
    if (fromLang === "python" && toLang === "javascript") {
      const tokens = pyTokenize(code);
      console.log(tokens);
      const ast = pyParse(tokens);
      console.log(ast);
      return generateJs(ast);
    }

    // js -> php
    if (fromLang === "javascript" && toLang === "php") {
      const tokens = jsTokenize(code);
      console.log(tokens);
      const ast = jsParse(tokens);
      console.log(ast);
      return generatePhp(ast);
    }

    // python -> php
    if (fromLang === "python" && toLang === "php") {
      const tokens = pyTokenize(code);
      console.log(tokens);
      const ast = pyParse(tokens);
      console.log(ast);
      return generatePhp(ast);
    }

    // php -> js
    if (fromLang === "php" && toLang === "javascript") {
      const tokens = phpTokenize(code);
      console.log(tokens);
      const ast = phpParse(tokens);
      console.log(ast);
      return generateJs(ast);
    }

    // php -> python
    if (fromLang === "php" && toLang === "python") {
      const tokens = phpTokenize(code);
      console.log(tokens);
      const ast = phpParse(tokens);
      console.log(ast);
      return generatePython(ast);
    }

    // java -> js
    if (fromLang === "java" && toLang === "javascript") {
      const tokens = javaTokenize(code);
      console.log(tokens);
      const ast = javaParse(tokens);
      console.log(ast);
      return generateJs(ast);
    }

    // java -> python
    if (fromLang === "java" && toLang === "python") {
      const tokens = javaTokenize(code);
      console.log(tokens);
      const ast = javaParse(tokens);
      console.log(ast);
      return generatePython(ast);
    }

    // java -> php
    if (fromLang === "java" && toLang === "php") {
      const tokens = javaTokenize(code);
      console.log(tokens);
      const ast = javaParse(tokens);
      console.log(ast);
      return generatePhp(ast);
    }

    // pseint -> python
    if (fromLang === "pseint" && toLang === "python") {
      const tokens = pseintTokenize(code);
      console.log(tokens);
      const ast = pseintParse(tokens);
      console.log(ast);
      return generatePython(ast);
    }

    // Otros casos...
    return "// Transpilación no soportada para estos lenguajes.";
  } catch (err: any) {
    return `// Error: ${err.message}`;
  }
}
