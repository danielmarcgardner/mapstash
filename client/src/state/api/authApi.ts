import { type User, type SignupCredentials, type LoginCredentials, type SignupResponse, type LoginResponse } from '../../types/user';
import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginCredentials>({
            query: ({ email, password }) => ({
                url: '/api/login',
                method: 'POST',
                body: { user: { email, password } },
            }),
            invalidatesTags: ['User'],
        }),
        signup: builder.mutation<SignupResponse, SignupCredentials>({
            query: ({ email, password, lastName, firstName }) => ({
                url: '/api/signup',
                method: 'POST',
                body: { user: { email, password, first_name: firstName, last_name: lastName } },
            }),
            invalidatesTags: ['User'],
        }),
        getCurrentUser: builder.query<User, void>({
            query: () => '/api/users/me',
            providesTags: ['User'],
        }),
    }),
});

export const { useLoginMutation, useSignupMutation, useGetCurrentUserQuery } = authApi;
