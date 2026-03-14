import { ActionIcon, Button, Group, Loader, PasswordInput, Stack, Text } from "@mantine/core";
import { useShallow } from "zustand/shallow";

import { IconEye, IconLogin, IconLogout } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import FileCards from "../components/FileCards";
import { api } from "../lib/api";
import { useAppState } from "../states/AppState";

export default function Admin() {
  const apiKey = useAppState((state) => state.apiKey);
  const setApiKey = useAppState(useShallow((state) => state.setApiKey));

  const [tempApiKey, setTempApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const pendingFiles = useQuery({
    queryKey: ["pendingFiles"],
    queryFn: () => api.pending.get({ headers: { authorization: `Bearer ${apiKey}` } }),
    enabled: !!apiKey,
  });

  return (
    <Stack mih="100vh" c="primary" p="md" gap="md" align="center">
      <Text fz={64} fw="bold" ta="center">
        Department of Pen High Justice
      </Text>

      {!apiKey && (
        <Group w="30%" align="center">
          <PasswordInput
            w="60%"
            placeholder="API Key"
            value={tempApiKey}
            size="xl"
            onChange={(e) => setTempApiKey(e.target.value)}
            styles={{ input: { backgroundColor: "#1e1e1e", color: "#ffafcc" } }}
          />

          <Button w="30%" bg="blue" c="primary" size="lg" onClick={() => setApiKey(tempApiKey)} rightSection={<IconLogin />}>
            Login
          </Button>
        </Group>
      )}

      {apiKey && (
        <Group>
          <Text fz={32} fw="bold" ta="center">
            API Key: {showApiKey ? apiKey : "••••••••"}
          </Text>

          <ActionIcon variant="outline" color="blue" onClick={() => setShowApiKey(!showApiKey)}>
            <IconEye />
          </ActionIcon>

          <ActionIcon variant="outline" color="red" onClick={() => setApiKey("")}>
            <IconLogout />
          </ActionIcon>
        </Group>
      )}
      {apiKey && (pendingFiles.isFetched ? <FileCards files={pendingFiles.data?.data || []} pending={true} /> : <Loader />)}
    </Stack>
  );
}
