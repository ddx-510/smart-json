import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface ChatMessageDisplayProps {
  content: string;
}

export function ChatMessageDisplay({ content }: ChatMessageDisplayProps) {
  if (!content) return null;
  
  // Check if the content contains a thinking section
  const hasOpeningThinking = content.includes('<details');
  const hasClosingDetails = content.includes('</details>');
  
  // Extract thinking content and message based on whether we have complete or partial thinking section
  const { thinkingContent, actualMessage } = extractThinkingAndMessage(content, hasOpeningThinking, hasClosingDetails);
  
  return (
    <>
      {thinkingContent && (
        <ThinkingSection 
          content={thinkingContent} 
          isComplete={hasOpeningThinking && hasClosingDetails}
        />
      )}
      {actualMessage && (
        <div className="prose prose-slate dark:prose-invert prose-sm max-w-none animate-in fade-in-50 duration-300">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {actualMessage}
          </ReactMarkdown>
        </div>
      )}
    </>
  );
}

// Helper function to extract thinking content and actual message
function extractThinkingAndMessage(content: string, hasOpeningThinking: boolean, hasClosingDetails: boolean) {
  // Complete thinking section (has both opening and closing tags)
  if (hasOpeningThinking && hasClosingDetails) {
    const thinkingPattern = /<details.*?<summary>\s*Thinking\.{3}\s*<\/summary>([\s\S]*?)<\/details>/;
    const match = content.match(thinkingPattern);
    
    if (match) {
      return {
        thinkingContent: match[1].trim(),
        actualMessage: content.replace(match[0], '').trim()
      };
    }
  }
  
  // Partial thinking section (streaming response with opening but no closing tag yet)
  if (hasOpeningThinking && !hasClosingDetails) {
    const parts = content.split(/<details.*?<summary>\s*Thinking\.{3}\s*<\/summary>/);
    if (parts.length > 1) {
      return {
        thinkingContent: parts[1].trim(),
        actualMessage: parts[0].trim()
      };
    }
  }
  
  // No thinking section
  return {
    thinkingContent: null,
    actualMessage: content
  };
}

// Component for displaying the thinking section
function ThinkingSection({ content, isComplete }: { content: string, isComplete: boolean }) {
  return (
    <div className="mb-4">
      <Collapsible className="w-full" defaultOpen>
        <Card className="bg-slate-50/50 dark:bg-white border border-slate-200/70 dark:border-slate-300/70 shadow-sm overflow-hidden px-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-900 hover:bg-slate-100/70 dark:hover:bg-slate-100/70 transition-colors rounded-md">
            <div className="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`text-slate-500 dark:text-slate-700 ${!isComplete ? 'animate-pulse' : ''}`}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <span className="font-medium">Thinking process</span>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-slate-400 dark:text-slate-700"
            >
              <path d="m6 9 6 6 6-6"></path>
            </svg>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-3 pb-4 px-4">
              <div className="pl-4 border-l-2 border-slate-300 dark:border-slate-400 text-sm text-slate-600 dark:text-slate-800 space-y-3 overflow-auto max-h-[300px] leading-relaxed">
                {content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="whitespace-pre-wrap break-words">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}