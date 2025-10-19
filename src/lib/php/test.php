<?php
// Comentario de línea
/* Comentario de bloque */

// FUNCION
function suma($a, $b) {
    $resultado = $a + $b;
    return $resultado;
}

// USAR FUNCION
$x = 5;
$y = suma($x, 10);

// IF ELSEIF ELSE
if ($y > 10) {
    echo "Mayor a 10";
} elseif ($y == 10) {
    echo "Es igual a 10";
} else {
    echo "Menor a 10";
}

// WHILE
while ($x > 0) {
    echo $x;
    $x--;
}

// DO WHILE
do {
    $x++;
    echo $x;
} while ($x < 3);

// FOR
for ($i = 0; $i < 3; $i++) {
    echo $i;
}

// FOR CON INCREMENTO PERSONALIZADO
for ($i = 0; $i < 3; $i+=2) {
    echo $i;
}

// TRY CATCH FINALLY
try {
    $z = $y / 0;
} catch (Exception $e) {
    echo e;
} finally {
    echo "Bloque finally";
}

// EXPRESIONES BOOLEANAS
$activo = true;
$inactivo = false;

// INCREMENTO / DECREMENTO
$contador = 0;
$contador++;
$contador--;


// ARREGLOS
$arr = array(0, "azul", 34);
$arr[2];
echo $arr[2];
$frutas = array("Manzana", "Naranja", "Mango");
echo $frutas[1];

// ARREGLOS ASOCIATIVOS
$persona = [
    "nombre" => "Daniel",
    "edad" => 22,
    "ciudad" => "México"
];
echo $persona["nombre"];
echo $persona["edad"];

$mixto = [
    0 => "cero",
    "uno" => 1,
    2 => "dos"
];
echo $mixto[0];
echo $mixto["uno"];

// SWITCH CASE
$dia = "lunes";
switch ($dia) {
    case "lunes":
        echo "Hoy es lunes";
        break;
    case "martes":
        echo "Hoy es martes";
        break;
    case "miércoles":
        echo "Hoy es miércoles";
        break;
    case "jueves":
        echo "Hoy es jueves";
        break;
    case "viernes":
        echo "Hoy es viernes";
        break;
    case "sábado":
        echo "Hoy es sábado";
        break;
    case "domingo":
        echo "Hoy es domingo";
        break;
    default:
        echo "Día inválido";
        break;
}


// CLASES
class Persona {
    public function __construct($nombre, $edad) {
        $this->nombre = $nombre;
        $this->edad = $edad;
    }
    
    public function saludar() {
        return "Hola, soy " . $this->nombre;
    }
}
?>
