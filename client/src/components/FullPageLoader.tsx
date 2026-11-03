import { Loader } from '@mantine/core';

export default function FullPageLoader() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100%',
        }}>
            <Loader size="xl" />
        </div>
    );
}
