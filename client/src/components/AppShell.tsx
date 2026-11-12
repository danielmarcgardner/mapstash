import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Header from "./Header";
import type { ReactNode } from "react";

const AppShellComponent = ({ children, onAddPlace }: { children: ReactNode; onAddPlace: () => void }) => {
    const [navOpened, { toggle }] = useDisclosure();

    return (
        <AppShell
            header={{
                height: 60,
            }}
            navbar={{
                width: 250,
                breakpoint: "sm",
                collapsed: { mobile: !navOpened },
            }}
            padding="md"
            >
            <Header onAddPlace={onAddPlace} navOpened={navOpened} onToggleNav={toggle} />
            {children}
        </AppShell>
    );
}

export default AppShellComponent;