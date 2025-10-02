# TR-C Transpilador

¡Pruébalo en línea! [TR-C Transpilador](https://tr-c-transpilador.vercel.app/)

---

## ¿Qué es TR-C Transpilador?

**TR-C Transpilador** es una herramienta web que permite convertir código entre **JavaScript, PHP y Python** de manera sencilla y rápida.  
Convierte estructuras básicas de un lenguaje a otro, facilitando el **aprendizaje** y la **migración de código**.

---

## Arquitectura

El proyecto está construido en varias capas principales:

- **Lexer (Analizador Léxico):**  
  Convierte el código fuente en una secuencia de tokens (palabras clave, identificadores, operadores, etc.).

- **Parser (Analizador Sintáctico):**  
  Toma los tokens y construye un **AST** (Árbol de Sintaxis Abstracta) que representa la estructura lógica del código.

- **AST (Abstract Syntax Tree):**  
  Representación intermedia, independiente del lenguaje, que describe la estructura y significado del código fuente.

- **Generadores de código:**  
  Cada lenguaje de salida tiene su propio generador que toma el AST y produce código en ese lenguaje.


## Diagrama arquitectónico
![Diagrama del transpilador](https://i.imgur.com/oSQbvtF.png)

## ¿Cómo funciona la transpilación?

1. **Lexer:**  
   El código fuente se tokeniza en unidades léxicas.

2. **Parser:**  
   Los tokens se analizan y se construye el AST.

3. **Generador:**  
   El AST se recorre y se genera el código en el lenguaje de destino.

### Ejemplo:

```js
// Entrada (JavaScript)
console.log("Hola mundo");
```

```python
# Salida (Python)
print("Hola mundo")
```

## ¿Cómo replicarlo localmente?

Clona el repositorio:
```bash
git clone https://github.com/00Danii/Tr-C--Transpilador
```

Instala dependencias con pnpm:
```bash
pnpm install
```

Inicia el servidor de desarrollo:
```bash
pnpm dev
```

Abre http://localhost:3000 en tu navegador.