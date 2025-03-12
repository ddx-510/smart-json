import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a unique identifier for the JSON content
export function generateJsonId(jsonContent: string): string {
  // Create a hash from the first 1000 chars of JSON content
  // This is a simple way to create a unique ID for each JSON snippet
  return btoa(jsonContent.substring(0, 1000)).replace(/[+/=]/g, '');
}