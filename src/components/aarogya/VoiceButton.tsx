import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Voice button — UI shell only.
 * Wire to OpenAI Whisper via /api/voice/transcribe when backend is live.
 * For now: simulates a 2s capture and emits a sample Hindi-translated query.
 */
export function VoiceButton({ onTranscript, disabled = false, className }: VoiceButtonProps) {
  const [recording, setRecording] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      onTranscript("रांची के पास आपातकालीन सी-सेक्शन");
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={recording ? "Listening..." : "Speak in any Indian language"}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-xl ring-1 ring-inset transition-all",
        recording
          ? "bg-destructive/10 text-destructive ring-destructive/30"
          : "bg-primary-soft text-primary ring-primary/20 hover:bg-primary/10",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {recording ? <MicOff className="size-5" /> : <Mic className="size-5" />}
      {recording && (
        <span className="absolute inset-0 -z-10 animate-ping rounded-xl bg-destructive/20" />
      )}
    </button>
  );
}
