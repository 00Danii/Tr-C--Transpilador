import { CodeTranspiler } from "@/components/CodeTranspiler";
import { ToggleTheme } from "@/components/ToggleTheme";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header fijo */}
      <header className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <img
            src="/Tr-C.svg"
            alt="Logo CodeTranspiler"
            className="h-5 md:h-6 invert dark:invert-0"
          />
          <div className="flex items-center gap-2">
            {/* Botón de información */}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  className="p-2 rounded hover:bg-muted transition"
                  title="Información"
                  type="button"
                >
                  <Info className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sobre TR-C Transpilador</DialogTitle>
                  <DialogDescription>
                    <strong>TR-C Transpilador</strong> es una herramienta web
                    que convierte código entre <b>JavaScript</b>, <b>PHP</b> y{" "}
                    <b>Python</b>.
                    <b>
                      <br />
                      <br />
                      Convierte estructuras básicas como variables, funciones,
                      condicionales y bucles.
                      <br />
                      <br />
                      Utiliza un lexer, parser y generadores de código para cada
                      lenguaje.
                      <br />
                      <br />
                      El proceso es automático y educativo, ideal para aprender
                      sintaxis entre lenguajes.
                      <br />
                      <br />
                      ¿Cómo funciona?
                    </b>{" "}
                    El código fuente se analiza, se convierte a un AST (árbol de
                    sintaxis abstracta) y luego se genera el código en el
                    lenguaje de destino.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <ToggleTheme />
          </div>
        </div>
      </header>

      <div className="pt-23">
        <CodeTranspiler />
      </div>
    </main>
  );
}
