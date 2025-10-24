// Comentario de línea
/* Comentario de bloque */

// DECLARACION DE FUNCION
function suma(a, b) {
  let resultado = a + b;
  return resultado;
}

// FUNCION FLECHA
const multiplicar = (x, y) => x * y;

// IF ELSE IF ELSE
let contador = 0;
if (contador === 0) {
  console.log("Contador en cero");
} else if (contador > 0) {
  console.log("Contador positivo");
} else {
  console.log("Contador negativo");
}

// WHILE
while (contador < 3) {
  console.log(contador);
  contador++;
}

// DO WHILE
do {
  contador--;
  console.log("do while:", contador);
} while (contador > 0);

// FOR
for (i = 0; i < 5; i++) {
  console.log("i =", i);
}

// TRY CATCH FINALLY
try {
  let x = 10 / 0;
} catch (e) {
  console.log("Capturado:", e);
} finally {
  console.log("Bloque finally");
}

// ARREGLOS
// Arreglo vacío
let vacio = [];

// Arreglo con valores
let numeros = [1, 2, 3, 4, 5];

// Arreglo con diferentes tipos de datos
let mixto = [42, "texto", true, null];

let colores = ["Rojo", "Verde"];

console.log(colores[1]);

// Objetos Lietarales
const persona = { nombre: "Nombre1", edad: 22, ciudad: "México" };
console.log(persona["edad"]);

// Objeto con Arrays
const data = {
  usuario: { nombre: "Nombre2", roles: ["admin", "editor"] },
  activo: true,
};

// Switch
dia = "lunes";
switch (dia) {
  case "lunes":
    console.log("Hoy es lunes");
    break;
  case "martes":
    console.log("Hoy es martes");
    break;
  case "miércoles":
    console.log("Hoy es miércoles");
    break;
  case "jueves":
    console.log("Hoy es jueves");
    break;
  case "viernes":
    console.log("Hoy es viernes");
    break;
  case "sábado":
    console.log("Hoy es sábado");
    break;
  case "domingo":
    console.log("Hoy es domingo");
    break;
  default:
    console.log("Día inválido");
    break;
}

// CLASES
class Persona {
  constructor(nombre, edad) {
    this.nombre = nombre;
    this.edad = edad;
  }

  saludar() {
    return "Hola soy " + this.nombre;
  }
}
