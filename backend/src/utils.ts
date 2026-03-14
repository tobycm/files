import { BunFile, spawn } from "bun";
import { mkdir, rm } from "node:fs/promises";
import { basename, join } from "node:path";

export const databasePath = process.env.DATABASE_PATH || "../data/tobyfiles.sqlite";

export const tempFolder = process.env.TEMP_FOLDER || "../temp";

function inputExtensionFromMimeType(mimeType: string) {
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType.startsWith("image/")) {
    const extension = mimeType.slice("image/".length).split("+")[0];
    if (extension) return `.${extension}`;
  }

  return "";
}

function thumbnailCachePath(file: BunFile) {
  if (file.name) {
    return join(tempFolder, `${basename(file.name)}.webp`);
  }

  return join(tempFolder, `${Bun.randomUUIDv7()}.webp`);
}

async function transcodeToWebp(file: BunFile, mimeType: string): Promise<BunFile> {
  await mkdir(tempFolder, { recursive: true });

  const outputPath = thumbnailCachePath(file);
  const cachedOutputFile = Bun.file(outputPath);
  if (await cachedOutputFile.exists()) {
    return cachedOutputFile;
  }

  const needsTempInput = !file.name;
  const inputPath = needsTempInput ? join(tempFolder, `${Bun.randomUUIDv7()}-input${inputExtensionFromMimeType(mimeType)}`) : file.name;

  try {
    if (needsTempInput) {
      await Bun.write(inputPath, await file.bytes());
    }

    const process = spawn({
      cmd: [
        "ffmpeg",
        "-y",
        "-i",
        inputPath,
        "-vf",
        "scale=min(800\\,iw):-1:flags=lanczos",
        "-frames:v",
        "1",
        "-c:v",
        "libwebp",
        "-q:v",
        "80",
        "-compression_level",
        "6",
        outputPath,
      ],
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await process.exited;

    if (exitCode !== 0) {
      const stderr = await new Response(process.stderr).text();
      throw new Error(`ffmpeg thumbnail generation failed: ${stderr || `exit code ${exitCode}`}`);
    }

    const outputFile = Bun.file(outputPath);

    if (!(await outputFile.exists())) {
      throw new Error("ffmpeg thumbnail generation failed: output file was not created");
    }

    return outputFile;
  } finally {
    if (needsTempInput) {
      await rm(inputPath, { force: true });
    }
  }
}

async function transcodePdfToWebp(file: BunFile): Promise<BunFile> {
  await mkdir(tempFolder, { recursive: true });

  const outputPath = thumbnailCachePath(file);
  const cachedOutputFile = Bun.file(outputPath);
  if (await cachedOutputFile.exists()) {
    return cachedOutputFile;
  }

  const needsTempInput = !file.name;
  const inputPath = needsTempInput ? join(tempFolder, `${Bun.randomUUIDv7()}-input.pdf`) : file.name;

  try {
    if (needsTempInput) {
      await Bun.write(inputPath, await file.bytes());
    }

    const process = spawn({
      cmd: ["convert", "-density", "150", `${inputPath}[0]`, "-thumbnail", "800x", "-quality", "80", outputPath],
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await process.exited;

    if (exitCode !== 0) {
      const stderr = await new Response(process.stderr).text();
      throw new Error(`convert PDF preview generation failed: ${stderr || `exit code ${exitCode}`}`);
    }

    const outputFile = Bun.file(outputPath);

    if (!(await outputFile.exists())) {
      throw new Error("convert PDF preview generation failed: output file was not created");
    }

    return outputFile;
  } finally {
    if (needsTempInput) {
      await rm(inputPath, { force: true });
    }
  }
}

export async function generateThumbnail(file: BunFile): Promise<BunFile> {
  const mimeType = file.type || "";

  if (mimeType.startsWith("image/")) {
    return transcodeToWebp(file, mimeType);
  }

  if (mimeType.startsWith("audio/")) {
    return file;
  }

  if (mimeType.startsWith("video/")) {
    return file;
  }

  if (mimeType === "application/pdf") {
    return transcodePdfToWebp(file);
  }

  return file;
}
