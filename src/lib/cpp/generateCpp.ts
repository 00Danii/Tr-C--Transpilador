import { Program, Statement, Expression } from "../ast";

function isDefinition(node: Statement | Expression) {
  return node?.type === "FunctionDeclaration";
}

function isExecutable(node: Statement | Expression) {
  return !isDefinition(node);
}

// Inferir tipo de datos para variables y expresiones (adaptado a C++)
function inferType(node: Expression, typeMap: Map<string, string>): string {
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") {
        return node.value.length === 1 ? "char" : "string";
      }
      if (typeof node.value === "number") {
        return node.value % 1 === 0 ? "int" : "double";
      }
      if (typeof node.value === "boolean") return "bool";
      return "auto"; // Fallback

    case "BinaryExpression":
      const leftType = inferType(node.left, typeMap);
      const rightType = inferType(node.right, typeMap);
      if (
        node.operator === "+" &&
        (leftType === "string" ||
          rightType === "string" ||
          leftType === "char" ||
          rightType === "char")
      ) {
        return "string";
      }
      if (leftType === "double" || rightType === "double") {
        return "double";
      }
      return leftType === "int" && rightType === "int" ? "int" : "auto";

    case "Identifier":
      return typeMap.get(node.name) || "auto";

    case "CallExpression":
      if (node.callee.type === "Identifier" && node.callee.name === "print")
        return "void";
      return "auto";

    case "ArrayExpression":
      if (node.elements.some((el) => el.type === "ArrayKeyValue")) {
        // Inferir tipos de valores para objetos
        const valueTypes = node.elements
          .filter((el) => el.type === "ArrayKeyValue")
          .map((el) => inferType(el.value, typeMap));
        const uniqueValueTypes = [...new Set(valueTypes)];
        if (uniqueValueTypes.length === 1) {
          return `map<string, ${uniqueValueTypes[0]}>`;
        } else {
          // Para mixtos, usar variant
          const variantTypes = uniqueValueTypes.join(", ");
          return `map<string, variant<${variantTypes}>>`;
        }
      }
      if (node.elements.length === 0) return "vector<int>";
      const elementTypes = node.elements.map((el) => inferType(el, typeMap));
      const uniqueTypes = [...new Set(elementTypes)];
      if (uniqueTypes.length === 1) {
        return `vector<${uniqueTypes[0]}>`;
      } else {
        // Para mixtos, usar variant
        const variantTypes = [...new Set(uniqueTypes)].join(", ");
        return `vector<variant<${variantTypes}>>`;
      }

    default:
      return "auto";
  }
}

// Función helper para recolectar tipos en todo el AST
function collectTypes(
  node: Statement | Expression,
  typeMap: Map<string, string>
) {
  if (node?.type === "VariableDeclaration") {
    const inferredType = inferType(node.value, typeMap);
    typeMap.set(node.name, inferredType);
  }
  // REMOVIDO:
  // Para que identifique por primera aparición
  // en el flujo de generación (no en el AST completo)
  // if (
  //   node?.type === "ExpressionStatement" &&
  //   node.expression.type === "BinaryExpression" &&
  //   node.expression.operator === "=" &&
  //   node.expression.left.type === "Identifier"
  // ) {
  //   const varName = node.expression.left.name;
  //   const inferredType = inferType(node.expression.right, typeMap);
  //   typeMap.set(varName, inferredType);
  // }
  if (node?.type === "IfStatement") {
    collectTypes(node.test, typeMap);
    node.consequent.forEach((s) => collectTypes(s, typeMap));
    if (node.alternate) {
      if (Array.isArray(node.alternate)) {
        node.alternate.forEach((s) => collectTypes(s, typeMap));
      } else {
        collectTypes(node.alternate, typeMap);
      }
    }
  }
  if (node?.type === "WhileStatement") {
    collectTypes(node.test, typeMap);
    node.body.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "ForStatement") {
    if (node.init) collectTypes(node.init, typeMap);
    if (node.test) collectTypes(node.test, typeMap);
    if (node.update) collectTypes(node.update, typeMap);
    node.body.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "DoWhileStatement") {
    collectTypes(node.test, typeMap);
    node.body.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "TryStatement") {
    node.block.forEach((s) => collectTypes(s, typeMap));
    if (node.handler)
      node.handler.body.forEach((s) => collectTypes(s, typeMap));
    if (node.finalizer) node.finalizer.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "FunctionDeclaration") {
    node.body.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "SwitchStatement") {
    collectTypes(node.discriminant, typeMap);
    node.cases.forEach((switchCase) => {
      if (switchCase.test) collectTypes(switchCase.test, typeMap);
      switchCase.consequent.forEach((s) => collectTypes(s, typeMap));
    });
    if (node.defaultCase)
      node.defaultCase.forEach((s) => collectTypes(s, typeMap));
  }
  if (node?.type === "ArrayDeclaration") {
    if (node.initialValue) collectTypes(node.initialValue, typeMap);
    node.dimensions.forEach((dim) => collectTypes(dim, typeMap));
  }
  if (node?.type === "MemberExpression") {
    collectTypes(node.object, typeMap);
    collectTypes(node.property, typeMap);
  }
  if (node?.type === "ArrayExpression") {
    // Para objetos, recolectar tipos de valores
    if (node.elements.some((el) => el.type === "ArrayKeyValue")) {
      node.elements.forEach((el) => {
        if (el.type === "ArrayKeyValue") collectTypes(el.value, typeMap);
      });
    } else {
      // Para arreglos normales
      node.elements.forEach((el) => collectTypes(el, typeMap));
    }
  }

  // Agrega más casos ...
}

