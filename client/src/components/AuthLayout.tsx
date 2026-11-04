import { Box, Title } from '@mantine/core';
import type { ReactNode } from 'react';


export default function AuthLayout({
    title,
    children,
    onSubmit,
}: {
    title: string;
    children: ReactNode;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <Box className="max-w-md mx-auto mt-20">
            <form
                onSubmit={onSubmit}
                className="space-y-4 bg-white p-6 shadow-md rounded-xl"
            >
                <Title order={2} className="text-center">
                    {title}
                </Title>
                {children}
            </form>
        </Box>
    );
}
  