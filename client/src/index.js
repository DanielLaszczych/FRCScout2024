import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';

// import { ColorModeScript } from '@chakra-ui/react';
// import theme from './theme';

import { AuthProvider } from './context/auth';

const cache = new InMemoryCache({
    addTypename: false,
    typePolicies: {
        Query: {
            fields: {
                getPitForms: {
                    merge(existing, incoming) {
                        return incoming;
                    },
                },
                getMatchForms: {
                    merge(existing, incoming) {
                        return incoming;
                    },
                },
                getEvents: {
                    merge(existing, incoming) {
                        return incoming;
                    },
                },
                getRTESSIssues: {
                    merge(existing, incoming) {
                        return incoming;
                    },
                },
            },
        },
    },
});

const client = new ApolloClient({
    uri: '/graphql',
    // Credentials: include is necessary to pass along the auth cookies with each server request
    credentials: 'include',
    cache: cache,
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        {/* <ColorModeScript /> */}
        <ApolloProvider client={client}>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ApolloProvider>
    </React.StrictMode>
);
