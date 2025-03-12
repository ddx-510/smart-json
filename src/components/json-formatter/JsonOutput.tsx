import { Button } from "@/components/ui/button";
import { Check, Copy, Maximize } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from "next-themes";
import { useState } from "react";
import { FullscreenEditor } from "./FullscreenEditor";

interface JsonOutputProps {
  formattedText: string;
  onTextChange?: (text: string) => void;
}

export function JsonOutput({ formattedText, onTextChange }: JsonOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { theme } = useTheme();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(true);
  };

  return (
    <>
      {isFullScreen && (
        <FullscreenEditor
          initialText={formattedText}
          onClose={() => setIsFullScreen(false)}
          onSave={onTextChange}
        />
      )}
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Formatted JSON</h3>
          <div className="flex gap-2">
            <Button 
              onClick={toggleFullScreen}
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!formattedText}
            >
              <Maximize className="h-4 w-4 mr-1" />
              Fullscreen
            </Button>
            <Button 
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!formattedText}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="w-full h-[350px] overflow-auto border rounded bg-muted/30">
          {formattedText ? (
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{ 
                margin: 0, 
                height: '100%', 
                background: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
                fontSize: '0.875rem'
              }}
            >
              {formattedText}
            </SyntaxHighlighter>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Formatted output will appear here
            </div>
          )}
        </div>
      </div>
    </>
  );
}