import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface SidebarHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}

export function SidebarHeader({ isOpen, onToggle, onRefresh }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b">
      {isOpen && (
        <div className="flex items-center">
          <h3 className="font-medium">Saved Snippets</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 ml-1"
            onClick={onRefresh}
            title="Refresh snippets"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      )}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 ml-auto"
        onClick={onToggle}
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}