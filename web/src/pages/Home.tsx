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
    <Stack mih="100vh" c="primary" p="md" gap="md" align="center">
      <SubmitFileModal opened={opened} onClose={close} />
      <Button pos="fixed" bottom="1.5rem" left="1.5rem" c="primary" bg="blue" onClick={open} style={{ zIndex: 10 }}>
        Have tips?
      </Button>

      <Text fz={64} fw="bold" ta="center">
        The Toby's Files
      </Text>
      <Text fz={20} ta="center" fs="italic">
        Released under the authorization of the Pen High Supreme Court
      </Text>

      {!files.isFetched && <Loader />}

      {files.isFetched && <FileCards files={files.data?.data || []} />}
    </Stack>
  );
}
