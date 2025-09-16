import { Button } from "@/components/ui/button";
import { PROGRAMMING_LANGUAGES } from "@/lib/languajes";
import { ReactNode } from "react";

interface Props {
  inputLanguage: string;
  outputLanguage: string;
  isTranspiling: boolean;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}

export function TranspileButton({
  inputLanguage,
  outputLanguage,
  isTranspiling,
  onClick,
  disabled,
  children,
}: Props) {
  const fromColor = (PROGRAMMING_LANGUAGES.find(
    (lang) => lang.value === inputLanguage
  )?.gradient.match(/from-[\w-]+/) || ["from-gray-400"])[0];
  const toColor = (PROGRAMMING_LANGUAGES.find(
    (lang) => lang.value === outputLanguage
  )?.gradient.match(/to-[\w-]+/) || ["to-gray-600"])[0];

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="lg"
      className={`px-12 py-6 text-xl font-bold rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 ${
        isTranspiling ? "pulse-glow" : ""
      } border-0 bg-gradient-to-r ${fromColor} ${toColor}`}
    >
      {children}
    </Button>
  );
}
