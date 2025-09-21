// lexer.ts
export type Token = { type: string; value: string | number };

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const tokenSpec: [RegExp, string | null][] = [
    [/^\s+/, null], // espacios en blanco
    [/^\/\/.*/, null], // comentarios de línea
    [/^\/\*[\s\S]*?\*\//, null], // comentarios multilínea
    [/^\bfunction\b/, "FUNCTION"],
    [/^\bif\b/, "IF"],
    [/^\belse\b/, "ELSE"],
    [/^\bwhile\b/, "WHILE"],
    [/^\bfor\b/, "FOR"],
    [/^\breturn\b/, "RETURN"],
    [/^\b\d+\b/, "NUMBER"],
    [/^"[^"]*"/, "STRING"],
    [/^[a-zA-Z_]\w*/, "IDENTIFIER"],
    [/^[\+\-\*\/=<>!]+/, "OPERATOR"],
    [/^[\(\)\{\};,]/, "PUNCTUATION"],
  ];

  let code = input;

  while (code.length > 0) {
    let match = false;
    for (const [regex, type] of tokenSpec) {
      const result = regex.exec(code);
      if (result) {
        match = true;
        if (type) {
          if (type === "NUMBER") {
            tokens.push({ type, value: Number(result[0]) });
          } else if (type === "STRING") {
            tokens.push({ type, value: result[0].slice(1, -1) }); // sin comillas
          } else {
            tokens.push({ type, value: result[0] });
          }
        }
        code = code.slice(result[0].length);
        break;
      }
    }
    if (!match) {
      throw new Error("Token inesperado: " + code[0]);
    }
  }

  return tokens;
}
