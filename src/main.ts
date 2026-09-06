import { RaceNovaEngine } from "./core/RaceNovaEngine";
import { MainMenu } from "./ui/MainMenu";

const app =
  document.getElementById(
    "app"
  );

if (!app) {

  throw new Error(
    "RaceNova: #app element not found."
  );
}

const engine =
  new RaceNovaEngine(
    app
  );

const mainMenu =
  new MainMenu(
    app,
    {
      onStartRace: () => {

        engine.start();

      }
    }
  );
