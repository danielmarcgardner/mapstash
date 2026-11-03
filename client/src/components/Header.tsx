import { AppShell, Group, Avatar, Input, Title } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useGetCurrentUserQuery } from '../state/api/authApi';

const Header = () => {
    const { data: currentUser } = useGetCurrentUserQuery();
    const userInitials = currentUser
        ? `${currentUser.first_name[0]}${currentUser.last_name[0]}`
        : '??';
    return (
    <AppShell.Header className="flex items-center justify-between px-4 border-b border-gray-200 bg-white">
        <Title order={3}>MapStash</Title>
        <Group gap="sm">
            <Input
                leftSection={<IconSearch size={16} />}
                placeholder="Search places"
                className="w-64"
                disabled={true}
            />
            <Avatar color="cyan" radius="xl">
                {userInitials}
            </Avatar>
        </Group>
    </AppShell.Header>
    );
}

export default Header;