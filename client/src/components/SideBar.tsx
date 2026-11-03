import {AppShell, ScrollArea, Title} from "@mantine/core";

const SideBar = () => {
    return (
        <AppShell.Navbar p="xs">
            <ScrollArea className="h-full">
                <Title order={5} mb="xs">
                    Your Lists
                </Title>
                {/* Map over user lists */}
                <ul className="mb-4 space-y-2">
                    <li className="text-sm text-gray-700 hover:text-black cursor-pointer">🗺 San Diego Trip</li>
                    <li className="text-sm text-gray-700 hover:text-black cursor-pointer">🍜 SF Restaurants</li>
                </ul>

                <Title order={5} mb="xs">
                    Tags
                </Title>
                <div className="flex flex-wrap gap-1">
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Brunch</span>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Dog Friendly</span>
                    <span className="bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded">Coffee</span>
                </div>
            </ScrollArea>
        </AppShell.Navbar>
    );
};

export default SideBar;