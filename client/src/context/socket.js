import { React, createContext, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

function SocketProvider(props) {
    const [socket] = useState(io());
    return <SocketContext.Provider value={socket} {...props} />;
}

export { SocketContext, SocketProvider };
