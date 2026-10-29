import { leerConfig } from "./infrastructure/config/env.js";
import { crearCasosDeUso, crearDependencias } from "./infrastructure/container.js";
import { crearApp } from "./infrastructure/http/app.js";

const config = leerConfig();
const app = crearApp(crearCasosDeUso(crearDependencias(config)), config.cookies);

app.listen(config.puerto, () => {
  console.log(
    `API listening on http://localhost:${config.puerto} (persistencia: ${config.persistencia})`,
  );
});
