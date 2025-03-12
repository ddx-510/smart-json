'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { generateJsonId } from '@/lib/utils';
import { ChatHeader } from '@/components/json-formatter/chat/Chatheader';
import { ChatMessages } from '@/components/json-formatter/chat/ChatMessages';
import { ChatInput } from '@/components/json-formatter/chat/ChatInput';
import { useChatState } from '@/components/json-formatter/hooks/useChatState';
import { sendChatRequest } from '@/components/json-formatter/api/chatApi';

interface ChatButtonProps {
  jsonContent: string;
  activeSnippetId: string | null;
}

export function ChatButton({ jsonContent, activeSnippetId }: ChatButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Generate a fallback ID for non-saved JSON content
  const fallbackId = useRef(`unsaved`);
  
  // Use the activeSnippetId if available, otherwise use the fallback ID
  const currentId = activeSnippetId || fallbackId.current;
  
  // Update fallback ID when jsonContent changes and there's no activeSnippetId
  useEffect(() => {
    if (!activeSnippetId) {
      fallbackId.current = `unsaved`;
    }
  }, [jsonContent, activeSnippetId]);
  
  const {
    chatMessage,
    setChatMessage,
    chatHistory,
    setChatHistory,
    isLoading,
    setIsLoading,
    conversationId,
    setConversationId,
    streamingMessage,
    setStreamingMessage,
    clearChatHistory
  } = useChatState(currentId);
  
  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, streamingMessage]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsLoading(true);
    setStreamingMessage(""); // Reset streaming message
    
    try {
      const result = await sendChatRequest({
        jsonContent,
        chatMessage,
        conversationId,
        setStreamingMessage,
        setConversationId
      });
      
      if (result.message) {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: result.message,
          id: result.messageId
        }]);
        setStreamingMessage(""); // Reset streaming message
      }
    } catch (error) {
      console.error('Error in chat:', error);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      }]);
      setStreamingMessage("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsChatOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all"
          aria-label="Chat with JSON"
        >
          <MessageCircle size={24} />
        </button>
      </div>
      
      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col h-[600px]">
          <ChatHeader 
            chatHistory={chatHistory} 
            onClearChat={clearChatHistory} 
          />
          
          <ChatMessages 
            ref={chatContainerRef}
            chatHistory={chatHistory}
            streamingMessage={streamingMessage}
            isLoading={isLoading}
          />
          
          <ChatInput 
            chatMessage={chatMessage}
            setChatMessage={setChatMessage}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}