import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

interface SwapButtonProps {
  onClick: () => void;
  showAnimation: boolean;
}

export function SwapButton({ onClick, showAnimation }: SwapButtonProps) {
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={onClick}
        className="h-16 w-16 rounded-full border-2 border-primary/20 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform hover:scale-110 bg-background/80 backdrop-blur-sm shadow-lg"
      >
        <ArrowLeftRight className="h-6 w-6" />
      </Button>
      {showAnimation && (
        <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping" />
      )}
    </div>
  );
}
