import { Program, Statement, Expression } from "../ast";

function isDefinition(node: Statement | Expression) {
  return node?.type === "FunctionDeclaration";
}

function isExecutable(node: Statement | Expression) {
  // Todo lo que no sea definición
  return !isDefinition(node);
}

// Inferir tipo de datos para variables y expresiones
function inferType(node: Expression, typeMap: Map<string, string>): string {
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") {
        // Devuelve el TIPO de dato (char o String)
        return node.value.length === 1 ? "char" : "String";
      }
      if (typeof node.value === "number") {
        // Si tiene parte decimal, double; sino int
        return node.value % 1 === 0 ? "int" : "double";
      }
      if (typeof node.value === "boolean") return "boolean";
      return "Object";

    case "BinaryExpression":
      const leftType = inferType(node.left, typeMap);
      const rightType = inferType(node.right, typeMap);
      // Concatenación: si incluye String o char, resultado es String
      if (
        node.operator === "+" &&
        (leftType === "String" ||
          rightType === "String" ||
          leftType === "char" ||
          rightType === "char")
      ) {
        return "String";
      }
      // Operaciones aritméticas: si cualquiera es double, resultado es double
      if (leftType === "double" || rightType === "double") {
        return "double";
      }
      return leftType === "int" && rightType === "int" ? "int" : "Object";

    case "Identifier":
      return typeMap.get(node.name) || "Object";

    case "CallExpression":
      // Funciones conocidas
      if (node.callee.type === "Identifier") {
        if (node.callee.name === "print") return "void";
        // Aquí podrías agregar más funciones conocidas
      }
      return "Object";

    default:
      return "Object";
  }
}

