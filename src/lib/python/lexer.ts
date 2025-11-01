export type Token = { type: string; value: string | number };

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  let indentStack: number[] = [0];

  const tokenSpec: [RegExp, string | null][] = [
    [/^\s+/, null], // espacios en blanco internos
    [/^#.*/, "LINE_COMMENT"],
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
    [/^\bnot\b/, "OPERATOR"],
    [/^\b-?\d+(\.\d+)?\b/, "NUMBER"],
    [/^"[^"]*"/, "STRING"],
    [/^'[^']*'/, "STRING"],
    [/^\blambda\b/, "LAMBDA"],
    [/^\btry\b/, "TRY"],
    [/^\bexcept\b/, "EXCEPT"],
    [/^\bfinally\b/, "FINALLY"],
    [/^\bself\b/, "SELF"],
    [/^\bclass\b/, "CLASS"],
    [/^\bpass\b/, "PASS"],
    [/^[a-zA-Z_]\w*/, "IDENTIFIER"],
    [/^[\+\-\*\/%=<>!\.]+/, "OPERATOR"],
    [/^[:,\(\)\[\]\{\}]/, "PUNCTUATION"],
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Detecta indentación al inicio de la línea
    const indentMatch = /^(\s*)/.exec(line);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const prevIndent = indentStack[indentStack.length - 1];

    if (line.trim().length === 0) {
      // Línea vacía, solo agrega NEWLINE
      tokens.push({ type: "NEWLINE", value: "\n" });
      continue;
    }

    if (indent > prevIndent) {
      tokens.push({ type: "INDENT", value: indent });
      indentStack.push(indent);
    } else if (indent < prevIndent) {
      while (indent < indentStack[indentStack.length - 1]) {
        tokens.push({ type: "DEDENT", value: indentStack.pop()! });
      }
    }

    let code = line.trim();
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
              tokens.push({ type, value: result[0].slice(1).trim() });
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
    tokens.push({ type: "NEWLINE", value: "\n" });
  }

  // Al final, cierra todos los bloques abiertos
  while (indentStack.length > 1) {
    tokens.push({ type: "DEDENT", value: indentStack.pop()! });
  }

  return tokens;
}
