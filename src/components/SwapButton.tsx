import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

interface SwapButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function SwapButton({
  onClick,
  disabled,
}: SwapButtonProps) {
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={onClick}
        disabled={disabled}
        className="h-9 w-9 rounded-full border-2 border-primary/20 transition-all duration-300 transform hover:scale-110 bg-background/80 backdrop-blur-sm shadow-lg"
      >
        <ArrowLeftRight className="h-6 w-6" />
      </Button>
    </div>
  );
}
