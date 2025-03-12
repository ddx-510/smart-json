import { FileJson } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export function Header() {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-8">
      <div className="flex items-center gap-2 mb-4 md:mb-0">
        <FileJson className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">JSON Formatter</h1>
      </div>
      <ModeToggle />
    </header>
  );
}