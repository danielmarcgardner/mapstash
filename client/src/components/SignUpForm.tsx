import { TextInput, PasswordInput, Button, Alert, Anchor } from '@mantine/core';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useForm } from '@mantine/form';
import { loginSuccess } from '../state/slices/authSlice';
import { useSignupMutation } from '../state/api/authApi';
import AuthLayout from './AuthLayout';
import { HOME, LOGIN } from '../constants/routes';

export default function Signup() {
    const [signup, signupStatus] = useSignupMutation();
    const { isLoading } = signupStatus;
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [submitError, setSubmitError] = useState<string | null>(null);

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
            firstName: '',
            lastName: '',
        },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) => (value.length < 6 ? 'Password too short' : null),
            firstName: (value) => (value.trim() ? null : 'First name is required'),
            lastName: (value) => (value.trim() ? null : 'Last name is required')
        },
    });

    const navigateToLogin = useMemo(() => () => navigate(LOGIN), [navigate]);
    const navigateToHome = useMemo(() => () => navigate(HOME), [navigate]);

    const onAnchorClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigateToLogin();
    };  

    const handleSubmit = async (values: typeof form.values) => {
        setSubmitError(null);
        try {
            const result = await signup(values).unwrap();
            dispatch(loginSuccess(result));
            navigateToHome();
        } catch (err) {
            setSubmitError((err as { data?: { error?: string } })?.data?.error || 'Signup failed');
        }
    };

    return (
        <AuthLayout title="Sign Up" onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
                label="First Name"
                placeholder="Joe"
                {...form.getInputProps('firstName')}
            />
            <TextInput
                label="Last Name"
                placeholder="Smith"
                {...form.getInputProps('lastName')}
            />

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

            <Button fullWidth type="submit" loading={isLoading}>
                Sign Up
            </Button>
            <Anchor
                onClick={onAnchorClick}
                underline="hover"
                className="text-center mt-4"
            >
                Already have an account? Log in
            </Anchor>
        </AuthLayout>
 
    )};