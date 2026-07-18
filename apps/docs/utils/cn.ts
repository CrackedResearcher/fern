import { twMerge } from "tailwind-merge"
import clsx, { type ClassValue } from "clsx"

/** Their ported layout imports this path; same implementation they use. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
