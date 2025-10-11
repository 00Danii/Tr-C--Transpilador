import { Token } from "./lexer";
import {
  Program,
  Statement,
  Expression,
  ExpressionStatement,
  VariableDeclaration,
  IfStatement,
  WhileStatement,
  ForStatement,
  DoWhileStatement,
  TryStatement,
  BlockStatement,
  FunctionDeclaration,
  ReturnStatement,
  CommentStatement,
  ArrayExpression,
  CallExpression,
  Identifier,
  Literal,
} from "../ast";

export function parse(tokens: Token[]): Program {
  let current = 0;

  function peek(n = 0): Token | undefined {
    return tokens[current + n];
  }

  function consume(type?: string): Token {
    const token = tokens[current];
    if (!token) return { type: "EOF", value: "", line: 0, column: 0 };
    if (type && token.type !== type) {
      // En vez de throw, retorna un comentario especial
      current++;
      return {
        type: "ERROR",
        value: `[NO SOPORTADO: se esperaba ${type}, pero se obtuvo ${token.type}]`,
        line: token.line,
        column: token.column,
      };
    }
    current++;
    return token;
  }

  function parseProgram(): Program {
    const body: Statement[] = [];
    while (peek()) {
      const stmt = parseStatement();
      if (stmt) body.push(stmt);
    }
    return { type: "Program", body };
  }

  function parseStatement(): Statement {
    const token = peek();

    if (
      token?.type === "IDENTIFIER" &&
      token?.value.toUpperCase() === "ALGORITMO"
    ) {
      consume(); // Algoritmo
      if (peek() && peek()?.type === "IDENTIFIER") consume(); // nombre
      return undefined;
    }
    if (
      token?.type === "IDENTIFIER" &&
      token?.value.toUpperCase() === "FINALGORITMO"
    ) {
      consume();
      return undefined;
    }

    // Comentarios
    if (token?.type === "LINE_COMMENT" || token?.type === "BLOCK_COMMENT") {
      consume();
      return { type: "CommentStatement", value: String(token.value) };
    }

    // Escribir (print)
    if (token?.type === "ESCRIBIR") {
      consume();
      const args: Expression[] = [];
      while (
        peek() &&
        (peek()?.type === "STRING" ||
          peek()?.type === "INTEGER" ||
          peek()?.type === "REAL" ||
          peek()?.type === "BOOLEAN" ||
          (peek()?.type === "IDENTIFIER" &&
            !(peek(1)?.type === "OPERATOR" && peek(1)?.value === "<-")))
      ) {
        args.push(parseExpression());
        if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ",") {
          consume("DELIMITER");
        }
      }
      if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ";") {
        consume("DELIMITER");
      }
      return {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "print" },
          arguments: args,
        },
      };
    }

    // Leer (input)
    if (token?.type === "LEER") {
      consume();
      const args: Expression[] = [];
      while (
        peek() &&
        peek()?.type === "IDENTIFIER" &&
        !(
          peek(1)?.type === "OPERATOR" &&
          (peek(1)?.value === "<-" || peek(1)?.value === "=")
        )
      ) {
        args.push({
          type: "Identifier",
          name: String(consume("IDENTIFIER").value),
        });
        if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ",") {
          consume("DELIMITER");
        }
      }
      if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ";") {
        consume("DELIMITER");
      }
      return {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "input" },
          arguments: args,
        },
      };
    }

    // Asignación: x <- expr  o x = expr
    if (
      token?.type === "IDENTIFIER" &&
      peek(1)?.type === "OPERATOR" &&
      (peek(1)?.value === "<-" || peek(1)?.value === "=")
    ) {
      const name = String(consume("IDENTIFIER").value);
      consume("OPERATOR"); // <- o =
      const value = parseExpression();
      if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ";") {
        consume("DELIMITER");
      }
      return {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "=",
          left: { type: "Identifier", name },
          right: value,
        },
      };
    }

    // Definir x como tipo
    if (token?.type === "DEFINIR") {
      consume("DEFINIR");
      const name = String(consume("IDENTIFIER").value);
      consume("COMO");
      const tipo = consume("IDENTIFIER").value;
      if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ";") {
        consume("DELIMITER");
      }
      // Solo para el AST, no se usa en Python
      return {
        type: "VariableDeclaration",
        kind: tipo,
        name,
        value: { type: "Literal", value: null },
      };
    }

    // Dimension arr[10]
    if (token?.type === "DIMENSION") {
      consume("DIMENSION");
      const name = String(consume("IDENTIFIER").value);
      if (peek() && peek()?.type === "DELIMITER" && peek()?.value === "[") {
        consume("DELIMITER"); // [
        const elements: Expression[] = [];
        while (
          peek() &&
          peek()?.type !== "DELIMITER" &&
          peek()?.value !== "]"
        ) {
          elements.push(parseExpression());
          if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ",") {
            consume("DELIMITER");
          }
        }
        consume("DELIMITER"); // ]
        if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ";") {
          consume("DELIMITER");
        }
        return {
          type: "VariableDeclaration",
          kind: "array",
          name,
          value: { type: "ArrayExpression", elements },
        };
      }
    }

    // Si ... Entonces ... Sino ... FinSi
    if (token?.type === "SI") {
      consume("SI");
      const test = parseExpression();
      consume("ENTONCES");
      const consequent: Statement[] = [];
      while (peek() && peek()?.type !== "SINO" && peek()?.type !== "FINSI") {
        consequent.push(parseStatement());
      }
      let alternate: Statement[] | undefined;
      if (peek() && peek()?.type === "SINO") {
        consume("SINO");
        alternate = [];
        while (peek() && peek()?.type !== "FINSI") {
          alternate.push(parseStatement());
        }
      }
      consume("FINSI");
      return {
        type: "IfStatement",
        test,
        consequent,
        alternate: alternate
          ? {
              type: "IfStatement",
              test: { type: "Literal", value: true },
              consequent: alternate,
            }
          : undefined,
      };
    }

    // Mientras ... Hacer ... FinMientras
    if (token?.type === "MIENTRAS") {
      consume("MIENTRAS");
      const test = parseExpression();
      consume("HACER");
      const body: Statement[] = [];
      while (peek() && peek()?.type !== "FINMIENTRAS") {
        body.push(parseStatement());
      }
      consume("FINMIENTRAS");
      return { type: "WhileStatement", test, body };
    }

    // Para i <- inicio Hasta fin [Con Paso paso] ... FinPara
    if (token?.type === "PARA") {
      consume("PARA");
      const varName = String(consume("IDENTIFIER").value);
      consume("OPERATOR"); // <- o =
      const start = parseExpression();
      consume("HASTA");
      const end = parseExpression();
      let step: Expression | null = null;
      if (
        peek() &&
        (peek()?.type === "CON_PASO" ||
          (peek()?.type === "IDENTIFIER" &&
            peek()?.value.toUpperCase() === "CON"))
      ) {
        consume(); // CON_PASO o CON
        if (
          peek() &&
          peek()?.type === "IDENTIFIER" &&
          peek()?.value.toUpperCase() === "PASO"
        )
          consume();
        step = parseExpression();
      }
      // Aquí consume opcionalmente HACER
      if (peek() && peek()?.type === "HACER") {
        consume("HACER");
      }
      const body: Statement[] = [];
      while (peek() && peek()?.type !== "FINPARA") {
        body.push(parseStatement());
      }
      consume("FINPARA");
      return {
        type: "ForStatement",
        varName,
        rangeExpr: step
          ? {
              type: "CallExpression",
              callee: { type: "Identifier", name: "range" },
              arguments: [start, end, step],
            }
          : {
              type: "CallExpression",
              callee: { type: "Identifier", name: "range" },
              arguments: [start, end],
            },
        body,
      };
    }

    // Repetir ... Hasta Que expr
    if (token?.type === "REPETIR") {
      consume("REPETIR");
      const body: Statement[] = [];
      while (peek() && peek()?.type !== "HASTA_QUE") {
        body.push(parseStatement());
      }
      consume("HASTA_QUE");
      const test = parseExpression();
      return { type: "DoWhileStatement", body, test, until: true };
    }

    // Funcion ... FinFuncion
    if (token?.type === "FUNCION") {
      consume("FUNCION");
      const name = String(consume("IDENTIFIER").value);
      const params: string[] = [];
      if (peek() && peek()?.type === "DELIMITER" && peek()?.value === "(") {
        consume("DELIMITER"); // (
        while (
          peek() &&
          peek()?.type !== "DELIMITER" &&
          peek()?.value !== ")"
        ) {
          if (peek()?.type === "IDENTIFIER") {
            params.push(String(consume("IDENTIFIER").value));
            if (
              peek() &&
              peek()?.type === "DELIMITER" &&
              peek()?.value === ","
            ) {
              consume("DELIMITER");
            }
          } else {
            consume();
          }
        }
        consume("DELIMITER"); // )
      }
      const body: Statement[] = [];
      while (peek() && peek()?.type !== "FINFUNCION") {
        body.push(parseStatement());
      }
      consume("FINFUNCION");
      return { type: "FunctionDeclaration", name, params, body };
    }

    // Procedimiento ... FinProcedimiento
    if (token?.type === "PROCEDIMIENTO") {
      consume("PROCEDIMIENTO");
      const name = String(consume("IDENTIFIER").value);
      const params: string[] = [];
      if (peek() && peek()?.type === "DELIMITER" && peek()?.value === "(") {
        consume("DELIMITER"); // (
        while (
          peek() &&
          peek()?.type !== "DELIMITER" &&
          peek()?.value !== ")"
        ) {
          if (peek()?.type === "IDENTIFIER") {
            params.push(String(consume("IDENTIFIER").value));
            if (
              peek() &&
              peek()?.type === "DELIMITER" &&
              peek()?.value === ","
            ) {
              consume("DELIMITER");
            }
          } else {
            consume();
          }
        }
        consume("DELIMITER"); // )
      }
      const body: Statement[] = [];
      while (peek() && peek()?.type !== "FINPROCEDIMIENTO") {
        body.push(parseStatement());
      }
      consume("FINPROCEDIMIENTO");
      return { type: "FunctionDeclaration", name, params, body };
    }

    // Retornar
    if (token?.type === "RETORNAR") {
      consume("RETORNAR");
      const argument = parseExpression();
      if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ";") {
        consume("DELIMITER");
      }
      return { type: "ReturnStatement", argument };
    }

    // Expresión suelta
    if (
      token?.type === "IDENTIFIER" ||
      token?.type === "INTEGER" ||
      token?.type === "REAL" ||
      token?.type === "STRING" ||
      token?.type === "BOOLEAN"
    ) {
      // Si el identificador es FinAlgoritmo, lo ignoramos
      if (
        token?.type === "IDENTIFIER" &&
        token?.value.toUpperCase() === "FINALGORITMO"
      ) {
        consume();
        return undefined;
      }
      const expr = parseExpression();
      if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ";") {
        consume("DELIMITER");
      }
      return { type: "ExpressionStatement", expression: expr };
    }

    // No soportado
    consume();
    return {
      type: "CommentStatement",
      value: `[NO SOPORTADO: ${token?.type}, valor: ${token?.value}]`,
    };
  }

  function parseExpression(): Expression {
    let left = parsePrimary();
    while (peek() && peek()?.type === "OPERATOR") {
      const operator = String(consume("OPERATOR").value);
      const right = parsePrimary();
      if (right === undefined) break; // Si es FinAlgoritmo, termina la expresión
      left = { type: "BinaryExpression", operator, left, right };
    }
    return left;
  }

  function parsePrimary(): Expression {
    const token = peek();
    if (!token)
      return { type: "CommentStatement", value: "[NO SOPORTADO: EOF]" };

    // Números
    if (token.type === "INTEGER" || token.type === "REAL") {
      consume();
      return { type: "Literal", value: Number(token.value) };
    }

    // Cadenas
    if (token.type === "STRING") {
      consume();
      return { type: "Literal", value: token.value };
    }

    // Booleanos
    if (token.type === "BOOLEAN") {
      consume();
      return {
        type: "Literal",
        value: token.value.toUpperCase() === "VERDADERO",
      };
    }

    // Identificadores y llamadas
    if (token.type === "IDENTIFIER") {
      // Ignorar FinAlgoritmo como identificador en expresiones
      if (token.value.toUpperCase() === "FINALGORITMO") {
        consume();
        return { type: "CommentStatement", value: "" }; // o retorna undefined
      }
      consume();
      let expr: Expression = { type: "Identifier", name: String(token.value) };

      // Acceso a arreglo: arr[0]
      while (peek() && peek()?.type === "DELIMITER" && peek()?.value === "[") {
        consume("DELIMITER"); // [
        const property = parseExpression();
        consume("DELIMITER"); // ]
        expr = {
          type: "MemberExpression",
          object: expr,
          property,
        };
      }

      // Llamada a función
      if (peek() && peek()?.type === "DELIMITER" && peek()?.value === "(") {
        consume("DELIMITER"); // (
        const args: Expression[] = [];
        while (
          peek() &&
          peek()?.type !== "DELIMITER" &&
          peek()?.value !== ")"
        ) {
          args.push(parseExpression());
          if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ",") {
            consume("DELIMITER");
          }
        }
        consume("DELIMITER"); // )
        return {
          type: "CallExpression",
          callee: expr,
          arguments: args,
        };
      }

      return expr;
    }

    // Arreglos literales: {1,2,3}
    if (token.type === "DELIMITER" && token.value === "{") {
      consume("DELIMITER"); // {
      const elements: Expression[] = [];
      while (
        peek() &&
        !(peek()?.type === "DELIMITER" && peek()?.value === "}")
      ) {
        elements.push(parseExpression());
        if (peek() && peek()?.type === "DELIMITER" && peek()?.value === ",") {
          consume("DELIMITER");
        }
      }
      consume("DELIMITER"); // }
      return { type: "ArrayExpression", elements };
    }

    // Números negativos
    if (token.type === "OPERATOR" && token.value === "-") {
      consume("OPERATOR");
      const next = parsePrimary();
      if (next.type === "Literal" && typeof next.value === "number") {
        return { type: "Literal", value: -next.value };
      }
      return { type: "UnaryExpression", operator: "-", argument: next };
    }

    return {
      type: "CommentStatement",
      value: `[NO SOPORTADO: ${token.type}, valor: ${token.value}]`,
    };
  }

  return parseProgram();
}
