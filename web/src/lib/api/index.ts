import { treaty } from "@elysiajs/eden";
import type { TobyFilesAPI } from "../../../../backend/src/index";
import type { TobyFile } from "../../../../backend/src/models";

export const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost" ? "http://localhost:3463" : window.location.origin);

const api = treaty<TobyFilesAPI>(apiUrl);

export { api };

export function fileUrl(file: TobyFile, apiUrl: string, preview?: boolean, pending?: boolean) {
  const filePath = pending ? "pending" : "files";

  if (preview) {
    return `${apiUrl}/${filePath}/${file.id}/view?preview=true`;
  }
  return `${apiUrl}/${filePath}/${file.id}/view`;
}
