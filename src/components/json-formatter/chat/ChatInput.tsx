import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon } from "lucide-react";

interface ChatInputProps {
  chatMessage: string;
  setChatMessage: (message: string) => void;
  isLoading: boolean;
  onSendMessage: () => void;
}

export function ChatInput({ 
  chatMessage, 
  setChatMessage, 
  isLoading, 
  onSendMessage 
}: ChatInputProps) {
  return (
    <div className="flex gap-2 pt-2 relative">
      <Textarea
        value={chatMessage}
        onChange={(e) => setChatMessage(e.target.value)}
        placeholder="Ask something about your JSON..."
        className="min-h-[60px] pr-12 resize-none focus:ring-2 focus:ring-primary/50 max-h-[80px] overflow-auto"
        disabled={isLoading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
          }
        }}
      />
      <Button 
        onClick={onSendMessage} 
        className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full"
        disabled={!chatMessage.trim() || isLoading}
        aria-label="Send message"
      >
        {isLoading ? (
          <span className="animate-pulse">...</span>
        ) : (
          <SendIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}