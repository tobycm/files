import { Database } from "bun:sqlite";

import { databasePath } from "./utils";

export async function startup() {
  console.log("Starting up TobyFilesAPI...");

  const db = new Database(databasePath);
}
