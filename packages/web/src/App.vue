<template>
  <router-view />
</template>

<style>
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
  color: #1a1a1a;
  background: #fafafa;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: #0969da;
  text-decoration: none;
}

button {
  font-family: inherit;
}

input, select {
  font-family: inherit;
  font-size: inherit;
}
</style>
