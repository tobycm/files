import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import Database from "bun:sqlite";
import { Elysia, t } from "elysia";
import { TobyFile } from "./models";
import setupDatabase from "./setup";
import { startup } from "./startup";
import { databasePath } from "./utils";

if (!(await Bun.file(databasePath).exists())) await setupDatabase();

await startup();

// db should be ready
const db = new Database(databasePath);

const corsOrigin = process.env.CORS_ORIGIN || "*"; // Default to allow all origins

const authorizedKeys = process.env.AUTHORIZED_KEYS?.split(",") || [];

const filesFolder = process.env.FILES_FOLDER || "../files";

const insertQuery = db.query("INSERT INTO pending_files (title, event_date, file_name, last_modified, description) VALUES (?, ?, ?, ?, ?)");

const rejectFile = db.query("DELETE FROM pending_files WHERE id = ?");

const approveFile = db.transaction((id) => {
  db.run(
    `INSERT INTO files (title, event_date, file_name, last_modified, description)
SELECT title, event_date, file_name, last_modified, description FROM pending_files WHERE id = ?;`,
    [id],
  );
  db.run("DELETE FROM pending_files WHERE id = ?;", [id]);
});

const app = new Elysia()
  .use(cors({ origin: corsOrigin }))
  .use(
    swagger({
      documentation: {
        info: {
          title: "Toby Files API",
          description: "API documentation for Toby Files",
          version: "1.0.0",
        },
      },
    }),
  )
  .get("/", () => "Hello Elysia and Toby Files!")
  .get("/favicon.ico", () => Bun.file("./assets/favicon.ico"))

  .get("/files", () => {
    const query = db.query("SELECT * FROM files");

    return query.all();
  })

  .post(
    "/file/new",
    async ({ body }) => {
      const extension = body.file.name.split(".")[1];
      const fileName = Bun.randomUUIDv7();

      const file = Bun.file(`${filesFolder}/${fileName}.${extension}`);
      await file.write(await body.file.bytes());

      return insertQuery.all(body.title, body.event_date || null, `${fileName}.${extension}`, Date.now(), body.description || null);
    },
    {
      body: t.Object({
        title: t.String(),
        event_date: t.Optional(t.Number()),
        description: t.Optional(t.String()),

        file: t.File(),
      }),
    },
  )

  .guard({
    beforeHandle({ headers, status }) {
      if (!authorizedKeys.includes(headers["authorization"]?.replace("Bearer ", "") || "")) {
        return status(401);
      }
    },
  })

  .get("/pending", () => {
    const query = db.query("SELECT * FROM pending_files");

    return query.all();
  })

  .get(
    "/file/:id/approve",
    ({ params }) => {
      return approveFile(params.id);
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
    },
  )

  .get(
    "/file/:id/reject",
    async ({ params }) => {
      const selectFile = db.query<TobyFile, number>("SELECT * FROM pending_files WHERE id = ?");
      const file = selectFile.all(params.id)[0]?.file_name;
      if (file) {
        await Bun.file(`${filesFolder}/${file}`).delete();
      }

      return rejectFile.all(params.id);
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
    },
  )

  .listen(3463);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);

export type TobyFilesAPI = typeof app;
