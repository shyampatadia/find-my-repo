import { useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { VoiceButton } from "./VoiceButton";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSubmit: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

export function SearchBar({
  onSubmit,
  loading = false,
  placeholder = "Where can I find verified cardiac care near Patna?",
  initialValue = "",
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim() && !loading) onSubmit(value.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "group flex items-center gap-2 rounded-2xl bg-surface p-2 pl-5 ring-1 ring-border shadow-card",
        "focus-within:ring-2 focus-within:ring-primary/40 focus-within:shadow-elevated transition-all",
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-muted-foreground" strokeWidth={2.25} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        className="min-w-0 flex-1 bg-transparent py-3 text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none disabled:opacity-50"
      />
      <VoiceButton
        onTranscript={(transcript) => {
          setValue(transcript);
          onSubmit(transcript);
        }}
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground",
          "transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Verifying</span>
          </>
        ) : (
          <span>Find care</span>
        )}
      </button>
    </form>
  );
}
