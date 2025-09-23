export type Token = { type: string; value: string | number };

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const tokenSpec: [RegExp, string | null][] = [
    [/^\s+/, null], // espacios en blanco
    [/^#.*/, "LINE_COMMENT"], // comentario de línea
    [/^\bdef\b/, "DEF"],
    [/^\bif\b/, "IF"],
    [/^\belif\b/, "ELIF"],
    [/^\belse\b/, "ELSE"],
    [/^\bwhile\b/, "WHILE"],
    [/^\bfor\b/, "FOR"],
    [/^\bin\b/, "IN"],
    [/^\breturn\b/, "RETURN"],
    [/^\bprint\b/, "PRINT"],
    [/^\bTrue\b/, "TRUE"],
    [/^\bFalse\b/, "FALSE"],
    [/^\bNone\b/, "NONE"],
    [/^\b\d+\b/, "NUMBER"],
    [/^"[^"]*"/, "STRING"],
    [/^'[^']*'/, "STRING"],
    [/^[a-zA-Z_]\w*/, "IDENTIFIER"],
    [/^[\+\-\*\/=<>!]+/, "OPERATOR"],
    [/^[:,\(\)\[\]\{\}]/, "PUNCTUATION"],
    [/^\n/, "NEWLINE"],
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
            tokens.push({ type, value: result[0].slice(1, -1) });
          } else if (type === "LINE_COMMENT") {
            tokens.push({ type, value: result[0].slice(1).trim() }); // quita #
          } else if (type === "NEWLINE") {
            tokens.push({ type, value: "\n" });
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
