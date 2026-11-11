import { AppShell, Group, Avatar, Button, Input, Menu, Title, UnstyledButton } from "@mantine/core";
import { IconLogout, IconPlus, IconSearch } from "@tabler/icons-react";
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetCurrentUserQuery, useLogoutMutation } from '../state/api/authApi';
import { endSession } from '../state/api/baseApi';
import { LOGIN } from '../constants/routes';

const Header = ({ onAddPlace }: { onAddPlace: () => void }) => {
    const { data: currentUser } = useGetCurrentUserQuery();
    const [logout] = useLogoutMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // charAt returns '' for an empty name, so a blank profile shows '?' rather than "undefined".
    const userInitials = currentUser
        ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`.toUpperCase() || '?'
        : '??';

    const handleLogout = async () => {
        try {
            await logout().unwrap(); // revokes the token on the server
        } catch {
            // The local session still ends if the server call fails.
        } finally {
            endSession(dispatch);
            navigate(LOGIN);
        }
    };

    return (
    <AppShell.Header className="flex items-center justify-between px-4 border-b border-gray-200 bg-white">
        <Title order={3}>MapStash</Title>
        <Group gap="sm">
            <Button leftSection={<IconPlus size={16} />} onClick={onAddPlace}>Add place</Button>
            <Input
                leftSection={<IconSearch size={16} />}
                placeholder="Search places"
                className="w-64"
                disabled={true}
            />
            <Menu position="bottom-end">
                <Menu.Target>
                    <UnstyledButton aria-label="Account menu">
                        <Avatar color="cyan" radius="xl">
                            {userInitials}
                        </Avatar>
                    </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item leftSection={<IconLogout size={16} />} onClick={handleLogout}>
                        Log out
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </Group>
    </AppShell.Header>
    );
}

export default Header;
