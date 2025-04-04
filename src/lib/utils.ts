
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge class names with Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 * 
 * @param inputs - Class values to be merged
 * @returns - Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a delay using a Promise
 * Useful for animations and sequential operations
 * 
 * @param ms - Milliseconds to delay
 * @returns - Promise that resolves after the specified delay
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Formats a number with comma separators for thousands
 * 
 * @param num - Number to format
 * @returns - Formatted number string with commas
 */
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Truncates a string to a specified length and adds ellipsis if needed
 * 
 * @param str - String to truncate
 * @param length - Maximum length before truncation
 * @returns - Truncated string with ellipsis if shortened
 */
export const truncateString = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
};

/**
 * Generates a random ID with a specified prefix
 * 
 * @param prefix - Optional prefix for the ID
 * @returns - Random ID string
 */
export const generateId = (prefix = 'id'): string => {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
};
