// server.js
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

// Importamos nuestros módulos (asegurate que estos archivos usen export/import también)
import socketSetup from "./src/socket/lobby.js";
import gameManager from "./src/socket/gameManager.js";

// Importamos las rutas
import routes from "./app/index.js";

// ES Modules: emular __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuración de archivos estáticos y vistas
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");

// Rutas
app.use("/", routes);

// Configuramos sockets
socketSetup(io);   // Eventos del lobby
gameManager(io);   // Eventos del juego

const PORT = 3000;
//const PORT = process.env.PORT || 3000; // Para poder usar Render
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Si necesitás exportar el io (opcional)
export { io };
