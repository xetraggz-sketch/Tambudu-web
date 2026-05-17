'use client';
import { ThemeProvider as Next } from 'next-themes';
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Next
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </Next>
  );
}
