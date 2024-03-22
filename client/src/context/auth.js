import React, { useReducer, useEffect, createContext } from 'react';
import { fetchAndCache } from '../util/helperFunctions';

const initialState = {
    user: null
};

const AuthContext = createContext({
    user: null,
    login: (userData) => {},
    logout: () => {},
    refreshUserData: () => {}
});

function authReducer(state, action) {
    switch (action.type) {
        case 'LOGIN':
            return {
                ...state,
                user: action.payload
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null
            };
        default:
            return state;
    }
}

function AuthProvider(props) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        async function fetchData() {
            try {
                let response = await fetchAndCache('/getUser');
                let data = await response.json();
                login(data);
            } catch {
                login('NoUser');
            }
        }

        fetchData();
    }, []);

    function login(userData) {
        dispatch({
            type: 'LOGIN',
            payload: userData
        });
    }

    function logout() {
        dispatch({ type: 'LOGOUT' });
    }

    function refreshUserData() {
        fetch('/getUser')
            .then((res) => res.json())
            .then((data) => login(data))
            .catch(() => login('NoUser'));
    }

    return <AuthContext.Provider value={{ user: state.user, login, logout, refreshUserData }} {...props} />;
}

export { AuthContext, AuthProvider };
