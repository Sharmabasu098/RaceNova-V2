import { defineConfig } from "vite";

export default defineConfig({
  base: "/RaceNova-V2/",

  server: {
    host: true,
    port: 5173
  },

  build: {
    target: "es2022"
  }
});
