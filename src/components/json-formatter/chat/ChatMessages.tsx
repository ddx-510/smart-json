import { forwardRef } from 'react';
import { ChatMessage } from '../types';
import { ChatMessageDisplay } from './ChatMessageDisplay';

interface ChatMessagesProps {
  chatHistory: ChatMessage[];
  streamingMessage: string;
  isLoading: boolean;
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  function ChatMessages({ chatHistory, streamingMessage, isLoading }, ref) {
    return (
      <div 
        ref={ref}
        className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[400px]"
      >
        {chatHistory.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Ask questions about your JSON data
          </p>
        ) : (
          chatHistory.map((msg, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-primary/10 ml-8' 
                  : 'bg-muted mr-8'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <ChatMessageDisplay content={msg.content} />
              )}
            </div>
          ))
        )}
        {streamingMessage && (
          <div className="bg-muted mr-8 p-3 rounded-lg">
            <ChatMessageDisplay content={streamingMessage} />
          </div>
        )}
        {isLoading && !streamingMessage && (
          <div className="bg-muted mr-8 p-3 rounded-lg">
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>
    );
  }
);