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
import { tokenize as javaTokenize } from "./java/lexer";
import { parse as javaParse } from "./java/parser";
import { tokenize as pseintTokenize } from "./pseint/lexer";
import { parse as pseintParse } from "./pseint/parser";
import { generateCpp } from "./cpp/generateCpp";
import { cpp } from "@codemirror/lang-cpp";

// Configuración de los lenguajes soportados
type Token = any;
type AST = any;
type Generator = (ast: AST) => string;

type LanguageConfigEntry = {
  tokenize: (code: string) => Token;
  parse: (tokens: Token) => AST;
  generate: Record<string, Generator>;
};

const languageConfig: Record<string, LanguageConfigEntry> = {
  javascript: {
    tokenize: jsTokenize,
    parse: jsParse,
    generate: {
      python: generatePython,
      php: generatePhp,
      java: generateJava,
      cpp: generateCpp,
    },
  },
  python: {
    tokenize: pyTokenize,
    parse: pyParse,
    generate: {
      javascript: generateJs,
      php: generatePhp,
      java: generateJava,
      cpp: generateCpp,
    },
  },
  php: {
    tokenize: phpTokenize,
    parse: phpParse,
    generate: {
      javascript: generateJs,
      python: generatePython,
      java: generateJava,
      cpp: generateCpp,
    },
  },
  java: {
    tokenize: javaTokenize,
    parse: javaParse,
    generate: {
      javascript: generateJs,
      python: generatePython,
      php: generatePhp,
    },
  },
  pseint: {
    tokenize: pseintTokenize,
    parse: pseintParse,
    generate: {
      python: generatePython,
    },
  },
};

export function transpileCode(
  code: string,
  fromLang: string,
  toLang: string
): string {
  try {
    const fromConfig = languageConfig[fromLang as keyof typeof languageConfig];
    if (!fromConfig) {
      return `// Error: Lenguaje de origen '${fromLang}' no soportado.`;
    }

    const generator =
      fromConfig.generate[toLang as keyof typeof fromConfig.generate];
    if (!generator) {
      return "// Transpilación no soportada para estos lenguajes.";
    }

    const tokens = fromConfig.tokenize(code);
    console.log(tokens);

    const ast = fromConfig.parse(tokens);
    console.log(ast);

    return generator(ast);
  } catch (err: any) {
    return `// Error: ${err.message}`;
  }
}
