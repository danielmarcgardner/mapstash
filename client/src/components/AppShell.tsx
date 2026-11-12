import { AppShell } from "@mantine/core";
import Header from "./Header";
import type { ReactNode } from "react";

type Props = { children: ReactNode; onAddPlace: () => void; navOpened: boolean; onToggleNav: () => void };

const AppShellComponent = ({ children, onAddPlace, navOpened, onToggleNav }: Props) => {
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
            <Header onAddPlace={onAddPlace} navOpened={navOpened} onToggleNav={onToggleNav} />
            {children}
        </AppShell>
    );
}

export default AppShellComponent;