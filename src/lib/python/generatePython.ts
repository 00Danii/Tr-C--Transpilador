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

    default:
      return "# [NO SOPORTADO]";
  }
}
