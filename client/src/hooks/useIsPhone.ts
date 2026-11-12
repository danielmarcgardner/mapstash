import { useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

// Below the same `sm` breakpoint the AppShell uses to collapse the navbar.
export const useIsPhone = () => useMediaQuery(`(max-width: ${useMantineTheme().breakpoints.sm})`);
