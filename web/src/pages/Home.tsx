import { Button, Loader, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import FileCards from "../components/FileCards";
import SubmitFileModal from "../components/SubmitFileModal";
import { api } from "../lib/api";

export default function Home() {
  const [opened, { open, close }] = useDisclosure(false);

  const files = useQuery({
    queryKey: ["files"],
    queryFn: () => api.files.get(),
  });

  return (
    <Stack mih="100vh" c="primary" p="md" pb="5rem" align="center">
      <SubmitFileModal opened={opened} onClose={close} />

      <Text fz={{ base: 40, sm: 60 }} fw="bold" ta="center" mb={0}>
        The Toby's Files
      </Text>
      <Text fz={{ base: 20, sm: 24 }} ta="center" fs="italic">
        Released under the authorization of the Pen High Supreme Court
      </Text>

      <Button c="primary" bg="blue" onClick={open}>
        Have tips?
      </Button>

      {!files.isFetched && <Loader />}

      {files.isFetched && <FileCards files={files.data?.data || []} />}

      <Text c="dimmed" ta="center" fs="italic">
        This is the end... or is it?
      </Text>
    </Stack>
  );
}
