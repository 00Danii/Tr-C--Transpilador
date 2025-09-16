import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import React from "react";

interface Props {
  title: string;
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
}: Props) {
  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className={`px-6 py-4 border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full bg-gradient-to-r ${languageGradient} animate-pulse`}
            />
            <span className="font-bold text-card-foreground">{title}</span>
            <Badge
              variant="secondary"
              className={`bg-gradient-to-r ${languageGradient} text-white border-0 shadow-lg`}
            >
              {languageLabel}
            </Badge>
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
      <CardContent className="p-0">
        <div className="relative">
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            readOnly={readOnly}
            className="min-h-[500px] font-mono text-sm resize-none border-0 focus-visible:ring-0 bg-background/50 backdrop-blur-sm p-6 leading-relaxed"
          />
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
