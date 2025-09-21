import { Program, Statement, Expression } from "../ast";

export function generatePython(node: Program | Statement | Expression): string {
  switch (node.type) {
    case "Program":
      return node.body.map(generatePython).join("\n");

    case "FunctionDeclaration":
      return `def ${node.name}(${node.params.join(", ")}):\n${node.body
        .map((stmt) => "    " + generatePython(stmt))
        .join("\n")}`;

    case "ReturnStatement":
      return `return ${generatePython(node.argument)}`;

    case "ExpressionStatement":
      return generatePython(node.expression);

    case "BinaryExpression":
      // Soporta asignaciones y operaciones
      return `${generatePython(node.left)} ${node.operator} ${generatePython(
        node.right
      )}`;

    case "Identifier":
      return node.name;

    case "Literal":
      if (typeof node.value === "string") {
        // Elimina comillas extra si existen
        const val = node.value.replace(/^"+|"+$/g, "");
        return `"${val}"`;
      }
      return String(node.value);

    case "VariableDeclaration":
      return `${node.name} = ${generatePython(node.value)}`;

    case "CallExpression":
      return `${generatePython(node.callee)}(${node.arguments
        .map(generatePython)
        .join(", ")})`;

    case "CommentStatement":
      return `# ${node.value}`;

    case "IfStatement": {
      // Helper para alternates anidados
      function handleAlternate(alt: any): string {
        if (alt.type === "IfStatement" && alt.test.type !== "Literal") {
          // elif
          let code = `elif ${generatePython(alt.test)}:\n`;
          code += alt.consequent
            .map((s: Statement) => "    " + generatePython(s))
            .join("\n");
          if (alt.alternate) {
            code += handleAlternate(alt.alternate);
          }
          return "\n" + code;
        } else if (alt.type === "IfStatement" && alt.test.type === "Literal") {
          // else
          let code = `else:\n`;
          code += alt.consequent
            .map((s: Statement) => "    " + generatePython(s))
            .join("\n");
          return "\n" + code;
        } else if (Array.isArray(alt)) {
          // else como array de statements
          let code = `else:\n`;
          code += alt
            .map((s: Statement) => "    " + generatePython(s))
            .join("\n");
          return "\n" + code;
        } else {
          // else como statement único
          return `\nelse:\n    ${generatePython(alt)}`;
        }
      }

      let code = `if ${generatePython(node.test)}:\n`;
      code += node.consequent
        .map((s: Statement) => "    " + generatePython(s))
        .join("\n");
      if (node.alternate) {
        code += handleAlternate(node.alternate);
      }
      return code;
    }

    default:
      return "# [NO SOPORTADO]";
  }
}
