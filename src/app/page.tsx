

import { CodeTranspiler } from "@/components/CodeTranspiler";
import { ToggleTheme } from "@/components/ToggleTheme";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header fijo */}
      <header className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <img
            src="/Tr-C.svg"
            alt="Logo CodeTranspiler"
            className="h-10 md:h-14 invert dark:invert-0"
          />

          <ToggleTheme />
          <ToggleTheme />
        </div>
      </header>

      <div className="pt-23">
        <CodeTranspiler />
      </div>
    </main>
  );
}
