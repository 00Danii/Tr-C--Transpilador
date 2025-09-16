import { jsToPython } from "./jsToPython";

export function transpileCode(
  code: string,
  fromLang: string,
  toLang: string
): string {
  if (fromLang === "javascript" && toLang === "python") {
    return jsToPython(code);
  }
  // Aquí puedes agregar más conversiones en el futuro
  return "// Transpilación no soportada para estos lenguajes.";
}
