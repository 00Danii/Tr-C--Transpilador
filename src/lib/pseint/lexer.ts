export type Token = {
  type: string;
  value: string;
  line: number;
  column: number;
};

const KEYWORDS = [
  // E/S
  "Escribir",
  "Leer",
  // Control
  "Si",
  "Entonces",
  "Sino",
  "FinSi",
  "Mientras",
  "Hacer",
  "FinMientras",
  "Para",
  "Hasta",
  "Con Paso",
  "FinPara",
  "Segun",
  "Caso",
  "De Otro Modo",
  "FinSegun",
  "Repetir",
  "Hasta Que",
  // Funciones
  "Funcion",
  "FinFuncion",
  "Procedimiento",
  "FinProcedimiento",
  "Retornar",
  // Otros
  "Dimension",
  "Definir",
  "Como",
  "Inicio",
  "Fin",
  "Algoritmo",
  "FinAlgoritmo",
];

const OPERATORS = [
  "<-",
  "=",
  "+",
  "-",
  "*",
  "/",
  "%",
  "^",
  ">",
  "<",
  ">=",
  "<=",
  "<>",
  "==",
  "&&",
  "||",
  "!",
  "NO",
];

const DELIMITERS = ["(", ")", "[", "]", "{", "}", ",", ";", ":"];

const BOOLEAN_LITERALS = ["VERDADERO", "FALSO"];

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let line = 1;
  let col = 1;
  let i = 0;

  function advance(n = 1) {
    for (let j = 0; j < n; j++) {
      if (input[i] === "\n") {
        line++;
        col = 1;
      } else {
        col++;
      }
      i++;
    }
  }

  function match(regex: RegExp): RegExpExecArray | null {
    regex.lastIndex = i;
    return regex.exec(input);
  }

  while (i < input.length) {
    // Espacios y saltos de línea
    if (/\s/.test(input[i])) {
      advance();
      continue;
    }

    // Comentario de línea //
    if (input.startsWith("//", i)) {
      let startCol = col;
      let start = i;
      while (i < input.length && input[i] !== "\n") advance();
      tokens.push({
        type: "LINE_COMMENT",
        value: input.slice(start, i),
        line,
        column: startCol,
      });
      continue;
    }

    // Comentario de bloque /* ... */
    if (input.startsWith("/*", i)) {
      let startCol = col;
      let start = i;
      i += 2;
      col += 2;
      while (i < input.length && !input.startsWith("*/", i)) advance();
      i += 2;
      col += 2;
      tokens.push({
        type: "BLOCK_COMMENT",
        value: input.slice(start, i),
        line,
        column: startCol,
      });
      continue;
    }

    // Cadenas de texto "..."
    if (input[i] === '"') {
      let startCol = col;
      let start = i;
      advance(); // "
      let value = "";
      while (i < input.length && input[i] !== '"') {
        value += input[i];
        advance();
      }
      advance(); // "
      tokens.push({
        type: "STRING",
        value,
        line,
        column: startCol,
      });
      continue;
    }

    if (input.startsWith("De Otro Modo", i)) {
      tokens.push({
        type: "DE_OTRO_MODO",
        value: "De Otro Modo",
        line,
        column: col,
      });
      advance("De Otro Modo".length);
      continue;
    }

    // Reconoce "Hasta Que" como un solo token
    if (input.startsWith("Hasta Que", i)) {
      tokens.push({
        type: "HASTA_QUE",
        value: "Hasta Que",
        line,
        column: col,
      });
      advance("Hasta Que".length);
      continue;
    }

    // Números (enteros y reales)
    const numMatch = match(/\d+(\.\d+)?/y);
    if (numMatch) {
      tokens.push({
        type: numMatch[1] ? "REAL" : "INTEGER",
        value: numMatch[0],
        line,
        column: col,
      });
      advance(numMatch[0].length);
      continue;
    }

    // Palabras clave y booleanos
    const idMatch = match(/[A-Za-zÁÉÍÓÚáéíóúÑñ_][A-Za-z0-9ÁÉÍÓÚáéíóúÑñ_]*/y);
    if (idMatch) {
      const value = idMatch[0];
      let type = "IDENTIFIER";
      if (KEYWORDS.includes(value))
        type = value.toUpperCase().replace(/ /g, "_");
      if (BOOLEAN_LITERALS.includes(value.toUpperCase())) type = "BOOLEAN";
      tokens.push({
        type,
        value,
        line,
        column: col,
      });
      advance(value.length);
      continue;
    }

    // Operadores (prioriza los largos)
    let opMatched = false;
    for (const op of OPERATORS.sort((a, b) => b.length - a.length)) {
      if (input.startsWith(op, i)) {
        tokens.push({
          type: "OPERATOR",
          value: op,
          line,
          column: col,
        });
        advance(op.length);
        opMatched = true;
        break;
      }
    }
    if (opMatched) continue;

    // Delimitadores
    if (DELIMITERS.includes(input[i])) {
      tokens.push({
        type: "DELIMITER",
        value: input[i],
        line,
        column: col,
      });
      advance();
      continue;
    }

    // Si no reconoce el token, lo marca como desconocido
    tokens.push({
      type: "UNKNOWN",
      value: input[i],
      line,
      column: col,
    });
    advance();
  }

  return tokens;
}
