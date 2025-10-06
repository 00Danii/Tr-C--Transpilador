export type Token = { type: string; value: string | number };

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const tokenSpec: [RegExp, string | null][] = [
    [/^\s+/, null], // espacios en blanco
    [/^\/\/.*/, "LINE_COMMENT"],
    [/^\/\*[\s\S]*?\*\//, "BLOCK_COMMENT"],
    [/^\bclass\b/, "CLASS"],
    [/^\bpublic\b/, "PUBLIC"],
    [/^\bstatic\b/, "STATIC"],
    [/^\bvoid\b/, "VOID"],
    [/^\bmain\b/, "MAIN"],
    [/^\bString\b/, "STRING_TYPE"],
    [/^\bint\b/, "INT_TYPE"],
    [/^\bdouble\b/, "DOUBLE_TYPE"],
    [/^\bboolean\b/, "BOOLEAN_TYPE"],
    [/^\bif\b/, "IF"],
    [/^\belse\b/, "ELSE"],
    [/^\bdo\b/, "DO"],
    [/^\bwhile\b/, "WHILE"],
    [/^\bfor\b/, "FOR"],
    [/^\breturn\b/, "RETURN"],
    [/^\btrue\b/, "TRUE"],
    [/^\bfalse\b/, "FALSE"],
    [/^\bSystem\.out\.println\b/, "PRINT"],
    [/^\bSystem\.out\.print\b/, "PRINT"],
    [/^\bnew\b/, "NEW"],
    [/^\bthis\b/, "THIS"],
    [/^\bnull\b/, "NULL"],
    [/^\btry\b/, "TRY"],
    [/^\bcatch\b/, "CATCH"],
    [/^\bfinally\b/, "FINALLY"],
    [/^\d+\.\d+/, "NUMBER"], // Números decimales
    [/^\d+/, "NUMBER"], // Números enteros
    [/^"[^"]*"/, "STRING"],
    [/^[a-zA-Z_]\w*/, "IDENTIFIER"],
    [/^\+\+/, "INCREMENT"],
    [/^--/, "DECREMENT"],
    [/^=>/, "ARROW"],
    [/^[\+\-\*\/%=<>!&|]+/, "OPERATOR"],
    [/^[\(\)\{\}\[\];,\.]/, "PUNCTUATION"],
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
          } else if (type === "LINE_COMMENT") {
            tokens.push({ type, value: result[0].slice(2).trim() });
          } else if (type === "BLOCK_COMMENT") {
            const lines = result[0]
              .slice(2, -2)
              .split("\n")
              .map((l) => l.trim());
            lines.forEach((line) =>
              tokens.push({ type: "BLOCK_COMMENT", value: line })
            );
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
