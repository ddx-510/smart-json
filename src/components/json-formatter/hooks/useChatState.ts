import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types';
import { saveChatHistory, loadChatHistory, saveConversationId, loadConversationId, clearChatData } from '@/lib/db';

export function useChatState(currentId: string) {
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  
  // Load chat history from IndexedDB when component mounts or when the snippet changes
  useEffect(() => {    
    const loadData = async () => {
      try {
        // Reset states first to ensure clean state
        setChatHistory([]);
        setConversationId("");
        
        // Load chat history
        const history = await loadChatHistory(currentId);
        setChatHistory(history);
        
        // Load conversation ID
        const convId = await loadConversationId(currentId);
        setConversationId(convId);
      } catch (error) {
        console.error('Error loading data from IndexedDB:', error);
      }
    };
    
    // Use setTimeout to ensure this runs after state updates
    setTimeout(() => {
      loadData();
    }, 0);
  }, [currentId]);
  
  // Save chat history to IndexedDB whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0 && currentId) {
      saveChatHistory(currentId, chatHistory);
    }
  }, [chatHistory, currentId]);
  
  // Save conversation ID to IndexedDB whenever it changes
  useEffect(() => {
    if (conversationId && currentId) {
      saveConversationId(currentId, conversationId);
    }
  }, [conversationId, currentId]);
  
  // Add a function to clear chat history
  const clearChatHistory = useCallback(async () => {
    setChatHistory([]);
    setConversationId("");
    await clearChatData(currentId);
  }, [currentId]);
  
  return {
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
  };
}