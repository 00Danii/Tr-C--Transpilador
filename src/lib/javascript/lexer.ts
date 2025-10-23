export type Token = { type: string; value: string | number };

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const tokenSpec: [RegExp, string | null][] = [
    [/^\s+/, null], // espacios en blanco
    [/^\/\/.*/, "LINE_COMMENT"],
    [/^\/\*[\s\S]*?\*\//, "BLOCK_COMMENT"],
    [/^console\.log/, "CONSOLE_LOG"],
    [/^\bfunction\b/, "FUNCTION"],
    [/^\bif\b/, "IF"],
    [/^\belse\b/, "ELSE"],
    [/^\bdo\b/, "DO"],
    [/^\bwhile\b/, "WHILE"],
    [/^\bfor\b/, "FOR"],
    [/^\breturn\b/, "RETURN"],
    [/^\b\d+(\.\d+)?\b/, "NUMBER"],
    [/^"[^"]*"/, "STRING"],
    [/^try\b/, "TRY"],
    [/^catch\b/, "CATCH"],
    [/^finally\b/, "FINALLY"],
    [/^\btrue\b/, "TRUE"],
    [/^\bfalse\b/, "FALSE"],
    [/^\bswitch\b/, "SWITCH"],
    [/^\bcase\b/, "CASE"],
    [/^\bdefault\b/, "DEFAULT"],
    [/^\bbreak\b/, "BREAK"],
    [/^\bclass\b/, "CLASS"],
    [/^\bextends\b/, "EXTENDS"],
    [/^\bconstructor\b/, "CONSTRUCTOR"],
    [/^\bstatic\b/, "STATIC"],
    [/^\bpublic\b/, "PUBLIC"],
    [/^\bprivate\b/, "PRIVATE"],
    [/^\bprotected\b/, "PROTECTED"],
    [/^\bthis\b/, "THIS"],
    [/^'[^']'/, "CHAR"],
    [/^[a-zA-Z_]\w*/, "IDENTIFIER"],
    [/^\+\+/, "INCREMENT"],
    [/^--/, "DECREMENT"],
    [/^=>/, "ARROW"],
    [/^[\+\-\*\/%=<>!]+/, "OPERATOR"],
    [/^[\(\)\{\}\[\];,:\.]/, "PUNCTUATION"],
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
          } else if (type === "CHAR") {
            tokens.push({ type, value: result[0].slice(1, -1) }); // sin comillas simples
          } else if (type === "LINE_COMMENT") {
            tokens.push({ type, value: result[0].slice(2).trim() }); // quita //
          } else if (type === "BLOCK_COMMENT") {
            // Quita /* y */ y separa por líneas
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
