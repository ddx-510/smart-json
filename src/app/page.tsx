'use client'

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Header } from "@/components/json-formatter/Header";
import { JsonInput } from "@/components/json-formatter/JsonInput";
import { JsonOutput } from "@/components/json-formatter/JsonOutput";
import { Footer } from "@/components/json-formatter/Footer";
import { SnippetsSidebar, SavedSnippet } from "@/components/json-formatter/SnippetsSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatButton } from "@/components/json-formatter/ChatButton";
import { createSnippet, updateSnippet, loadChatHistory, saveChatHistory, clearChatData, loadConversationId, saveConversationId } from "@/lib/db";

export default function Home() {
  const [unformattedText, setUnformattedText] = useState("");
  const [indentation, setIndentation] = useState(2);
  const [formattedText, setFormattedText] = useState("");
  const [error, setError] = useState("");
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [isNewSnippetDialogOpen, setIsNewSnippetDialogOpen] = useState(false);
  const [isUnsavedToSave, setIsUnsavedToSave] = useState(false);
  const [newSnippetName, setNewSnippetName] = useState("");
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const [activeSnippetContent, setActiveSnippetContent] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Format JSON when indentation changes or when text is updated (if autoFormat is enabled)
  useEffect(() => {
    if (autoFormat) {
      formatJSON();
    }
    
    // Check if we're editing a saved snippet and there are changes
    if (activeSnippetId && activeSnippetContent !== null) {
      setHasPendingChanges(activeSnippetContent !== unformattedText);
    }
  }, [unformattedText, indentation, activeSnippetId, activeSnippetContent, autoFormat]);

  const formatJSON = () => {
    try {
      if (!unformattedText.trim()) {
        setFormattedText("");
        setError("");
        return;
      }
      
      const parsedJSON = JSON.parse(unformattedText);
      const formatted = JSON.stringify(parsedJSON, null, indentation);
      setFormattedText(formatted);
      setError("");
    } catch (err) {
      console.log(err);
      setError("Invalid JSON input");
      setFormattedText("");
    }
  };

  const clearInput = () => {
    setUnformattedText("");
    setFormattedText("");
    setError("");
    setActiveSnippetId(null);
    setActiveSnippetContent(null);
  };

  const handleFormattedTextChange = (newText: string) => {
    setUnformattedText(newText);
    // The useEffect will automatically reformat
  };

  const handleLoadSnippet = (content: string, snippetId: string) => {
    setUnformattedText(content);
    setActiveSnippetId(snippetId);
    setActiveSnippetContent(content);
    setHasPendingChanges(false);
  };

  const handleSaveCurrentSnippet = async () => {
    if (!activeSnippetId) return;
    
    const updatedSnippet: Partial<SavedSnippet> & { id: string } = {
      id: activeSnippetId,
      content: unformattedText,
      updatedAt: Date.now()
    };
    
    try {
      await updateSnippet(updatedSnippet);
      setActiveSnippetContent(unformattedText);
      setHasPendingChanges(false);
      // Trigger a refresh of the sidebar
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to save snippet:", error);
    }
  };

  const handleCreateNewSnippet = async () => {
    if (!newSnippetName.trim()) return;
      
    const newSnippet: SavedSnippet = {
      id: Date.now().toString(),
      name: newSnippetName.trim(),
      content: isUnsavedToSave ? unformattedText : "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    try {
      await createSnippet(newSnippet);
      
      // Transfer chat history if we're saving unsaved content
      if (isUnsavedToSave) {
        // Load chat history from "unsaved" and save it to the new snippet
        const unsavedChatHistory = await loadChatHistory("unsaved");
        if (unsavedChatHistory && unsavedChatHistory.length > 0) {
          await saveChatHistory(newSnippet.id, unsavedChatHistory);
          // Clear the unsaved chat history
          await clearChatData("unsaved");
        }
        
        // Also transfer conversation ID if it exists
        const unsavedConversationId = await loadConversationId("unsaved");
        if (unsavedConversationId) {
          await saveConversationId(newSnippet.id, unsavedConversationId);
        }
      }
      
      setActiveSnippetId(newSnippet.id);
      setUnformattedText("");
      setActiveSnippetContent("");
      setNewSnippetName("");
      setIsNewSnippetDialogOpen(false);
      setHasPendingChanges(false);
      setIsUnsavedToSave(false);
      // Trigger a refresh of the sidebar
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to create new snippet:", error);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (activeSnippetId && hasPendingChanges) {
        handleSaveCurrentSnippet();
      } else if (unformattedText.trim() && !activeSnippetId) {
        setIsNewSnippetDialogOpen(true);
      }
    }
  }, [activeSnippetId, hasPendingChanges, unformattedText]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const toggleAutoFormat = useCallback(() => {
    setAutoFormat(prev => {
      const newValue = !prev;
      // If turning auto-format back on, immediately format the current content
      if (newValue) {
        setTimeout(formatJSON, 0);
      }
      return newValue;
    });
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-background to-muted/50">
      <div className="sticky top-0 h-screen flex-shrink-0" style={{ width: 'var(--sidebar-width, 16rem)' }}>
        <SnippetsSidebar 
          activeSnippetId={activeSnippetId}
          onLoadSnippet={handleLoadSnippet}
          onCreateNew={() => setIsNewSnippetDialogOpen(true)}
          refreshTrigger={refreshTrigger}
        />
      </div>
      
      <div className="flex-1 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <Header />
          
          <div className="flex items-center justify-between mb-4">
            {activeSnippetId && (
              <Button
                onClick={handleSaveCurrentSnippet}
                variant={hasPendingChanges ? "default" : "outline"}
                disabled={!hasPendingChanges}
              >
                {hasPendingChanges ? "Save Changes (Ctrl+S)" : "No Changes"}
              </Button>
            )}
          </div>

          <Card className="shadow-lg border-muted">
            <CardHeader className="pb-2">
              <CardTitle>Format & Validate JSON</CardTitle>
              <CardDescription>
                Paste your JSON, choose indentation, and get properly formatted output
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-6">
                <JsonInput 
                  unformattedText={unformattedText}
                  setUnformattedText={setUnformattedText}
                  indentation={indentation}
                  setIndentation={setIndentation}
                  formatJSON={formatJSON}
                  clearInput={clearInput}
                  error={error}
                  isActiveSnippet={activeSnippetId !== null}
                  onSaveAsNew={() => {
                    setIsNewSnippetDialogOpen(true);
                    setIsUnsavedToSave(true);
                  }}
                  autoFormat={autoFormat}
                  toggleAutoFormat={toggleAutoFormat}
                />
                
                <JsonOutput 
                  formattedText={formattedText} 
                  onTextChange={handleFormattedTextChange} 
                />
              </div>
            </CardContent>
          </Card>
          
          <Footer />
        </div>
      </div>
      
      <ChatButton 
        key={activeSnippetId}
        jsonContent={formattedText} 
        activeSnippetId={activeSnippetId} 
      />
      
      <Dialog open={isNewSnippetDialogOpen} onOpenChange={setIsNewSnippetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as New Snippet</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newSnippetName}
              onChange={(e) => setNewSnippetName(e.target.value)}
              placeholder="Snippet name"
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNewSnippet();
              }}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsNewSnippetDialogOpen(false);
                setIsUnsavedToSave(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateNewSnippet}
              disabled={!newSnippetName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}