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
        "}\n\n"
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
      if (typeof node.value === "string") {
        return `"${node.value}"`;
      }
      if (typeof node.value === "boolean") {
        return node.value ? "true" : "false";
      }
      return String(node.value);

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
        // Detecta else normal representado como IfStatement con test true/1
        if (
          node.alternate.type === "IfStatement" &&
          node.alternate.test.type === "Literal" &&
          (node.alternate.test.value === true ||
            node.alternate.test.value === 1)
        ) {
          code +=
            "else {\n  " +
            node.alternate.consequent.map(generatePhp).join("  ") +
            "}\n";
        } else if (node.alternate.type === "IfStatement") {
          // else if
          code +=
            "else if (" +
            generatePhp(node.alternate.test) +
            ") {\n  " +
            node.alternate.consequent.map(generatePhp).join("  ") +
            "}\n";
          // Genera el else final si existe y es un IfStatement con test true/1
          if (
            node.alternate.alternate &&
            node.alternate.alternate.type === "IfStatement" &&
            node.alternate.alternate.test.type === "Literal" &&
            (node.alternate.alternate.test.value === true ||
              node.alternate.alternate.test.value === 1)
          ) {
            code +=
              "else {\n  " +
              node.alternate.alternate.consequent.map(generatePhp).join("  ") +
              "}\n";
          }
        } else if (Array.isArray(node.alternate)) {
          code +=
            "else {\n  " + node.alternate.map(generatePhp).join("  ") + "}\n";
        } else {
          code += "else {\n  " + generatePhp(node.alternate) + "}\n\n";
        }
      }
      return code;

    case "WhileStatement":
      return (
        `while (${generatePhp(node.test)}) {\n  ` +
        node.body.map(generatePhp).join("  ") +
        "}\n\n"
      );

    case "ForStatement":
      // Solo ejemplo para for clásico JS
      if (node.init && node.test && node.update) {
        return (
          `for (${generatePhp(node.init).replace(/;\s*$/, "")}; ${generatePhp(
            node.test
          )}; ${generatePhp(node.update).replace(/;\s*$/, "")}) {\n  ` +
          node.body.map(generatePhp).join("  ") +
          "}\n\n"
        );
      }

      // For tipo Python: for i in range(...)
      if (
        node.varName &&
        node.rangeExpr &&
        node.rangeExpr.type === "CallExpression" &&
        node.rangeExpr.callee.type === "Identifier" &&
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
          "}\n\n"
        );
      }
      return "";

    case "DoWhileStatement":
      return `do {\n  ${node.body
        .map(generatePhp)
        .join("  ")}} while (${generatePhp(node.test)});\n\n`;

    case "UnaryExpression":
      return `${node.operator}${generatePhp(node.argument)}`;

    case "LambdaExpression":
      return `fn($${node.params.join(", ")}) => ${generatePhp(node.body)}`;

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
          "finally {\n  " +
          node.finalizer.map(generatePhp).join("  ") +
          "}\n\n";
      }
      return tryCode;

    case "BlockStatement":
      return node.body.map(generatePhp).join("");

    case "ArrayExpression":
      // array(1, 2, 3) en PHP
      return "array(" + node.elements.map(generatePhp).join(", ") + ")";

    case "MemberExpression":
      // $arr[0] en PHP
      return `${generatePhp(node.object)}[${generatePhp(node.property)}]`;

    default:
      return "";
  }
}
