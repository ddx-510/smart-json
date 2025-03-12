'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JsonSummarizerProps {
  jsonContent: string;
}

export function JsonSummarizer({ jsonContent }: JsonSummarizerProps) {
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);

  const summarizeJSON = async () => {
    if (!jsonContent || isSummarizing) return;
    
    try {
      setIsSummarizing(true);
      
      // Call the DeFi API for summarization
      const response = await fetch('https://api.dify.ai/v1/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY' // Replace with your actual API key
        },
        body: JSON.stringify({ 
          content: jsonContent,
          max_length: 300, // Adjust parameters as needed
          focus_on: 'key_metrics,entities,relationships' // Customize focus areas
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error summarizing JSON:', error);
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button 
          onClick={summarizeJSON} 
          disabled={!jsonContent || isSummarizing}
          variant="outline"
        >
          {isSummarizing ? "Summarizing..." : "Summarize JSON"}
        </Button>
      </div>
      
      {summary && (
        <Card className="mb-4 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">JSON Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{summary}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}