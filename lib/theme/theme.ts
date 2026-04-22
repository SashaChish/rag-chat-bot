import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'violet',
  colors: {
    violet: [
      '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc',
      '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87',
    ],
  },
  fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  defaultRadius: 'md',
  white: '#f9fafb',
  black: '#111827',
});
