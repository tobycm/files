import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import Database from "bun:sqlite";
import { Elysia, t } from "elysia";
import { TobyFile } from "./models";
import setupDatabase from "./setup";
import { startup } from "./startup";
import { databasePath, generateThumbnail } from "./utils";

if (!(await Bun.file(databasePath).exists())) await setupDatabase();

await startup();

// db should be ready
const db = new Database(databasePath);

const corsOrigin = process.env.CORS_ORIGIN || "*"; // Default to allow all origins

const authorizedKeys = process.env.AUTHORIZED_KEYS?.split(",") || [];

const filesFolder = process.env.FILES_FOLDER || "../files";

const selectAllFilesQuery = db.query<TobyFile, null>("SELECT * FROM files");
const selectAllFileIdsQuery = db.query<{ id: number }, null>("SELECT id FROM files");
const selectFileIdsByOffsetQuery = db.query<{ id: number }, number>("SELECT id FROM files LIMIT 20 OFFSET ?");
const selectFileByIdQuery = db.query<TobyFile, number>("SELECT * FROM files WHERE id = ?");
const selectAllPendingFilesQuery = db.query<TobyFile, null>("SELECT * FROM pending_files");
const selectPendingFileByIdQuery = db.query<TobyFile, number>("SELECT * FROM pending_files WHERE id = ?");

const insertPendingFileQuery = db.query(
  "INSERT INTO pending_files (title, event_date, file_name, last_modified, description) VALUES (?, ?, ?, ?, ?)",
);

const deletePendingFileQuery = db.query("DELETE FROM pending_files WHERE id = ?");

const approveFile = db.transaction((id) => {
  db.run(
    `INSERT INTO files (title, event_date, file_name, last_modified, description)
SELECT title, event_date, file_name, last_modified, description FROM pending_files WHERE id = ?;`,
    [id],
  );
  db.run("DELETE FROM pending_files WHERE id = ?;", [id]);
});

async function resolveViewFile(file: TobyFile | null | undefined, preview?: string | boolean) {
  if (!file) {
    return null;
  }

  const sourceFile = Bun.file(`${filesFolder}/${file.file_name}`);

  if (!(await sourceFile.exists())) {
    return null;
  }

  if (preview === true || preview === "true") {
    return generateThumbnail(sourceFile);
  }

  return sourceFile;
}

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

  .get("/files", () => selectAllFilesQuery.all(null))

  // datasets are basically a collection of 20 files, data sets 1 is from files 1-20, data sets 2 is from files 21-40, etc.
  // returns datasets with only ids
  .get("/datasets", () => {
    const ids = selectAllFileIdsQuery.all(null).map((file) => file.id);

    const datasets = [];
    for (let i = 0; i < ids.length; i += 20) {
      datasets.push(ids.slice(i, i + 20));
    }

    return datasets;
  })

  .get("/datasets/:index", ({ params }) => selectFileIdsByOffsetQuery.all((params.index - 1) * 20).map((file) => file.id), {
    params: t.Object({
      index: t.Number(),
    }),
  })

  .get("/files/:id", ({ params }) => selectFileByIdQuery.get(params.id), {
    params: t.Object({
      id: t.Number(),
    }),
  })

  .post(
    "/files/new",
    async ({ body }) => {
      const extension = body.file.name.split(".").pop();
      const fileName = Bun.randomUUIDv7();

      const file = Bun.file(`${filesFolder}/${fileName}.${extension}`);
      await file.write(await body.file.bytes());

      return insertPendingFileQuery.run(body.title, body.event_date || null, `${fileName}.${extension}`, Date.now(), body.description || null);
    },
    {
      body: t.Object({
        title: t.String(),
        event_date: t.Optional(t.Number()),
        description: t.Optional(t.String()),

        file: t.File({ maxSize: "25m" }),
      }),
    },
  )

  // TODO: generate preview based on query if ?preview=true, otherwise serve original
  .get(
    "/files/:id/view",
    async ({ params, query, status }) => {
      const file = await resolveViewFile(selectFileByIdQuery.get(params.id), query.preview);

      if (!file) {
        return status(404, "File not found");
      }

      return file;
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      query: t.Object({
        preview: t.Optional(t.String()),
      }),
    },
  )

  // safe enough using uuidv7 i guess lol
  .get(
    "/pending/:id/view",
    async ({ params, query, status }) => {
      const file = await resolveViewFile(selectPendingFileByIdQuery.get(params.id), query.preview);

      if (!file) {
        return status(404, "File not found");
      }

      return file;
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      query: t.Object({
        preview: t.Optional(t.String()),
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

  .get("/pending", () => selectAllPendingFilesQuery.all(null))

  .get("/pending/:id", ({ params }) => selectPendingFileByIdQuery.get(params.id), {
    params: t.Object({
      id: t.Number(),
    }),
  })

  .get(
    "/pending/:id/approve",
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
    "/pending/:id/reject",
    async ({ params }) => {
      const file = selectPendingFileByIdQuery.get(params.id)?.file_name;
      if (file) {
        await Bun.file(`${filesFolder}/${file}`).delete();
      }

      return deletePendingFileQuery.run(params.id);
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