export function generateJava(node: Program | Statement | Expression): string {
  const typeMap = new Map<string, string>();

  // Primera pasada: recolectar tipos de variables y asignaciones
  if (node?.type === "Program") {
    node.body.forEach((stmt) => {
      if (stmt?.type === "VariableDeclaration") {
        const inferredType = inferType(stmt.value, typeMap);
        typeMap.set(stmt.name, inferredType);
      } else if (
        stmt?.type === "ExpressionStatement" &&
        stmt.expression.type === "BinaryExpression" &&
        stmt.expression.operator === "=" &&
        stmt.expression.left.type === "Identifier"
      ) {
        // Asignación directa: x = 42
        const varName = stmt.expression.left.name;
        const inferredType = inferType(stmt.expression.right, typeMap);
        typeMap.set(varName, inferredType);
      }
    });
  }

  // Función interna recursiva que usa el typeMap
  function generateWithTypes(node: Program | Statement | Expression): string {
    if (node?.type === "Program") {
      // Separa definiciones y ejecutables
      const definitions = node.body.filter(isDefinition);
      const executables = node.body.filter(isExecutable);

      // Métodos fuera de main
      const methods = definitions.map(generateWithTypes).join("\n\n");

      // Código ejecutable dentro de main
      const mainBody = executables.map(generateWithTypes).join("\n");

      return (
        "public class Main {\n" +
        (methods ? methods + "\n\n" : "") +
        "  public static void main(String[] args) {\n" +
        mainBody
          .split("\n")
          .map((line) => (line ? "    " + line : ""))
          .join("\n") +
        "\n  }\n}"
      );
    }

    switch (node?.type) {
      case "FunctionDeclaration":
        // Por simplicidad, todos los métodos son public static void y parámetros tipo int
        return `  public static void ${node.name}(${node.params
          .map((p) => `${typeMap.get(p) || "Object"} ${p}`)
          .join(", ")}) {\n${node.body
          .map((stmt) => "    " + generateWithTypes(stmt).replace(/\n/g, ""))
          .join("\n")}\n  }`;

      case "ReturnStatement":
        return `return ${generateWithTypes(node.argument)};`;

      case "VariableDeclaration":
        const varType = typeMap.get(node.name) || "Object";
        return `${varType} ${node.name} = ${generateWithTypes(node.value)};`;

      case "ExpressionStatement":
        // Si es asignación, declarar tipo si no existe
        if (
          node.expression.type === "BinaryExpression" &&
          node.expression.operator === "="
        ) {
          const left = node.expression.left;
          if (left.type === "Identifier") {
            const varName = left.name;
            const varType = typeMap.get(varName) || "Object";
            const rightCode = generateWithTypes(node.expression.right);
            return `${varType} ${varName} = ${rightCode};`;
          }
        }
        return `${generateWithTypes(node.expression)};`;

      case "IfStatement": {
        let code = `if (${generateWithTypes(node.test)}) {\n`;
        code += node.consequent
          .map((s) => "  " + generateWithTypes(s))
          .join("");
        code += "\n}\n";
        if (node.alternate) {
          if (
            node.alternate.type === "IfStatement" &&
            node.alternate.test.type === "Literal" &&
            Boolean(node.alternate.test.value)
          ) {
            // else
            code += `else {\n${node.alternate.consequent
              .map((s) => "  " + generateWithTypes(s))
              .join("")}\n}\n`;
          } else if (node.alternate.type === "IfStatement") {
            // else if
            code += `else ${generateWithTypes(node.alternate)}`;
          } else {
            if (Array.isArray(node.alternate)) {
              code += `else {\n${node.alternate
                .map((s) => "  " + generateWithTypes(s))
                .join("")}\n}\n`;
            } else {
              code += `else {\n  ${generateWithTypes(node.alternate)}\n}\n`;
            }
          }
        }
        return code;
      }

      case "WhileStatement":
        return `while (${generateWithTypes(node.test)}) {\n${node.body
          .map((s) => "  " + generateWithTypes(s))
          .join("\n")}\n}\n`;

      case "ForStatement": {
        if (node.init && node.test && node.update) {
          return (
            `for (${generateWithTypes(node.init).replace(
              /;\s*$/,
              ""
            )}; ${generateWithTypes(node.test)}; ${generateWithTypes(
              node.update
            ).replace(/;\s*$/, "")}) {\n` +
            node.body.map((s) => "  " + generateWithTypes(s)).join("") +
            "}\n"
          );
        }
        return "// [NO SOPORTADO: for]\n";
      }

      case "DoWhileStatement":
        return (
          `do {\n` +
          node.body.map((s) => "  " + generateWithTypes(s)).join("") +
          `} while (${generateWithTypes(node.test)});\n`
        );

      case "CommentStatement":
        return `// ${node.value}`;

      case "CallExpression":
        // print → System.out.println
        if (node.callee.type === "Identifier" && node.callee.name === "print") {
          return `System.out.println(${node.arguments
            .map(generateWithTypes)
            .join(", ")})`;
        }
        return `${generateWithTypes(node.callee)}(${node.arguments
          .map(generateWithTypes)
          .join(", ")})`;

      case "Identifier":
        return node.name;

      case "Literal":
        if (typeof node.value === "string") {
          // Char usa comillas simples, String dobles
          return node.value.length === 1
            ? `'${node.value}'`
            : `"${node.value}"`;
        }
        if (typeof node.value === "boolean")
          return node.value ? "true" : "false";
        if (node.value === null) return "null";
        return String(node.value);

      case "BinaryExpression":
        return `${generateWithTypes(node.left)} ${
          node.operator
        } ${generateWithTypes(node.right)}`;

      case "UnaryExpression":
        return `${node.operator}${generateWithTypes(node.argument)}`;

      case "LambdaExpression":
        // Java lambdas requieren contexto, aquí solo como ejemplo:
        return `(${node.params.join(", ")}) -> ${generateWithTypes(node.body)}`;

      case "TryStatement": {
        let code = "try {\n";
        code += node.block.map((s) => "  " + generateWithTypes(s)).join("");
        code += "}\n";
        if (node.handler) {
          code += `catch (Exception ${node.handler.param.name}) {\n`;
          code += node.handler.body
            .map((s) => "  " + generateWithTypes(s))
            .join("");
          code += "}\n";
        }
        if (node.finalizer) {
          code += "finally {\n";
          code += node.finalizer
            .map((s) => "  " + generateWithTypes(s))
            .join("");
          code += "}\n";
        }
        return code;
      }

      case "BlockStatement":
        return node.body.map(generateWithTypes).join("\n");

      default:
        return "// [NO SOPORTADO]\n";
    }
  }

  return generateWithTypes(node);
}
