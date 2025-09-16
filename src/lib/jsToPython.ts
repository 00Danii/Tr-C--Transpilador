export function jsToPython(code: string): string {
  let pyCode = code;

  // Comentarios
  pyCode = pyCode.replace(/\/\/(.*)/g, "# $1");
  pyCode = pyCode.replace(/\/\*([\s\S]*?)\*\//g, (match, p1) =>
    p1
      .split("\n")
      .map((line: string) => `# ${line.trim()}`)
      .join("\n")
  );

  // Funciones
  pyCode = pyCode.replace(
    /function\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    (match, name, args) => `def ${name}(${args.replace(/,/g, ", ")}):`
  );

  // console.log
  pyCode = pyCode.replace(/console\.log\((.*?)\);?/g, "print($1)");

  // Variables
  pyCode = pyCode.replace(/\b(let|const|var)\s+(\w+)\s*=\s*(.*?);/g, "$2 = $3");

  // Operadores de comparación
  pyCode = pyCode.replace(/===/g, "==");
  pyCode = pyCode.replace(/!==/g, "!=");

  // Incrementos y decrementos
  pyCode = pyCode.replace(/(\w+)\s*\+\+/g, "$1 += 1");
  pyCode = pyCode.replace(/(\w+)\s*--/g, "$1 -= 1");

  // if, else if, else
  pyCode = pyCode.replace(/else if\s*\((.*?)\)\s*\{/g, "elif $1:");
  
  pyCode = pyCode.replace(/if\s*\((.*?)\)\s*\{/g, "if $1:");

  pyCode = pyCode.replace(/else\s*\{/g, "else:");

  // while
  pyCode = pyCode.replace(/while\s*\((.*?)\)\s*\{/g, "while $1:");

  // for clásico JS → for Python (mejorado)
  pyCode = pyCode.replace(
    /for\s*\(\s*(?:let|var)?\s*(\w+)\s*=\s*(\d+);\s*\1\s*<\s*(\d+);\s*\1\s*(?:\+\+|=\s*\1\s*\+\s*1)\s*\)\s*\{/g,
    "for $1 in range($2, $3):"
  );

  // Eliminar paréntesis de for y while que no se transformaron
  pyCode = pyCode.replace(
    /for\s*\((.*?)\)\s*\{/g,
    "# [NO SOPORTADO] for ($1):"
  );

  // Eliminar llaves de cierre
  pyCode = pyCode.replace(/\}/g, "");

  // Eliminar punto y coma
  pyCode = pyCode.replace(/;/g, "");

  // Indentación mejorada
  const originalLines = pyCode.split("\n");
  let indentLevel = 0;
  let resultLines: string[] = [];
  let blockLevels: number[] = [];

  for (let i = 0; i < originalLines.length; i++) {
    let line = originalLines[i].trim();

    // Detectar inicio de bloque por ":"
    if (line.endsWith(":") && !line.startsWith("#")) {
      // Si es elif o else, baja la indentación al nivel del último bloque padre
      if (/^(elif|else:)/.test(line)) {
        indentLevel =
          blockLevels.length > 0 ? blockLevels[blockLevels.length - 1] : 0;
      }
      resultLines.push("    ".repeat(indentLevel) + line);
      blockLevels.push(indentLevel);
      indentLevel++;
      continue;
    }

    // Si la línea es vacía o comentario, no indentar
    if (line === "" || line.startsWith("#")) {
      resultLines.push(line);
      continue;
    }

    // Si la línea está fuera de bloque, baja la indentación
    if (
      blockLevels.length > 0 &&
      !originalLines[i - 1]?.trim().endsWith(":") &&
      !/^(elif|else:)/.test(originalLines[i - 1]?.trim()) &&
      indentLevel > 0 &&
      (/^[a-zA-Z_]\w*\s*=/.test(line) ||
        /^while\s+/.test(line) ||
        /^for\s+/.test(line) ||
        /^print\(/.test(line))
    ) {
      indentLevel = blockLevels[0];
      blockLevels = [];
    }

    resultLines.push("    ".repeat(indentLevel) + line);
  }

  pyCode = resultLines.join("\n");

  // Limpiar prints vacíos redundantes
  pyCode = pyCode.replace(/print\(\s*\)/g, "print()");

  // Eliminar espacios en blanco al inicio y final
  pyCode = pyCode.trim();

  return pyCode;
}
