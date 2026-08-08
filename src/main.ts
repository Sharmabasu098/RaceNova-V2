import { RaceNovaEngine } from "./core/RaceNovaEngine";

const app = document.getElementById("app");

if (!app) {
  throw new Error("RaceNova: #app element not found.");
}

const engine = new RaceNovaEngine(app);

engine.start();
