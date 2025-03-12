import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Edit, Trash, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SavedSnippet } from "../SnippetsSidebar";

interface SnippetsListProps {
  snippets: SavedSnippet[];
  activeSnippetId: string | null;
  editingId: string | null;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onRenameStart: (id: string, currentName: string) => void;
  onRenameSave: () => void;
  onRenameCancel: () => void;
  onLoadSnippet: (snippet: SavedSnippet) => void;
  onDeleteSnippet: (id: string) => void;
}

export function SnippetsList({
  snippets,
  activeSnippetId,
  editingId,
  editingName,
  onEditingNameChange,
  onRenameStart,
  onRenameSave,
  onRenameCancel,
  onLoadSnippet,
  onDeleteSnippet
}: SnippetsListProps) {
  return (
    <ul className="py-2">
      {snippets
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((snippet) => (
          <li 
            key={snippet.id}
            className={cn(
              "px-3 py-2 hover:bg-muted/50 cursor-pointer group",
              activeSnippetId === snippet.id && "bg-muted"
            )}
          >
            <div className="flex items-center justify-between">
              {editingId === snippet.id ? (
                <div className="flex items-center w-full gap-1">
                  <Input
                    value={editingName}
                    onChange={(e) => onEditingNameChange(e.target.value)}
                    className="h-7 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onRenameSave();
                      if (e.key === 'Escape') onRenameCancel();
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={onRenameSave}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={onRenameCancel}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <span 
                    className="truncate flex-1"
                    onClick={() => onLoadSnippet(snippet)}
                  >
                    {snippet.name}
                    <div className="text-xs text-muted-foreground mt-1">
                        {new Date(snippet.updatedAt).toLocaleDateString()}
                    </div>
                  </span>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRenameStart(snippet.id, snippet.name);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSnippet(snippet.id);
                      }}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </li>
        ))}
    </ul>
  );
}