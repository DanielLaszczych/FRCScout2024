import React, { createContext, useEffect, useState } from 'react';

const GlobalContext = createContext();

const GlobalProvider = ({ children }) => {
    const [offline, setOffline] = useState(localStorage.getItem('Offline') === 'true');

    useEffect(() => {
        localStorage.setItem('Offline', offline);
    }, [offline]);

    function switchModes() {
        setOffline(!offline);
    }

    return <GlobalContext.Provider value={{ offline, switchModes }}>{children}</GlobalContext.Provider>;
};

export { GlobalContext, GlobalProvider };
