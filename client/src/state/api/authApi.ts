import { createApi } from '@reduxjs/toolkit/query/react';
import { type User, type SignupCredentials, type LoginCredentials, type SignupResponse, type LoginResponse } from '../../types/user';
import { baseQuery } from './commonApi';

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery,
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginCredentials>({
            query: ({ email, password }: LoginCredentials) => ({
                url: '/api/login',
                method: 'POST',
                body: { user: { email, password }} // Nest parameters under "user"
            })
        }),
        signup: builder.mutation<SignupResponse, SignupCredentials>({
            query: ({ email, password, lastName, firstName }: SignupCredentials) => ({
                url: '/api/signup',
                method: 'POST',
                body: { user: {  email, password, first_name: firstName, last_name: lastName }}  // Nest parameters under "user"
            })
        }),
        getCurrentUser: builder.query<User, null>({
            query: () => '/api/users/me'
        })
    })
});

export const { useLoginMutation, useSignupMutation, useGetCurrentUserQuery } = authApi;