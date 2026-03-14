import { Box, Button, Group } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TobyFile } from "../../../backend/src/models";
import { api } from "../lib/api";
import { useAppState } from "../states/AppState";
import FileCard from "./FileCard";

export default function FileCards({ files, pending }: { files: TobyFile[]; pending?: boolean }) {
  const apiKey = useAppState((state) => state.apiKey);
  const queryClient = useQueryClient();

  const rejectPendingFile = useMutation({
    mutationFn: async (fileId: number) => api.pending({ id: fileId }).reject.get({ headers: { authorization: `Bearer ${apiKey}` } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pendingFiles"] });
    },
  });

  const approvePendingFile = useMutation({
    mutationFn: async (fileId: number) => api.pending({ id: fileId }).approve.get({ headers: { authorization: `Bearer ${apiKey}` } }),
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["pendingFiles"] }), queryClient.invalidateQueries({ queryKey: ["files"] })]);
    },
  });

  return (
    <Box
      style={{
        columnWidth: "320px",
        columnGap: "var(--mantine-spacing-md)",
      }}>
      {files.map((file) => (
        <Box
          key={file.id}
          style={{
            breakInside: "avoid",
            marginBottom: "var(--mantine-spacing-md)",
            display: "inline-block",
            width: "100%",
          }}>
          <FileCard file={file} pending={pending} />
          {pending && (
            <Group p="md">
              <Button color="red" loading={rejectPendingFile.isPending} onClick={() => rejectPendingFile.mutate(file.id)}>
                Reject
              </Button>
              <Button color="green" loading={approvePendingFile.isPending} onClick={() => approvePendingFile.mutate(file.id)}>
                Approve
              </Button>
            </Group>
          )}
        </Box>
      ))}
    </Box>
  );
}
