import React, { useReducer, useEffect, createContext } from 'react';
import { fetchDataAndCache } from '../util/helperFunctions';

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
            console.log('getting user data');
            // caches.open('scouting').then((cache) => {
            //     fetch('/getuser')
            //         .then((res) => res.json())
            //         .then((data) => {
            //             login(data);
            //             cache.add('/getuser');
            //         })
            //         .catch(() => {
            //             cache
            //                 .match('/getuser')
            //                 .then((res) => res.json())
            //                 .then((data) => {
            //                     login(data);
            //                 })
            //                 .catch(() => login('NoUser'));
            //         });
            // });
            try {
                let response = await fetchDataAndCache('/getuser');
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
        fetch('/getuser')
            .then((res) => res.json())
            .then((data) => login(data))
            .catch((data) => login('NoUser'));
    }

    return <AuthContext.Provider value={{ user: state.user, login, logout, refreshUserData }} {...props} />;
}

export { AuthContext, AuthProvider };
