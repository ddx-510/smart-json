import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Wand2, Save } from "lucide-react";
import React from "react";

interface JsonInputProps {
  unformattedText: string;
  setUnformattedText: (text: string) => void;
  indentation: number;
  setIndentation: (indentation: number) => void;
  formatJSON: () => void;
  clearInput: () => void;
  error: string;
  isActiveSnippet: boolean;
  onSaveAsNew: () => void;
  autoFormat: boolean;
  toggleAutoFormat: () => void;
}

export function JsonInput({
  unformattedText,
  setUnformattedText,
  indentation,
  setIndentation,
  formatJSON,
  clearInput,
  error,
  isActiveSnippet,
  onSaveAsNew,
  autoFormat,
  toggleAutoFormat,
}: JsonInputProps) {
  // Add state to track input history and current position
  const [inputHistory, setInputHistory] = React.useState<string[]>([]);
  const [historyPosition, setHistoryPosition] = React.useState(-1);

  // Update history when text changes
  React.useEffect(() => {
    // Only add to history if it's different from the last entry
    if (inputHistory.length === 0 || unformattedText !== inputHistory[inputHistory.length - 1]) {
      setInputHistory(prev => [...prev, unformattedText]);
      setHistoryPosition(prev => prev + 1);
    }
  }, [unformattedText, inputHistory]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Ctrl+Z (Undo)
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      if (historyPosition > 0) {
        const newPosition = historyPosition - 1;
        setHistoryPosition(newPosition);
        setUnformattedText(inputHistory[newPosition]);
      }
    }
  };

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">JSON Input</h3>
        <div className="flex items-center gap-2">
          {!isActiveSnippet && unformattedText.trim() && (
            <Button
              onClick={onSaveAsNew}
              size="sm"
              className="h-8"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          )}
          {!autoFormat && (
            <Button
              onClick={formatJSON}
              size="sm"
              className="h-8"
              disabled={!unformattedText.trim()}
            >
              <Wand2 className="h-4 w-4 mr-1" />
              Format
            </Button>
          )}
          <Button
            onClick={toggleAutoFormat}
            size="sm"
            className="h-8"
            variant={autoFormat ? "default" : "outline"}
          >
            <Wand2 className="h-4 w-4 mr-1" />
            {autoFormat ? "Auto Format: On" : "Auto Format: Off"}
          </Button>
          <Button
            onClick={clearInput}
            variant="outline"
            size="sm"
            className="h-8"
            disabled={!unformattedText}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      <Textarea
        value={unformattedText}
        onChange={(e) => setUnformattedText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste your JSON here..."
        className={`min-h-[350px] font-mono text-sm ${
          error ? "border-red-500 focus-visible:ring-red-500" : ""
        }`}
      />

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm">Indentation:</span>
        {[2, 4, 8].map((value) => (
          <Button
            key={value}
            onClick={() => setIndentation(value)}
            variant={indentation === value ? "default" : "outline"}
            size="sm"
            className="h-7 px-3"
          >
            {value} spaces
          </Button>
        ))}
      </div>
    </div>
  );
}