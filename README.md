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

## Inferencia de Tipos: De Lenguajes de Tipado Débil a Tipado Fuerte

Los lenguajes fuente — **JavaScript**, **PHP** y **Python** — son de **tipado débil o dinámico**, lo que significa que las variables no requieren una declaración de tipo explícita y pueden cambiar de tipo durante la ejecución.  

En cambio, los lenguajes destino — **Java** y **C++** — son de **tipado fuerte o estático**, por lo que los tipos deben declararse y mantenerse consistentes.

Para manejar esta transición, **TR-C Transpilador** implementa un sistema de **inferencia de tipos automática** dentro de los generadores de código para Java y C++.  
Este sistema analiza el **AST** y deduce el tipo más probable de cada variable con base en el contexto y los valores asignados.

---

### 1. Literales

| Tipo de valor | Ejemplo fuente | Tipo inferido en Java | Tipo inferido en C++ |
|----------------|----------------|------------------------|-----------------------|
| Cadena         | `"hola"`       | `String`               | `string`              |
| Carácter único | `"a"`          | `char`                 | `char`                |
| Entero         | `5`            | `int`                  | `int`                 |
| Decimal        | `5.5`          | `double`               | `double`              |
| Booleano       | `true` / `false` | `boolean`            | `bool`                |
| Nulo           | `null`          | `Object`              | `auto`                |

---

### 2. Expresiones Binarias

- **Concatenación:**  
  `"hola" + "mundo"` → `String` (si alguno de los operandos es cadena).

- **Operaciones Aritméticas:**  
  `5 + 3` → `int`  
  `5.0 + 3` → `double`

---

### 3. Arreglos y Objetos

| Estructura | Ejemplo fuente | Tipo inferido en Java | Tipo inferido en C++ |
|-------------|----------------|------------------------|-----------------------|
| Arreglo homogéneo | `[1, 2, 3]` | `int[]` | `vector<int>` |
| Arreglo mixto | `[1, "hola", true]` | `Object[]` | `vector<variant<int, string, bool>>` |
| Objeto literal | `{"key": "value"}` | `Map<String, Object>` | `map<string, variant<...>>` |

---

### 4. Funciones y Variables

- Se utiliza un **`typeMap`** para registrar los tipos inferidos durante la primera pasada del **AST**.  
- Las **variables sin declaración explícita** (como en Python o JavaScript) se declaran **implícitamente en su primera asignación**.  
- Si un tipo no puede inferirse con certeza, se asigna un **tipo genérico**:
  - `Object` en **Java**  
  - `auto` en **C++**

---

### Resultado

Esta inferencia automática garantiza que el **código generado sea válido y compilable** en lenguajes de tipado fuerte, **sin requerir anotaciones manuales** del usuario.

## Ejemplo de Inferencia Automática

### // Entrada (JavaScript - tipado débil)
```javascript
let x = 5;
let y = "hola";
let z = x + 1.5;
console.log(y + z);
```
### // Salida (Java - tipado fuerte)
```java
public class Main {
  public static void main(String[] args) {
    int x = 5;
    String y = "hola";
    double z = x + 1.5;
    System.out.println(y + z);
  }
}
```

### // Salida (C++ - tipado fuerte)
```cpp
#include <iostream>
#include <string>

using namespace std;

int main() {
  int x = 5;
  string y = "hola";
  double z = x + 1.5;
  cout << y << z << endl;
  return 0;
}
```
---

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