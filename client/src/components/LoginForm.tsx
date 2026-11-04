import { TextInput, PasswordInput, Button, Alert, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useState, useMemo } from 'react';
import { useLoginMutation } from '../state/api/authApi';
import { loginSuccess } from '../state/slices/authSlice';
import AuthLayout from './AuthLayout';
import { HOME, SIGNUP } from '../constants/routes';

export default function Login() {
    const [login, loginStatus] = useLoginMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const { isLoading } = loginStatus;

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) =>
                value.length < 6 ? 'Password must be at least 6 characters' : null,
        },
    });

    const navigateToSignup = useMemo(() => () => navigate(SIGNUP), [navigate]);
    const navigateToHome = useMemo(() => () => navigate(HOME), [navigate]);
    const onAnchorClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigateToSignup();
    };  

    const handleSubmit = async (values: typeof form.values) => {
        setSubmitError(null);
        try {
            const result = await login(values).unwrap();
            console.log('Login result:', result);
            
            dispatch(loginSuccess(result));
            console.log('NAVIGATE TO HOME');
            
            navigateToHome();
        } catch (err: any) {
            console.log('Login error:', err);
            
            setSubmitError(err?.data?.error || 'Login failed');
        }
    };

    return (
        <AuthLayout title="Log In" onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
                label="Email"
                placeholder="you@example.com"
                {...form.getInputProps('email')}
            />

            <PasswordInput
                label="Password"
                placeholder="••••••••"
                {...form.getInputProps('password')}
            />

            {submitError && (
                <Alert color="red" radius="sm">
                    {submitError}
                </Alert>
            )}

            <Button fullWidth type="submit"  loading={isLoading}>
                Log In
            </Button>
            <Anchor
                onClick={onAnchorClick}
                underline="hover"
                className="text-center mt-4"
            >
                Don't have an account? Sign up
            </Anchor>
        </AuthLayout>
    );
}
  