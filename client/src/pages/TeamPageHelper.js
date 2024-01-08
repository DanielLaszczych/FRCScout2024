import React from 'react';
import { useLocation } from 'react-router-dom';
import TeamPage from './TeamPage';

function TeamPageHelper() {
    const { state } = useLocation();
    return <TeamPage key={state} keyProp={state} />;
}

export default TeamPageHelper;
