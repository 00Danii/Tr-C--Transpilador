export type Token = { type: string; value: string | number };

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const tokenSpec: [RegExp, string | null][] = [
    [/^\s+/, null], // espacios en blanco
    [/^\/\/.*/, "LINE_COMMENT"],
    [/^\/\*[\s\S]*?\*\//, "BLOCK_COMMENT"],
    [/^<\?php\b/, "PHP_OPEN"],
    [/^\?>/, "PHP_CLOSE"],
    [/^\bfunction\b/, "FUNCTION"],
    [/^\breturn\b/, "RETURN"],
    [/^\bif\b/, "IF"],
    [/^\belse\b/, "ELSE"],
    [/^\belseif\b/, "ELSEIF"],
    [/^\bdo\b/, "DO"],
    [/^\bwhile\b/, "WHILE"],
    [/^\bfor\b/, "FOR"],
    [/^\bforeach\b/, "FOREACH"],
    [/^\bbreak\b/, "BREAK"],
    [/^\bcontinue\b/, "CONTINUE"],
    [/^\btrue\b/, "TRUE"],
    [/^\bfalse\b/, "FALSE"],
    [/^\bnull\b/, "NULL"],
    [/^\becho\b/, "PRINT"],
    [/^\btry\b/, "TRY"],
    [/^\bcatch\b/, "CATCH"],
    [/^\bfinally\b/, "FINALLY"],
    [/^\bException\b/, "EXCEPTION"],
    [/^\$\w+/, "VARIABLE"],
    [/^-?\d+(\.\d+)?/, "NUMBER"],
    [/^"([^"\\]|\\.)*"/, "STRING"],
    [/^'([^'\\]|\\.)*'/, "STRING"],
    [/^\bclass\b/, "CLASS"],
    [/^\bextends\b/, "EXTENDS"],
    [/^\bpublic\b/, "PUBLIC"],
    [/^\bprivate\b/, "PRIVATE"],
    [/^\bprotected\b/, "PROTECTED"],
    [/^\bstatic\b/, "STATIC"],
    // [/^\b__construct\b/, "CONSTRUCTOR"],
    [/^\bthis\b/, "THIS"],
    [/^->/, "ARROW"], // Para $this->prop
    [/^\+\+/, "INCREMENT"],
    [/^--/, "DECREMENT"],
    [/^=>/, "OPERATOR"],
    [/^[\+\-\*\/%=<>!&|\.]+/, "OPERATOR"],
    [/^[\(\)\{\}\[\]:;,\]]/, "PUNCTUATION"],
    [/^\barray\b/, "ARRAY"],
    [/^\bswitch\b/, "SWITCH"],
    [/^\bcase\b/, "CASE"],
    [/^\bdefault\b/, "DEFAULT"],
    [/^\bbreak\b/, "BREAK"],
    [/^[a-zA-Z_]\w*/, "IDENTIFIER"],
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
