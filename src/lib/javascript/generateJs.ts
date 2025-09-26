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
  switch (node?.type) {
    case "Program":
      return node.body.map(generateJs).join("");

    case "FunctionDeclaration":
      return `function ${node.name}(${node.params.join(", ")}) {\n${node.body
        .map((stmt) => "  " + generateJs(stmt).replace(/\n/g, ""))
        .join("\n")}\n}\n`;

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
      if (
        node.varName &&
        node.rangeExpr &&
        node.rangeExpr.type === "CallExpression" &&
        node.rangeExpr.callee.name === "range"
      ) {
        const args = node.rangeExpr.arguments.map(generateJs);
        let start = "0",
          end = "0",
          step = "1";
        if (args.length === 1) {
          // range(END)
          start = "0";
          end = args[0];
        } else if (args.length === 2) {
          // range(START, END)
          start = args[0];
          end = args[1];
        } else if (args.length === 3) {
          // range(START, END, STEP)
          start = args[0];
          end = args[1];
          step = args[2];
        }
        let cmp = step.startsWith("-") ? ">" : "<";
        let code = `for (${node.varName} = ${start}; ${node.varName} ${cmp} ${end}; ${node.varName} += ${step}) {\n`;
        code += node.body.map((s) => "  " + generateJs(s)).join("");
        code += "}\n";
        return code;
      }
      return "// [NO SOPORTADO: for]\n";
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

    case "UnaryExpression":
      if (node.operator === "not") {
        return `!${generateJs(node.argument)}`;
      }
      return `${node.operator}${generateJs(node.argument)}`;

    default:
      return "// [NO SOPORTADO]\n";
  }
}
