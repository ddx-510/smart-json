import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState, useEffect, useCallback } from "react";
import { Minimize, Save, Check } from "lucide-react";
import dynamic from 'next/dynamic';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  { ssr: false }
);

interface FullscreenEditorProps {
  initialText: string;
  onClose: () => void;
  onSave?: (text: string) => void;
}

export function FullscreenEditor({ initialText, onClose, onSave }: FullscreenEditorProps) {
  const [editableText, setEditableText] = useState(initialText);
  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const { theme } = useTheme();

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (onSave && hasChanges) {
        onSave(editableText);
        setHasChanges(false);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }
    }
    // Escape to exit
    if (e.key === 'Escape') {
      onClose();
    }
  }, [editableText, hasChanges, onClose, onSave]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleTextChange = (value: string | undefined) => {
    const newText = value || "";
    setEditableText(newText);
    setHasChanges(newText !== initialText);
    setJustSaved(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editableText);
      setHasChanges(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 p-4 bg-background">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Edit JSON</h3>
        <div className="flex gap-2">
          {onSave && (
            <Button 
              onClick={handleSave}
              variant={hasChanges ? "default" : "outline"}
              size="sm"
              className="h-8"
              disabled={!hasChanges && !justSaved}
            >
              {justSaved ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  {hasChanges ? "Save Changes" : "No Changes"}
                </>
              )}
            </Button>
          )}
          <Button 
            onClick={onClose}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <Minimize className="h-4 w-4 mr-1" />
            Exit Fullscreen
          </Button>
        </div>
      </div>
      
      <div className="w-full h-[calc(100vh-100px)] border rounded bg-muted/30">
        <MonacoEditor
          language="json"
          value={editableText}
          onChange={handleTextChange}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            automaticLayout: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
          }}
          className="h-full"
        />
      </div>
      
      <div className="mt-2 text-sm text-muted-foreground">
        <span>Keyboard shortcuts: </span>
        <kbd className="px-1 py-0.5 bg-muted border rounded text-xs">Ctrl+S</kbd>
        <span> to save, </span>
        <kbd className="px-1 py-0.5 bg-muted border rounded text-xs">Esc</kbd>
        <span> to exit</span>
      </div>
    </div>
  );
}