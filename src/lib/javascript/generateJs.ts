import {
  Program,
  Statement,
  FunctionDeclaration,
  ReturnStatement,
  ExpressionStatement,
  VariableDeclaration,
  IfStatement,
  WhileStatement,
  ForStatement,
  CommentStatement,
  Expression,
  CallExpression,
  Identifier,
  Literal,
} from "../ast";

export function generateJs(node: Program | Statement | Expression): string {
  switch (node.type) {
    case "Program":
      return node.body.map(generateJs).join("");

    case "FunctionDeclaration":
      return `function ${node.name}(${node.params.join(", ")}) {\n${node.body
        .map((stmt) => "  " + generateJs(stmt).replace(/\n/g, ""))
        .join("\n")}\n}`;

    case "ReturnStatement":
      return `return ${generateJs(node.argument)};\n`;

    case "VariableDeclaration":
      return `${node.kind} ${node.name} = ${generateJs(node.value)};\n`;

    case "ExpressionStatement":
      // Si es asignación
      if (
        node.expression.type === "BinaryExpression" &&
        node.expression.operator === "=" &&
        node.expression.left.type === "Identifier"
      ) {
        return `${node.expression.left.name} = ${generateJs(
          node.expression.right
        )};\n`;
      }
      return `${generateJs(node.expression)};\n`;

    case "IfStatement": {
      let code = `if (${generateJs(node.test)}) {\n`;
      code += node.consequent.map((s) => "  " + generateJs(s)).join("");
      code += "}\n";
      if (node.alternate) {
        if (
          node.alternate.type === "IfStatement" &&
          node.alternate.test.type === "Literal" &&
          node.alternate.test.value === true
        ) {
          // Es un else
          code += `else {\n${node.alternate.consequent
            .map((s) => "  " + generateJs(s))
            .join("")}}\n`;
        } else if (node.alternate.type === "IfStatement") {
          // Es un else if
          code += `else ${generateJs(node.alternate)}`;
        } else {
          if (Array.isArray(node.alternate)) {
            code += `else {\n${node.alternate
              .map((s) => "  " + generateJs(s))
              .join("")}}\n`;
          } else {
            code += `else {\n  ${generateJs(node.alternate)}\n}\n`;
          }
        }
      }
      return code;
    }

    case "WhileStatement":
      return `while (${generateJs(node.test)}) {\n${node.body
        .map((s) => "  " + generateJs(s))
        .join("")}}\n`;

    case "ForStatement": {
      // Solo soporta for clásico
      let init = node.init ? generateJs(node.init).replace(/\n/g, "") : "";
      let test = node.test ? generateJs(node.test) : "";
      let update = node.update
        ? generateJs(node.update).replace(/\n/g, "")
        : "";
      let code = `for (${init} ${test}; ${update}) {\n`;
      code += node.body.map((s) => "  " + generateJs(s)).join("");
      code += "}\n";
      return code;
    }

    case "CommentStatement":
      return `// ${node.value}\n`;

    case "CallExpression":
      // Si es print, conviértelo a console.log
      if (node.callee.type === "Identifier" && node.callee.name === "print") {
        return `console.log(${node.arguments.map(generateJs).join(", ")})`;
      }
      return `${generateJs(node.callee)}(${node.arguments
        .map(generateJs)
        .join(", ")})`;

    case "Identifier":
      return node.name;

    case "Literal":
      return typeof node.value === "string"
        ? `"${node.value}"`
        : String(node.value);

    case "BinaryExpression":
      return `${generateJs(node.left)} ${node.operator} ${generateJs(
        node.right
      )}`;

    default:
      return "// [NO SOPORTADO]\n";
  }
}
