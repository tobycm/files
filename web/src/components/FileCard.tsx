import { Badge, Box, Card, Group, Image, Text } from "@mantine/core";
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

export default function FileCard({ file, pending }: { file: TobyFile; pending?: boolean }) {
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
            <Image src={mediaUrl} alt={file.title} style={{ width: "100%", height: "auto", display: "block" }} />
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
