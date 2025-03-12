import { FolderOpen } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
      <FolderOpen className="h-8 w-8 mb-2" />
      <p>No saved snippets yet</p>
      <p className="text-sm">Save your JSON for quick access later</p>
    </div>
  );
}