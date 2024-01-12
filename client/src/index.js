import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// import { ColorModeScript } from '@chakra-ui/react';
// import theme from './theme';

import { AuthProvider } from './context/auth';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        {/* <ColorModeScript /> */}
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
);

serviceWorkerRegistration.register();
