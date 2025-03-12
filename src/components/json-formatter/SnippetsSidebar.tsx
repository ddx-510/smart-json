import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Save, Trash, Plus, ChevronLeft, ChevronRight, 
  Edit, Check, X, FolderOpen, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loadSnippets, deleteSnippet, updateSnippet } from "@/lib/db";
import { SidebarHeader } from "@/components/json-formatter/snippets/SidebarHeader";
import { NewSnippetButton } from "@/components/json-formatter/snippets/NewSnippetButton";
import { SnippetsList } from "@/components/json-formatter/snippets/SnippetList";
import { EmptyState } from "@/components/json-formatter/snippets/EmptyState";
import { LoadingSpinner } from "@/components/json-formatter/snippets/LoadingSpinner";

export interface SavedSnippet {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface SnippetsSidebarProps {
  activeSnippetId: string | null;
  onLoadSnippet: (content: string, snippetId: string) => void;
  onCreateNew: () => void;
  refreshTrigger?: number;
}

export function SnippetsSidebar({ 
  activeSnippetId,
  onLoadSnippet,
  onCreateNew,
  refreshTrigger = 0
}: SnippetsSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [snippets, setSnippets] = useState<SavedSnippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch snippets that can be called from anywhere
  const fetchSnippets = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedSnippets = await loadSnippets();
      setSnippets(loadedSnippets);
    } catch (error) {
      console.error("Failed to load snippets from IndexedDB:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load snippets on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets, refreshTrigger]);

  const handleRenameStart = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleRenameSave = async () => {
    if (!editingId || !editingName.trim()) {
      setEditingId(null);
      return;
    }

    const snippetToUpdate = snippets.find(s => s.id === editingId);
    if (!snippetToUpdate) {
      setEditingId(null);
      return;
    }

    const updatedSnippet = { 
      ...snippetToUpdate, 
      name: editingName.trim(), 
      updatedAt: Date.now() 
    };

    try {
      await updateSnippet(updatedSnippet);
      setSnippets(prev => 
        prev.map(snippet => 
          snippet.id === editingId ? updatedSnippet : snippet
        )
      );
    } catch (error) {
      console.error("Failed to update snippet name:", error);
    }
    
    setEditingId(null);
  };

  const handleRenameCancel = () => {
    setEditingId(null);
  };

  const handleLoadSnippet = (snippet: SavedSnippet) => {
    setTimeout(() => {
      onLoadSnippet(snippet.content, snippet.id);
    }, 0);
  };

  const handleDeleteSnippet = async (id: string) => {
    try {
      await deleteSnippet(id);
      setSnippets(prev => prev.filter(snippet => snippet.id !== id));
    } catch (error) {
      console.error("Failed to delete snippet:", error);
    }
  };

  // Set CSS variable for the sidebar width
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width', 
      isOpen ? '16rem' : '3rem'
    );
  }, [isOpen]);

  return (
    <div className={cn(
      "h-full bg-background border-r transition-all duration-300 z-40",
      isOpen ? "w-64" : "w-12"
    )}>
      <div className="flex flex-col h-full">
        <SidebarHeader 
          isOpen={isOpen} 
          onToggle={() => setIsOpen(!isOpen)} 
          onRefresh={fetchSnippets} 
        />

        {isOpen && (
          <>
            <NewSnippetButton onCreateNew={onCreateNew} />

            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <LoadingSpinner />
              ) : snippets.length === 0 ? (
                <EmptyState />
              ) : (
                <SnippetsList 
                  snippets={snippets}
                  activeSnippetId={activeSnippetId}
                  editingId={editingId}
                  editingName={editingName}
                  onEditingNameChange={setEditingName}
                  onRenameStart={handleRenameStart}
                  onRenameSave={handleRenameSave}
                  onRenameCancel={handleRenameCancel}
                  onLoadSnippet={handleLoadSnippet}
                  onDeleteSnippet={handleDeleteSnippet}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}