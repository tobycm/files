import { Button, FileInput, Modal, Text, TextInput } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function SubmitFileModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();

  const form = useForm<{ title: string; event_date?: number; description?: string; file: File | null }>({
    initialValues: {
      title: "",
      description: "",
      file: null,
    },
    validate: {
      title: isNotEmpty("Title is required"),
      file: isNotEmpty("File is required"),
    },
  });

  const submitFile = useMutation({
    mutationFn: async (values: typeof form.values) => {
      if (!values.file) {
        throw new Error("File is required");
      }

      return api.files.new.post({
        ...values,
        file: values.file,
      });
    },
    onSuccess: async () => {
      form.reset();
      onClose();
      await queryClient.invalidateQueries({ queryKey: ["pendingFiles"] });
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    await submitFile.mutateAsync(values);
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      styles={{
        content: { backgroundColor: "#1e1e1e" },
        header: { backgroundColor: "#1e1e1e" },
        body: { backgroundColor: "#1e1e1e" },
      }}
      c="primary">
      <form onSubmit={handleSubmit}>
        <Text fz={36} fw="bold" ta="center">
          Submit a Tip
        </Text>
        <Text fz={16} mt="lg">
          Title
        </Text>
        <TextInput placeholder="Enter the title of your tip" {...form.getInputProps("title")} />
        <Text fz={16} mt="lg">
          Description
        </Text>
        <TextInput placeholder="Enter the description of your tip" {...form.getInputProps("description")} />
        <Text fz={16} mt="lg">
          File
        </Text>
        <FileInput
          placeholder="Upload a file"
          value={form.values.file}
          onChange={(file) => form.setFieldValue("file", file)}
          error={form.errors.file}
        />
        {submitFile.isError && (
          <Text mt="sm" c="error">
            Failed to submit file.
          </Text>
        )}
        <Button c="primary" bg="blue" mt="lg" type="button" onClick={() => handleSubmit()} loading={submitFile.isPending}>
          Submit
        </Button>
      </form>
    </Modal>
  );
}
