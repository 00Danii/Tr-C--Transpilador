import { Token } from "./lexer";
import {
  Program,
  Statement,
  Expression,
  FunctionDeclaration,
  ReturnStatement,
  ExpressionStatement,
  VariableDeclaration,
  IfStatement,
  WhileStatement,
  ForStatement,
  TryStatement,
  BlockStatement,
  CommentStatement,
  BinaryExpression,
  Identifier,
  Literal,
  CallExpression,
  UnaryExpression,
  LambdaExpression,
} from "../ast";

export function parse(tokens: Token[]): Program {
  let current = 0;

  function peek(n = 0) {
    return tokens[current + n];
  }

  function consume(type?: string) {
    const token = tokens[current];
    if (type && token.type !== type) {
      throw new Error(
        `Token inesperado: ${token.type}, valor: ${token.value}, se esperaba: ${type}`
      );
    }
    current++;
    return token;
  }

  function parseProgram(): Program {
    const body: Statement[] = [];
    // Opcional: consume PHP_OPEN y PHP_CLOSE
    if (peek() && peek().type === "PHP_OPEN") consume("PHP_OPEN");
    while (peek() && peek().type !== "PHP_CLOSE") {
      body.push(parseStatement());
    }
    if (peek() && peek().type === "PHP_CLOSE") consume("PHP_CLOSE");
    return { type: "Program", body };
  }

  function parseStatement(): Statement {
    const token = peek();

    if (!token) return undefined;

    // Expresiones especiales: incremento y decremento
    // $i++;
    if (token.type === "VARIABLE" && peek(1)?.type === "INCREMENT") {
      const name = String(consume("VARIABLE").value).slice(1);
      consume("INCREMENT");
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
        consume("PUNCTUATION");
      }
      return {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "=",
          left: { type: "Identifier", name },
          right: {
            type: "BinaryExpression",
            operator: "+",
            left: { type: "Identifier", name },
            right: { type: "Literal", value: 1 },
          },
        },
      };
    }

    // $i--;
    if (token.type === "VARIABLE" && peek(1)?.type === "DECREMENT") {
      const name = String(consume("VARIABLE").value).slice(1);
      consume("DECREMENT");
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";") {
        consume("PUNCTUATION");
      }
      return {
        type: "ExpressionStatement",
        expression: {
          type: "BinaryExpression",
          operator: "=",
          left: { type: "Identifier", name },
          right: {
            type: "BinaryExpression",
            operator: "-",
            left: { type: "Identifier", name },
            right: { type: "Literal", value: 1 },
          },
        },
      };
    }

    // Comentarios
    if (token.type === "LINE_COMMENT" || token.type === "BLOCK_COMMENT") {
      consume();
      return { type: "CommentStatement", value: String(token.value) };
    }

    // Function declaration
    if (token.type === "FUNCTION") return parseFunctionDeclaration();

    // If statement
    if (token.type === "IF") return parseIfStatement();

    // While
    if (token.type === "WHILE") return parseWhileStatement();

    // For
    if (token.type === "FOR") return parseForStatement();

    // Try/catch/finally
    if (token.type === "TRY") return parseTryStatement();

    // Return
    if (token.type === "RETURN") {
      consume("RETURN");
      const argument = parseExpression();
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";")
        consume("PUNCTUATION");
      return { type: "ReturnStatement", argument };
    }

    // Print (echo)
    if (token.type === "PRINT") {
      consume("PRINT");
      const args: Expression[] = [];
      args.push(parseExpression());
      while (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
        consume("PUNCTUATION");
        args.push(parseExpression());
      }
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";")
        consume("PUNCTUATION");
      return {
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "print" },
          arguments: args,
        },
      };
    }

    // Variable declaration SOLO si es asignación
    if (
      token.type === "VARIABLE" &&
      peek(1) &&
      peek(1).type === "OPERATOR" &&
      peek(1).value === "="
    ) {
      return parseVariableDeclaration();
    }

    // Expression statement
    if (
      token.type === "IDENTIFIER" ||
      token.type === "VARIABLE" ||
      token.type === "NUMBER" ||
      token.type === "STRING" ||
      token.type === "TRUE" ||
      token.type === "FALSE" ||
      token.type === "NULL"
    ) {
      const expr = parseExpression();
      if (peek() && peek().type === "PUNCTUATION" && peek().value === ";")
        consume("PUNCTUATION");
      return { type: "ExpressionStatement", expression: expr };
    }

    // Bloque
    if (token.type === "PUNCTUATION" && token.value === "{") {
      return { type: "BlockStatement", body: parseBlock() };
    }

    // Por defecto, consume y retorna undefined
    consume();
    return undefined;
  }

  function parseBlock(): Statement[] {
    consume("PUNCTUATION"); // {
    const body: Statement[] = [];
    while (peek() && !(peek().type === "PUNCTUATION" && peek().value === "}")) {
      body.push(parseStatement());
    }
    consume("PUNCTUATION"); // }
    return body;
  }

  function parseFunctionDeclaration(): FunctionDeclaration {
    consume("FUNCTION");
    const name = consume("IDENTIFIER").value as string;
    consume("PUNCTUATION"); // (
    const params: string[] = [];
    while (peek() && peek().type !== "PUNCTUATION" && peek().value !== ")") {
      if (peek().type === "VARIABLE") {
        params.push(String(consume("VARIABLE").value).slice(1));
        if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
          consume("PUNCTUATION");
        }
      } else {
        throw new Error(`Se esperaba VARIABLE en parámetros`);
      }
    }
    consume("PUNCTUATION"); // )
    const body = parseBlock();
    return { type: "FunctionDeclaration", name, params, body };
  }

  function parseVariableDeclaration(): VariableDeclaration {
    const token = consume("VARIABLE");
    const name = String(token.value).slice(1);
    let value: Expression = { type: "Literal", value: null };
    if (peek() && peek().type === "OPERATOR" && peek().value === "=") {
      consume("OPERATOR");
      value = parseExpression();
    }
    if (peek() && peek().type === "PUNCTUATION" && peek().value === ";")
      consume("PUNCTUATION");
    return { type: "VariableDeclaration", kind: "", name, value };
  }

  function parseIfStatement(): IfStatement {
    consume("IF");
    consume("PUNCTUATION"); // (
    const test = parseExpression();
    consume("PUNCTUATION"); // )
    const consequent = parseBlock();
    let alternate: Statement | IfStatement | undefined;
    if (peek() && peek().type === "ELSEIF") {
      alternate = parseElseIfStatement();
    } else if (peek() && peek().type === "ELSE") {
      consume("ELSE");
      const elseBlock = parseBlock();
      alternate = {
        type: "IfStatement",
        test: { type: "Literal", value: true },
        consequent: elseBlock,
      };
    }
    return { type: "IfStatement", test, consequent, alternate };
  }

  function parseElseIfStatement(): IfStatement {
    consume("ELSEIF");
    consume("PUNCTUATION"); // (
    const test = parseExpression();
    consume("PUNCTUATION"); // )
    const consequent = parseBlock();
    let alternate: Statement | IfStatement | undefined;
    if (peek() && peek().type === "ELSEIF") {
      alternate = parseElseIfStatement();
    } else if (peek() && peek().type === "ELSE") {
      consume("ELSE");
      const elseBlock = parseBlock();
      alternate = {
        type: "IfStatement",
        test: { type: "Literal", value: true },
        consequent: elseBlock,
      };
    }
    return { type: "IfStatement", test, consequent, alternate };
  }

  function parseWhileStatement(): WhileStatement {
    consume("WHILE");
    consume("PUNCTUATION"); // (
    const test = parseExpression();
    consume("PUNCTUATION"); // )
    const body = parseBlock();
    return { type: "WhileStatement", test, body };
  }

  function parseForStatement(): ForStatement {
    consume("FOR");
    consume("PUNCTUATION"); // (
    const init = parseStatement();
    const test = parseExpression();
    consume("PUNCTUATION"); // ;
    const update = parseStatement();
    consume("PUNCTUATION"); // )
    const body = parseBlock();
    return { type: "ForStatement", init, test, update, body };
  }

  function parseTryStatement(): TryStatement {
    consume("TRY");
    const block = parseBlock();
    let handler;
    if (peek() && peek().type === "CATCH") {
      consume("CATCH");
      consume("PUNCTUATION"); // (
      const param: Identifier = {
        type: "Identifier",
        name: String(consume("VARIABLE").value).slice(1),
      };
      consume("PUNCTUATION"); // )
      const body = parseBlock();
      handler = { param, body };
    }
    let finalizer;
    if (peek() && peek().type === "FINALLY") {
      consume("FINALLY");
      finalizer = parseBlock();
    }
    return { type: "TryStatement", block, handler, finalizer };
  }

  function parseExpression(): Expression {
    return parseBinaryExpression();
  }

  function parseBinaryExpression(): Expression {
    let left = parsePrimary();
    while (peek() && peek().type === "OPERATOR") {
      const operator = consume("OPERATOR").value as string;
      const right = parsePrimary();
      left = { type: "BinaryExpression", operator, left, right };
    }
    return left;
  }

  function parsePrimary(): Expression {
    const token = peek();
    console.log("parsePrimary token:", token);

    if (!token) throw new Error("Token inesperado: EOF");

    if (token.type === "NUMBER" || token.type === "STRING") {
      consume();
      return { type: "Literal", value: token.value };
    }

    if (token.type === "TRUE") {
      consume();
      return { type: "Literal", value: true };
    }
    if (token.type === "FALSE") {
      consume();
      return { type: "Literal", value: false };
    }
    if (token.type === "NULL") {
      consume();
      return { type: "Literal", value: null };
    }

    if (token.type === "VARIABLE") {
      consume();
      return { type: "Identifier", name: String(token.value).slice(1) };
    }

    if (token.type === "IDENTIFIER") {
      const name = consume().value as string;
      // Llamada a función
      if (peek() && peek().type === "PUNCTUATION" && peek().value === "(") {
        consume("PUNCTUATION"); // (
        const args: Expression[] = [];
        while (
          peek() &&
          peek().type !== "PUNCTUATION" &&
          peek().value !== ")"
        ) {
          args.push(parseExpression());
          if (peek() && peek().type === "PUNCTUATION" && peek().value === ",") {
            consume("PUNCTUATION");
          }
        }
        consume("PUNCTUATION"); // )
        return {
          type: "CallExpression",
          callee: { type: "Identifier", name },
          arguments: args,
        };
      }
      return { type: "Identifier", name };
    }

    throw new Error(`Token inesperado: ${token.type}, valor: ${token.value}`);
  }

  return parseProgram();
}
