import { Badge, Box, Card, Group, Image, Text } from "@mantine/core";
import seedrandom from "seedrandom";
import type { TobyFile } from "../../../backend/src/models";
import { apiUrl, fileUrl } from "../lib/api";
import { formatDate } from "../lib/utils";

type PreviewKind = "image" | "video" | "audio" | "pdf" | "other";

function getPreviewKind(fileName: string): PreviewKind {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension) return "other";

  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif", "heic", "heif"].includes(extension)) {
    return "image";
  }

  if (["mp4", "webm", "mov", "m4v", "ogv"].includes(extension)) {
    return "video";
  }

  if (["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus"].includes(extension)) {
    return "audio";
  }

  if (extension === "pdf") {
    return "pdf";
  }

  return "other";
}

function getRedactionBars(file: TobyFile) {
  const rng = seedrandom(`${file.file_name}`);

  const chanceOfFullyRedacted = rng() * 20;
  if (chanceOfFullyRedacted == 5) {
    return [{ x: 5, y: 5, width: 90, height: 90 }];
  }

  const barCount = 18 + Math.floor(rng() * 12);
  const bars: Array<{ x: number; y: number; width: number; height: number }> = [];

  let y = 2 + rng() * 4;

  for (let i = 0; i < barCount && y < 96; i += 1) {
    const height = 7 + rng() * 6;
    const width = 40 + rng() * 50;
    const x = 5 + rng() * (95 - width);

    bars.push({ x, y, width, height });
    y += height + 2 + rng() * 2;
  }

  return bars;
}

function ImageRenderer({ file, pending, redacted }: { file: TobyFile; pending?: boolean; redacted?: boolean }) {
  const redactionBars = getRedactionBars(file);

  return (
    <Box pos="relative">
      <Image src={fileUrl(file, apiUrl, true, pending)} alt={file.title} style={{ width: "100%", height: "auto", display: "block" }} loading="lazy" />

      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: redacted ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}>
        {redactionBars.map((bar, index) => (
          <rect key={`${file.id}-${index}`} x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill="black" />
        ))}
      </svg>
    </Box>
  );
}

export default function FileCard({ file, pending, redacted }: { file: TobyFile; pending?: boolean; redacted?: boolean }) {
  const fileDate = file.event_date ?? file.last_modified ?? file.added_at;
  const previewKind = getPreviewKind(file.file_name);
  const useGeneratedPreview = previewKind === "image" || previewKind === "pdf";
  const mediaUrl = fileUrl(file, apiUrl, useGeneratedPreview, pending);
  const rawUrl = fileUrl(file, apiUrl, false, pending);

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder bg="primary">
      <Card.Section>
        {previewKind === "video" && <video src={mediaUrl} controls preload="metadata" style={{ width: "100%", display: "block" }} />}
        {previewKind === "audio" && (
          <Box p="md">
            <audio src={mediaUrl} controls preload="metadata" style={{ width: "100%" }} />
          </Box>
        )}
        {(previewKind === "image" || previewKind === "pdf") && (
          <a href={rawUrl} target="_blank" rel="noopener noreferrer">
            <ImageRenderer file={file} pending={pending} redacted={redacted} />
          </a>
        )}
        {previewKind === "other" && (
          <Box p="md">
            <Text size="sm" c="dimmed" ta="center">
              Preview unavailable
            </Text>
          </Box>
        )}
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>{file.title}</Text>
        <Badge color="purple">{formatDate(fileDate)}</Badge>
      </Group>
      <Text size="sm">{file.description}</Text>
    </Card>
  );
}
