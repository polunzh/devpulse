<template>
  <router-view />
</template>

<style>
:root {
  /* Primary: Coral Orange */
  --color-primary: #f97316;
  --color-primary-light: #fff7ed;
  --color-primary-dark: #c2410c;
  --color-primary-hover: #ea580c;

  /* Secondary: Indigo */
  --color-secondary: #6366f1;
  --color-secondary-light: #eef2ff;

  /* Accent: Emerald */
  --color-accent: #10b981;
  --color-accent-light: #ecfdf5;

  /* Semantic */
  --color-error: #ef4444;
  --color-error-bg: #fef2f2;
  --color-info: #3b82f6;
  --color-info-bg: #eff6ff;

  /* Neutrals (warm tinted) */
  --color-bg: #fffbf7;
  --color-surface: #ffffff;
  --color-border: #f0e6db;
  --color-border-light: #f7f0e8;
  --color-text: #292017;
  --color-text-secondary: #78716c;
  --color-text-muted: #a8a29e;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(41, 32, 23, 0.05);
  --shadow-md: 0 2px 8px rgba(41, 32, 23, 0.08);
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  color: var(--color-primary-dark);
}

button {
  font-family: inherit;
}

input, select {
  font-family: inherit;
  font-size: inherit;
}
</style>
