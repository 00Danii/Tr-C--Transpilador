import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Language {
  value: string;
  label: string;
  gradient: string;
}

interface LanguageSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  languages: Language[];
}

export function LanguageSelector({
  label,
  value,
  onChange,
  languages,
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-4 w-full">
      <label className="text-sm font-semibold text-card-foreground uppercase tracking-wide">
        {label}
      </label>
      <div className="flex-1">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="text-lg border-2 hover:border-primary/50 transition-colors bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value} className="py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full bg-gradient-to-r ${lang.gradient}`}
                  />
                  <span className="font-medium">{lang.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}