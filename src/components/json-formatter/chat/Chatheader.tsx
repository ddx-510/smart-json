import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChatMessage } from '../types';
import { Trash2 } from "lucide-react";

interface ChatHeaderProps {
  chatHistory: ChatMessage[];
  onClearChat: () => void;
}

export function ChatHeader({ chatHistory, onClearChat }: ChatHeaderProps) {
  return (
    <DialogHeader className="flex flex-row justify-between items-center pb-4 border-b">
      <DialogTitle className="text-lg font-semibold">Chat with your JSON</DialogTitle>
      {chatHistory.length > 0 && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClearChat}
          className="text-xs hover:bg-red-50 hover:text-red-600 transition-colors mr-4"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Clear Chat
        </Button>
      )}
    </DialogHeader>
  );
}