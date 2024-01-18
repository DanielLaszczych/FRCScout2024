import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// import { ColorModeScript } from '@chakra-ui/react';
// import theme from './theme';

import { AuthProvider } from './context/auth';
import { GlobalProvider } from './context/globalState';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        {/* <ColorModeScript /> */}
        <AuthProvider>
            <GlobalProvider>
                <App />
            </GlobalProvider>
        </AuthProvider>
    </React.StrictMode>
);

serviceWorkerRegistration.register();
