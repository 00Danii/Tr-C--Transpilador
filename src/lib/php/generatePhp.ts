import { Program, Statement, Expression } from "../ast";

export function generatePhp(
  node: Program | Statement | Expression | undefined
): string {
  if (!node) return "";
  switch (node.type) {
    case "Program":
      return "<?php\n" + node.body.map(generatePhp).join("") + "?>\n";

    case "FunctionDeclaration":
      return (
        `function ${node.name}(${node.params.join(", ")}) {\n` +
        "  " +
        node.body.map(generatePhp).join("  ") +
        "}\n"
      );

    case "ReturnStatement":
      return `return ${generatePhp(node.argument)};\n`;

    case "ExpressionStatement":
      return generatePhp(node.expression) + ";\n";

    case "VariableDeclaration":
      return `$${node.name} = ${generatePhp(node.value)};\n`;

    case "BinaryExpression":
      return `${generatePhp(node.left)} ${node.operator} ${generatePhp(
        node.right
      )}`;

    case "Identifier":
      return `$${node.name}`;

    case "Literal":
      return typeof node.value === "string"
        ? `"${node.value}"`
        : String(node.value);

    case "CallExpression":
      // Si es print (que viene de console.log en JS), genera echo
      if (node.callee.type === "Identifier" && node.callee.name === "print") {
        return "echo " + node.arguments.map(generatePhp).join(", ");
      }
      // Normal
      return `${generatePhp(node.callee)}(${node.arguments
        .map(generatePhp)
        .join(", ")})`;

    case "CommentStatement":
      return `// ${node.value}\n`;

    case "IfStatement":
      let code = `if (${generatePhp(node.test)}) {\n  `;
      code += node.consequent.map(generatePhp).join("  ");
      code += "}\n";
      if (node.alternate) {
        // Caso especial: else normal representado como IfStatement con test = 1
        if (
          node.alternate.type === "IfStatement" &&
          node.alternate.test.type === "Literal" &&
          node.alternate.test.value === 1
        ) {
          code +=
            "else {\n  " +
            node.alternate.consequent.map(generatePhp).join("  ") +
            "}\n";
        } else if (node.alternate.type === "IfStatement") {
          // else if
          code += "else " + generatePhp(node.alternate);
        } else if (Array.isArray(node.alternate)) {
          // else como array de statements (por si acaso)
          code +=
            "else {\n  " + node.alternate.map(generatePhp).join("  ") + "}\n";
        } else {
          // bloque único
          code += "else {\n  " + generatePhp(node.alternate) + "}\n";
        }
      }
      return code;

    case "WhileStatement":
      return (
        `while (${generatePhp(node.test)}) {\n  ` +
        node.body.map(generatePhp).join("  ") +
        "}\n"
      );

    case "ForStatement":
      // Solo ejemplo para for clásico JS
      if (node.init && node.test && node.update) {
        return (
          `for (${generatePhp(node.init).replace(/;\s*$/, "")}; ${generatePhp(
            node.test
          )}; ${generatePhp(node.update).replace(/;\s*$/, "")}) {\n  ` +
          node.body.map(generatePhp).join("  ") +
          "}\n"
        );
      }

      // For tipo Python: for i in range(...)
      if (
        node.varName &&
        node.rangeExpr &&
        node.rangeExpr.type === "CallExpression" &&
        node.rangeExpr.callee.name === "range"
      ) {
        const args = node.rangeExpr.arguments.map(generatePhp);
        let start = "0",
          end = "0",
          step = "1";
        if (args.length === 1) {
          // range(end)
          start = "0";
          end = args[0];
        } else if (args.length === 2) {
          // range(start, end)
          start = args[0];
          end = args[1];
        } else if (args.length === 3) {
          // range(start, end, step)
          start = args[0];
          end = args[1];
          step = args[2];
        }
        // Si el paso es negativo, usa i--, si es positivo, i++
        let cmp = step.startsWith("-") ? ">" : "<";
        let inc =
          step === "1" ? `${node.varName}++` : `${node.varName} += ${step}`;
        if (step.startsWith("-")) {
          inc =
            step === "-1" ? `${node.varName}--` : `${node.varName} += ${step}`;
        }
        return (
          `for ($${node.varName} = ${start}; $${node.varName} ${cmp} ${end}; ${inc}) {\n  ` +
          node.body.map(generatePhp).join("  ") +
          "}\n"
        );
      }
      return "";

    case "DoWhileStatement":
      return `do {\n  ${node.body
        .map(generatePhp)
        .join("  ")}} while (${generatePhp(node.test)});\n`;

    case "UnaryExpression":
      return `${node.operator}${generatePhp(node.argument)}`;

    case "LambdaExpression":
      return `fn(${node.params.join(", ")}) => ${generatePhp(node.body)}`;

    case "TryStatement":
      let tryCode =
        "try {\n  " + node.block.map(generatePhp).join("  ") + "}\n";
      if (node.handler) {
        tryCode +=
          `catch (Exception ${generatePhp(node.handler.param)}) {\n  ` +
          node.handler.body.map(generatePhp).join("  ") +
          "}\n";
      }
      if (node.finalizer) {
        tryCode +=
          "finally {\n  " + node.finalizer.map(generatePhp).join("  ") + "}\n";
      }
      return tryCode;

    case "BlockStatement":
      return node.body.map(generatePhp).join("");

    default:
      return "";
  }
}
