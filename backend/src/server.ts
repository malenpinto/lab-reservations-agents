import { createApp } from "./app";
import { openPersistentDatabase } from "./db/database";

const database = openPersistentDatabase();
const server = createApp(database).listen(Number(process.env.PORT ?? 3000), () => {
  console.log(`API escuchando en http://localhost:${process.env.PORT ?? 3000}`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