// Función helper para detectar objetos literales
function hasObjectLiterals(node: Program | Statement | Expression): boolean {
  if (node?.type === "ArrayExpression") {
    return node.elements.some((el) => el.type === "ArrayKeyValue");
  }
  if (node?.type === "Program") {
    return node.body.some(hasObjectLiterals);
  }
  if (node?.type === "VariableDeclaration") {
    return hasObjectLiterals(node.value);
  }
  // Agrega más casos si es necesario
  return false;
}

export function generateCpp(node: Program | Statement | Expression): string {
  const typeMap = new Map<string, string>();

  if (node?.type === "Program") {
    node.body.forEach((stmt) => collectTypes(stmt, typeMap));
  }

  // Función helper para generar expresiones en contexto de cout (convierte + a << para strings)
  function generateForCout(
    node: Expression,
    typeMap: Map<string, string>
  ): string {
    if (node.type === "BinaryExpression" && node.operator === "+") {
      const leftType = inferType(node.left, typeMap);
      const rightType = inferType(node.right, typeMap);
      if (
        leftType === "string" ||
        rightType === "string" ||
        leftType === "char" ||
        rightType === "char"
      ) {
        // Convertir + a << para concatenación en cout
        return `${generateForCout(node.left, typeMap)} << ${generateForCout(
          node.right,
          typeMap
        )}`;
      }
    }
    // Para otros casos, usar generateWithTypes normal
    return generateWithTypes(node);
  }

  function generateWithTypes(node: Program | Statement | Expression): string {
    if (node?.type === "Program") {
      const hasObjects = hasObjectLiterals(node);
      const definitions = node.body.filter(isDefinition);
      const executables = node.body.filter(isExecutable);
      const methods = definitions.map(generateWithTypes).join("\n\n");
      const mainBody = executables.map(generateWithTypes).join("\n");

      const includes =
        "#include <iostream>\n#include <string>\n#include <vector>\n" +
        (hasObjects ? "#include <map>\n" : "") +
        "\nusing namespace std;\n\n";

      return (
        includes +
        (methods ? methods + "\n\n" : "") +
        "int main() {\n" +
        mainBody
          .split("\n")
          .map((line) => (line ? "  " + line : ""))
          .join("\n") +
        "\n  return 0;\n}"
      );
    }

    switch (node?.type) {
      case "CommentStatement":
        return `// ${node.value}`;

      case "FunctionDeclaration":
        return `void ${node.name}(${node.params
          .map((p) => `${typeMap.get(p) || "auto"} ${p}`)
          .join(", ")}) {\n${node.body
          .map((stmt) => "  " + generateWithTypes(stmt))
          .join("\n")}\n}`;

      case "VariableDeclaration":
        const varType = typeMap.get(node.name) || "auto";
        if (varType.startsWith("map<")) {
          const mapLines: string[] = [];
          if (node.value.type === "ArrayExpression") {
            node.value.elements.forEach((el) => {
              if (el.type === "ArrayKeyValue") {
                const key =
                  el.key.type === "Identifier"
                    ? `"${el.key.name}"`
                    : generateWithTypes(el.key);
                const value = generateWithTypes(el.value);
                mapLines.push(`${node.name}.insert({${key}, ${value}});`);
              }
            });
          }
          return `${varType} ${node.name};\n${mapLines.join("\n")}`;
        }
        return `${varType} ${node.name} = ${generateWithTypes(node.value)};`;

      case "ExpressionStatement":
        if (
          node.expression.type === "BinaryExpression" &&
          node.expression.operator === "="
        ) {
          const left = node.expression.left;
          if (left.type === "Identifier") {
            const varName = left.name;
            const varType = typeMap.get(varName);
            const rightCode = generateWithTypes(node.expression.right);
            if (varType) {
              return `${varName} = ${rightCode};`;
            } else {
              const inferredType = inferType(node.expression.right, typeMap);
              typeMap.set(varName, inferredType);
              if (inferredType.startsWith("map<")) {
                // Generar inserts para objetos literales
                const mapLines: string[] = [];
                if (node.expression.right.type === "ArrayExpression") {
                  node.expression.right.elements.forEach((el) => {
                    if (el.type === "ArrayKeyValue") {
                      const key =
                        el.key.type === "Identifier"
                          ? `"${el.key.name}"`
                          : generateWithTypes(el.key);
                      const value = generateWithTypes(el.value);
                      mapLines.push(`${varName}.insert({${key}, ${value}});`);
                    }
                  });
                }
                return `${inferredType} ${varName};\n${mapLines.join("\n")}`;
              } else {
                return `${inferredType} ${varName} = ${rightCode};`;
              }
            }
          }
        }
        return `${generateWithTypes(node.expression)};`;

      case "CallExpression":
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "console" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "log"
        ) {
          return `cout << ${node.arguments
            .map((arg) => generateForCout(arg, typeMap))
            .join(" << ")} << endl`;
        }
        if (node.callee.type === "Identifier" && node.callee.name === "print") {
          return `cout << ${node.arguments
            .map((arg) => generateForCout(arg, typeMap))
            .join(" << ")} << endl`;
        }
        return `${generateWithTypes(node.callee)}(${node.arguments
          .map(generateWithTypes)
          .join(", ")})`;

      case "ArrayExpression":
        const arrayType = inferType(node, typeMap);
        const elements = node.elements.map(generateWithTypes).join(", ");
        return `${arrayType}{${elements}}`;

      case "MemberExpression":
        const objType = inferType(node.object, typeMap);
        if (node.computed && objType.startsWith("map<")) {
          return `${generateWithTypes(node.object)}[${generateWithTypes(
            node.property
          )}]`;
        } else if (node.computed) {
          return `${generateWithTypes(node.object)}[${generateWithTypes(
            node.property
          )}]`;
        } else {
          return `${generateWithTypes(node.object)}.${generateWithTypes(
            node.property
          )}`;
        }

      // Casos agregados para evitar [NO SOPORTADO]
      case "Literal":
        if (typeof node.value === "string") {
          if (node.value.length === 1) {
            return `'${node.value}'`; // Para char
          } else {
            return `"${node.value}"`; // Para string
          }
        }
        if (typeof node.value === "boolean")
          return node.value ? "true" : "false";
        return String(node.value);

      case "Identifier":
        return node.name;

      case "BinaryExpression":
        const operatorMap: { [key: string]: string } = {
          "===": "==",
          "!==": "!=",
          // ...
        };
        const op = operatorMap[node.operator] || node.operator;
        return `${generateWithTypes(node.left)} ${op} ${generateWithTypes(
          node.right
        )}`;

      case "UnaryExpression":
        return `${node.operator}${generateWithTypes(node.argument)}`;

      case "IfStatement": {
        let code = `if (${generateWithTypes(node.test)}) {\n`;
        code += node.consequent
          .map((s) => "  " + generateWithTypes(s))
          .join("\n");
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
              .join("\n")}\n}\n`;
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
            node.body.map((s) => "  " + generateWithTypes(s)).join("\n") +
            "\n}\n"
          );
        }
        return "// [NO SOPORTADO: for]\n";
      }

      case "DoWhileStatement":
        return (
          `do {\n` +
          node.body.map((s) => "  " + generateWithTypes(s)).join("\n") +
          `\n} while (${generateWithTypes(node.test)});\n`
        );

      case "TryStatement": {
        let code = "try {\n";
        code += node.block.map((s) => "  " + generateWithTypes(s)).join("\n");
        code += "\n}\n";
        if (node.handler) {
          code += `catch (std::exception ${node.handler.param.name}) {\n`;
          // Reemplazar el param name con .what() en el body
          const paramName = node.handler.param.name;
          code += node.handler.body
            .map(
              (s) =>
                "  " +
                generateWithTypes(s).replace(
                  new RegExp(`\\b${paramName}\\b`, "g"),
                  `${paramName}.what()`
                )
            )
            .join("\n");
          code += "\n}\n";
        }
        if (node.finalizer) {
          code += "// Finally no existe en C++\n";
          // code += "// Simulación de finally (no garantizado):\n";
          // code +=
          //   node.finalizer.map((s) => generateWithTypes(s)).join("\n") + "\n";
        }
        return code;
      }

      case "SwitchStatement": {
        let code = `switch (${generateWithTypes(node.discriminant)}) {\n`;
        node.cases.forEach((switchCase) => {
          if (switchCase.test === null) {
            code += `  default:\n`;
          } else {
            code += `  case ${generateWithTypes(switchCase.test)}:\n`;
          }
          switchCase.consequent.forEach((stmt) => {
            code += `    ${generateWithTypes(stmt)}\n`;
          });
          // Agregar break automáticamente para cada caso (común en Java)
          code += `    break;\n`;
        });
        // Manejar defaultCase si existe (por si no está en cases)
        if (node.defaultCase) {
          code += `  default:\n`;
          node.defaultCase.forEach((stmt) => {
            code += `    ${generateWithTypes(stmt)}\n`;
          });
          code += `    break;\n`;
        }
        code += `}\n`;
        return code;
      }

      default:
        return "// [NO SOPORTADO]\n";
    }
  }

  return generateWithTypes(node);
}
