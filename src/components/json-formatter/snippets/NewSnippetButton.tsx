import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewSnippetButtonProps {
  onCreateNew: () => void;
}

export function NewSnippetButton({ onCreateNew }: NewSnippetButtonProps) {
  return (
    <div className="flex p-2 border-b">
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full"
        onClick={onCreateNew}
      >
        <Plus className="h-4 w-4 mr-1" />
        New Snippet
      </Button>
    </div>
  );
}