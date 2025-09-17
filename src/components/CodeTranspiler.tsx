"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code2, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { LanguageSelector } from "./LanguajeSelector";
import { SwapButton } from "./SwapButton";
import { CodeArea } from "./CodeArea";
import { TranspileButton } from "./TranspileButton";
import { PROGRAMMING_LANGUAGES } from "@/lib/languajes";
import { transpileCode } from "@/lib/transpiler";

export function CodeTranspiler() {
  const [inputLanguage, setInputLanguage] = useState("javascript");
  const [outputLanguage, setOutputLanguage] = useState("python");
  const [inputCode, setInputCode] = useState("");
  const [outputCode, setOutputCode] = useState("");
  const [isTranspiling, setIsTranspiling] = useState(false);
  const [error, setError] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isTranspiling) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isTranspiling]);

  const handleSwapLanguages = () => {
    const tempLang = inputLanguage;
    const tempCode = inputCode;
    setInputLanguage(outputLanguage);
    setOutputLanguage(tempLang);
    setInputCode(outputCode);
    setOutputCode(tempCode);
  };

  const handleTranspile = async () => {
    if (!inputCode.trim()) {
      setError("Por favor, ingresa código para transpilar");
      return;
    }

    setIsTranspiling(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const transpiledCode = transpileCode(
        inputCode,
        inputLanguage,
        outputLanguage
      );
      setOutputCode(transpiledCode);

      toast.success("¡Transpilación exitosa!", {
        description: `Código convertido de ${getLanguageLabel(
          inputLanguage
        )} a ${getLanguageLabel(outputLanguage)}`,
      });
    } catch (err) {
      setError(
        "Error durante la transpilación. Por favor, verifica tu código."
      );
    } finally {
      setIsTranspiling(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!outputCode) return;

    try {
      await navigator.clipboard.writeText(outputCode);
      toast("¡Copiado!", {
        description: "Código copiado al portapapeles",
      });
    } catch (err) {
      toast.error("Error", {
        description: "No se pudo copiar el código",
      });
    }
  };

  const getLanguageLabel = (value: string) => {
    return (
      PROGRAMMING_LANGUAGES.find((lang) => lang.value === value)?.label || value
    );
  };

  const getLanguageColor = (value: string) => {
    return (
      PROGRAMMING_LANGUAGES.find((lang) => lang.value === value)?.color ||
      "bg-gray-500"
    );
  };

  const getLanguageGradient = (value: string) => {
    return (
      PROGRAMMING_LANGUAGES.find((lang) => lang.value === value)?.gradient ||
      "from-gray-400 to-gray-600"
    );
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 pb-12 space-y-8">
        <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardContent className="">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <LanguageSelector
                label="Lenguaje de origen"
                value={inputLanguage}
                onChange={setInputLanguage}
                languages={PROGRAMMING_LANGUAGES}
              />

              <SwapButton
                onClick={handleSwapLanguages}
                showAnimation={showAnimation}
              />

              {/* Output Language */}
              <LanguageSelector
                label="Lenguaje de destino"
                value={outputLanguage}
                onChange={setOutputLanguage}
                languages={PROGRAMMING_LANGUAGES}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <CodeArea
            title="Código de entrada"
            languageLabel={getLanguageLabel(inputLanguage)}
            languageGradient={getLanguageGradient(inputLanguage)}
            value={inputCode}
            onChange={setInputCode}
            icon={<Code2 className="h-5 w-5 text-primary/60" />}
            placeholder={`Escribe o pega tu código ${getLanguageLabel(
              inputLanguage
            )} aquí...`}
          >
            {!inputCode && (
              <div className="absolute inset-6 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-3 text-muted-foreground">
                  <Code2 className="h-12 w-12 mx-auto opacity-30" />
                  <p className="text-lg">Comienza escribiendo tu código aquí</p>
                </div>
              </div>
            )}
          </CodeArea>

          {/* Output Code Area */}
          <CodeArea
            title="Código transpilado"
            languageLabel={getLanguageLabel(outputLanguage)}
            languageGradient={getLanguageGradient(outputLanguage)}
            value={outputCode}
            readOnly
            showCopy={!!outputCode}
            onCopy={handleCopyToClipboard}
            icon={<Sparkles className="h-5 w-5 text-secondary/60" />}
            placeholder="El código transpilado aparecerá aquí mágicamente..."
          >
            {!outputCode && !isTranspiling && (
              <div className="absolute inset-6 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-3 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto opacity-30" />
                  <p className="text-lg">
                    Tu código transpilado aparecerá aquí
                  </p>
                </div>
              </div>
            )}
            {isTranspiling && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-primary">
                      Transpilando código...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Convirtiendo de {getLanguageLabel(inputLanguage)} a{" "}
                      {getLanguageLabel(outputLanguage)}
                    </p>
                  </div>
                  {showAnimation && (
                    <div className="flex justify-center">
                      <div className="code-flow text-2xl">{"</>"}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CodeArea>
        </div>

        {/* Error Display */}
        {error && (
          <Alert
            variant="destructive"
            className="border-0 bg-destructive/10 backdrop-blur-sm"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center">
          <TranspileButton
            inputLanguage={inputLanguage}
            outputLanguage={outputLanguage}
            isTranspiling={isTranspiling}
            onClick={handleTranspile}
            disabled={isTranspiling || !inputCode.trim()}
          >
            {isTranspiling ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3" />
                Transpilando ...
              </>
            ) : (
              <>Transpilar Código</>
            )}
          </TranspileButton>
        </div>
      </div>
    </div>
  );
}
