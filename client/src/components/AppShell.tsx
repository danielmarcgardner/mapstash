import { AppShell } from "@mantine/core";
import Header from "./Header";
import type { ReactNode } from "react";

const AppShellComponent = ({ children }: { children: ReactNode }) => {
    return (
        <AppShell
            header={{
                height: 60,
            }}
            navbar={{
                width: 250,
                breakpoint: "sm",
            }}
            padding="md"
            >
            <Header />
            {children}
        </AppShell>
    );
}

export default AppShellComponent;