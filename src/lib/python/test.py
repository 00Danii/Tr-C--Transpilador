# Comentario de línea

# FUNCION
def suma(a, b):
    resultado = a + b
    return resultado

# Usar FUNCION
x = 5
y = suma(x, 10)

# IF ELIF ELSE
if y > 10:
    print("Mayor a 10")
elif y == 10:
    print("Es igual a 10")
else:
    print("Menor a 10")

# WHILE
while x > 0:
    print(x)
    x = x - 1

# FOR (x)
for i in range(3):
    print(i)

# FOR (x,y)
for i in range(1,5):
    print(i)

# FOR (x,y,z)
for i in range(1,5,2):
    print(i)

# TRY EXCEPT FINALLY
try:
    z = y / 0
except Exception as e:
    print("Error:", e)
finally:
    print("Finalizando...")

# FUNCION LAMBA
doble = lambda n: n * 2
print(doble(7))


# EXPRESION BOOLEANA
activo = True
inactivo = False

# NUMEROS NEGATIVOS
negativo = -42

# LISTAS
arr = [0,"azul", 34]
arr[2]
print(arreglo[4])

frutas = ["Manzana", "Naranja", "Mango"]
print(frutas[1])