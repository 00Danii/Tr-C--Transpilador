import { jsToPython } from "./jsToPython";
import { pythonToJs } from "./pythonToJs";

export function transpileCode(
  code: string,
  fromLang: string,
  toLang: string
): string {
  if (fromLang === "javascript" && toLang === "python") {
    return jsToPython(code);
  }
  if (fromLang === "python" && toLang === "javascript") {
    return pythonToJs(code);
  }
  // Aquí agregar más conversiones
  return "// Transpilación no soportada para estos lenguajes.";
}
