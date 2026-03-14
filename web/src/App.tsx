import { ActionIcon, Box } from "@mantine/core";
import { IconArrowUp, IconEyeOff } from "@tabler/icons-react";

import { useShallow } from "zustand/shallow";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import { useAppState } from "./states/AppState";

function App() {
  const currentPath = window.location.pathname;
  const redacted = useAppState((state) => state.redacted);
  const toggleRedacted = useAppState(useShallow((state) => state.toggleRedacted));

  return (
    <Box>
      <ActionIcon
        pos="fixed"
        bottom="1.5rem"
        left="1.5rem"
        size="xl"
        radius="xl"
        c="primary"
        bg="blue"
        aria-label="Scroll to top"
        onClick={() => {
          toggleRedacted();
        }}
        style={{ zIndex: 10 }}>
        {redacted ? <IconEyeOff size={20} /> : <IconArrowUp size={20} />}
      </ActionIcon>

      <ActionIcon
        pos="fixed"
        bottom="1.5rem"
        right="1.5rem"
        size="xl"
        radius="xl"
        c="primary"
        bg="blue"
        aria-label="Scroll to top"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        style={{ zIndex: 10 }}>
        <IconArrowUp size={20} />
      </ActionIcon>

      {currentPath === "/" && <Home />}
      {currentPath === "/admin" && <Admin />}
    </Box>
  );
}

export default App;
