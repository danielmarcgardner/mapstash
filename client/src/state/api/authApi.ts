import { type User, type SignupCredentials, type LoginCredentials, type SignupResponse, type LoginResponse } from '../../types/user';
import { baseApi } from './baseApi';

// A new session must not show the previous user's cached places, tags or lists.
const sessionChanged = ['User', 'Place', 'Tag', 'List'] as const;

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<LoginResponse, LoginCredentials>({
            query: ({ email, password }) => ({
                url: '/api/login',
                method: 'POST',
                body: { user: { email, password } },
            }),
            invalidatesTags: [...sessionChanged],
        }),
        signup: builder.mutation<SignupResponse, SignupCredentials>({
            query: ({ email, password, lastName, firstName }) => ({
                url: '/api/signup',
                method: 'POST',
                body: { user: { email, password, first_name: firstName, last_name: lastName } },
            }),
            invalidatesTags: [...sessionChanged],
        }),
        logout: builder.mutation<void, void>({
            query: () => ({ url: '/api/logout', method: 'DELETE' }),
        }),
        getCurrentUser: builder.query<User, void>({
            query: () => '/api/users/me',
            providesTags: ['User'],
        }),
    }),
});

export const { useLoginMutation, useSignupMutation, useLogoutMutation, useGetCurrentUserQuery } = authApi;
