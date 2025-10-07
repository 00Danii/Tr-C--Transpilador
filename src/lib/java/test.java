public class Main {
  public static void main(String[] args) {
    // comentarios
    /* 
      comentario de bloque
      1
      2
    */

    // DECLARACION DE VARIABLES
    int contador = 0;
    double promedio = 3.5;
    boolean activo = true;
    String mensaje = "mensaje";

    // PRINTLN
    System.out.println("Hola");

    // PRINT
    System.out.print("Adios");

    // IF ELSE-IF ELSE
    int x = 0;
    if(x >= 8) {
      System.out.println("if");
    } 
    else if (x == 5) {
      System.out.println("else if");
    } 
    else {
      System.out.println("else");
    }

    // DO-WHILE
    do {
      // cuerpo
      System.out.println("if");
      x++;
    } while (x);


    // FOR
    for (int i = 0; i < 10; i++) {
      System.out.println(i);
    }

    // FOR 
    for (int i = 0; i < 10; i += 2) {
      System.out.println(i);
    }

    // ARREGLOS
    int[] arr = {1, 2, 3};
    System.out.println(arr[0]);


    // TRY CATCH
    try {
      x = 1 / 0;
    } catch (Exception e) {
      System.out.println("Error");
    } finally {
      System.out.println("Fin");
    }
    
  }
}