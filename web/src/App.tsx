import { ActionIcon, Box } from "@mantine/core";
import { IconArrowUp } from "@tabler/icons-react";

import { useMediaQuery } from "@mantine/hooks";

import { isMobileQuery } from "./lib/utils";
import Admin from "./pages/Admin";
import Home from "./pages/Home";

function App() {
  const isMobile = useMediaQuery(isMobileQuery);

  const currentPath = window.location.pathname;

  return (
    <Box>
      <ActionIcon
        pos="fixed"
        bottom="1.5rem"
        right="1.5rem"
        size={isMobile ? 44 : 52}
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
