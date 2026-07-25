import { defineConfig } from "vite";

export default defineConfig({
  root: new URL(".", import.meta.url).pathname,
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: new URL("./index.html", import.meta.url).pathname,
        notFound: new URL("./404.html", import.meta.url).pathname,
      },
    },
  },
});

