import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import React from "react";
import { useTheme } from "next-themes";
import CodeMirror from "@uiw/react-codemirror";
import { materialInit } from "@uiw/codemirror-theme-material";
import { xcodeLight } from "@uiw/codemirror-theme-xcode";

import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { php } from "@codemirror/lang-php";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

interface Props {
  title: React.ReactNode;
  languageLabel: string;
  languageGradient: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  showCopy?: boolean;
  onCopy?: () => void;
  icon?: React.ReactNode;
  placeholder?: string;
  isTranspiling?: boolean;
  children?: React.ReactNode;
  swapButton?: React.ReactNode;
}

export function CodeArea({
  title,
  languageLabel,
  languageGradient,
  value,
  onChange,
  readOnly,
  showCopy,
  onCopy,
  icon,
  placeholder,
  children,
  swapButton,
}: Props) {
  // Selecciona el lenguaje para CodeMirror
  const getLanguageExtension = () => {
    switch (languageLabel.toLowerCase()) {
      case "python":
        return python();
      case "javascript":
      case "typescript":
        return javascript();
      case "php":
        return php();
      case "java":
        return java();
      case "c++":
        return cpp();
      default:
        return javascript();
    }
  };

  const { theme } = useTheme();
  // Selecciona el tema de CodeMirror según el tema actual
  // Alterna el fondo y el tema según el modo
  const codeMirrorTheme =
    theme === "dark" || theme === "system"
      ? materialInit({
          settings: {
            caret: "#ffffff",
            background: "#151518",
            gutterBackground: "#151518",
          },
        })
      : xcodeLight;

  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className={`px-6 pb-4 border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-nowrap">
            {swapButton}
            <div
              className={`w-3 h-3 rounded-full bg-gradient-to-r ${languageGradient} animate-pulse`}
            />
            {title}
          </div>
          <div className="flex items-center gap-2">
            {showCopy && onCopy && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                className="h-8 px-3 hover:bg-primary/10"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
            )}
            {icon}
          </div>
        </div>
      </div>
      <CardContent className="p-0 h-110">
        <div className="relative">
          <CodeMirror
            value={value}
            height="450px"
            theme={codeMirrorTheme}
            extensions={[getLanguageExtension()]}
            readOnly={!!readOnly}
            onChange={(val) => onChange?.(val)}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
              highlightActiveLine: true,
            }}
            style={{
              fontSize: "17px",
              fontFamily: "Fira Mono, Menlo, Monaco, 'Courier New', monospace",
            }}
            placeholder={placeholder}
          />
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
