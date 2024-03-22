import { Center, ChakraProvider, Spinner, extendTheme } from '@chakra-ui/react';
import { React, Suspense, lazy, useContext, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import { AuthContext } from './context/auth';
import { GlobalContext } from './context/globalState';
import { teamPageTabs, version } from './util/helperConstants';
import '@fontsource/open-sans/400.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const PitForm = lazy(() => import('./pages/PitForm'));
const PitPage = lazy(() => import('./pages/PitsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const MatchesPage = lazy(() => import('./pages/MatchesPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const PreStandForm = lazy(() => import('./pages/PreStandForm'));
// const WebDataConnector = lazy(() => import('./pages/WebDataConnector'));
const AdminErrorPage = lazy(() => import('./pages/AdminErrorPage'));
const FailedLoginPage = lazy(() => import('./pages/FailedLoginPage'));
const StandForm = lazy(() => import('./pages/StandForm'));
const PreMatchAnalystPage = lazy(() => import('./pages/PreMatchAnalystPage'));
const MatchAnalystPage = lazy(() => import('./pages/MatchAnalystPage'));
const PitMapPage = lazy(() => import('./pages/PitMapPage'));
const TeamPageHelper = lazy(() => import('./pages/TeamPageHelper'));
const RTESSIssuesPage = lazy(() => import('./pages/RTESSIssuesPage'));
const RTESSIssuePage = lazy(() => import('./pages/RTESSIssuePage'));
const PreSuperForm = lazy(() => import('./pages/PreSuperForm'));
const SuperForm = lazy(() => import('./pages/SuperForm'));
const OfflinePage = lazy(() => import('./pages/OfflinePage'));
const DataExtractPage = lazy(() => import('./pages/DataExtractPage'));
const EventRankingsPage = lazy(() => import('./pages/EventRankingsPage'));

// import { createBreakpoints } from '@chakra-ui/theme-tools';

// const breakpoints = createBreakpoints({
//     sm: '480px',
//     md: '768px',
//     lg: '992px',
//     xl: '1200px',
//     '2xl': '1536px',
// });
const customTheme = extendTheme({
    fonts: {
        heading: `'Open Sans', sans-serif`,
        body: `'Open Sans', sans-serif`
    }
});

function App() {
    const { user } = useContext(AuthContext);
    const { offline } = useContext(GlobalContext);

    useEffect(() => {
        fetch('/getVersion')
            .then((res) => res.json())
            .then((data) => {
                if (data.version !== version) {
                    // Create a new div element
                    let newDiv = document.createElement('div');

                    // Set some attributes for the div (optional)
                    newDiv.textContent =
                        'New content is available and will be used when all tabs from this website are closed. Do not scout until you have done this!!!';
                    newDiv.style.position = 'fixed';
                    newDiv.style.bottom = '0';
                    newDiv.style.left = '0';
                    newDiv.style.width = '100%';
                    newDiv.style.backgroundColor = '#ffc300';
                    newDiv.style.padding = '10px';
                    newDiv.style.textAlign = 'center';
                    newDiv.style.transition = 'opacity 1s ease-in-out'; // Add transition for opacity
                    newDiv.style.zIndex = 999;

                    // Append the div to the body
                    document.body.appendChild(newDiv);

                    // Set timeout to fade out and remove the div after 10 seconds
                    // setTimeout(function () {
                    //     newDiv.style.opacity = '0'; // Fade out
                    //     setTimeout(function () {
                    //         newDiv.remove(); // Remove from DOM after fading out
                    //     }, 1000); // Wait for the transition duration before removing
                    // }, 9000); // 9000 milliseconds = 9 seconds, leaving 1 second for the fade out effect
                }
            })
            .catch((error) => console.log(error));
    }, []);

    return user === null ? null : user === 'NoUser' ? (
        <ChakraProvider>
            <Router>
                <NavBar />
                <Suspense
                    fallback={
                        <Center>
                            <Spinner></Spinner>
                        </Center>
                    }
                >
                    <Routes>
                        <Route exact path='/' element={<HomePage />} />
                        <Route exact path='/failedLogin' element={<FailedLoginPage />} />
                        {/* <Route exact path='/tableau' element={<WebDataConnector />} /> */}
                        <Route path='*' element={<Navigate replace to='/' />} />
                    </Routes>
                </Suspense>
            </Router>
        </ChakraProvider>
    ) : (
        <ChakraProvider theme={customTheme}>
            <Router>
                <NavBar />
                <Suspense
                    fallback={
                        <Center>
                            <Spinner></Spinner>
                        </Center>
                    }
                >
                    <Routes>
                        <Route exact path='/' element={<HomePage />} />
                        <Route exact path='/pits' element={<PitPage />} />
                        <Route exact path='/matches' element={<MatchesPage />} />
                        {['team', 'event'].map((path) => (
                            <Route path={`/rtessIssues/${path}`} key={path} element={<RTESSIssuesPage />} />
                        ))}
                        <Route exact path='/rtessIssue/:id' element={<RTESSIssuePage />} />
                        <Route exact path='/pitForm/:eventKey/:teamNumber' element={<PitForm />} />
                        <Route exact path='/preStandForm' element={<PreStandForm />} />
                        <Route exact path='/preSuperForm' element={<PreSuperForm />} />
                        <Route
                            exact
                            path='/standForm/:eventKey/:matchNumber/:station/:teamNumber'
                            element={<StandForm />}
                        />
                        <Route
                            exact
                            path='/superForm/:eventKey/:matchNumber/:alliance/:teamNumber1/:teamNumber2/:teamNumber3'
                            element={<SuperForm />}
                        />
                        {Object.values(teamPageTabs).map((path) => (
                            <Route path={`/team/:teamNumber/${path}`} key={path} element={<TeamPageHelper />} />
                        ))}
                        <Route exact path='/preMatchAnalyst' element={<PreMatchAnalystPage />} />
                        <Route
                            exact
                            path='/matchAnalyst/:eventKey/:redTeamNumber1/:redTeamNumber2/:redTeamNumber3/:blueTeamNumber1/:blueTeamNumber2/:blueTeamNumber3/:matchNumber?'
                            element={<MatchAnalystPage />}
                        />
                        <Route exact path='/pitMap' element={<PitMapPage />} />
                        <Route
                            exact
                            path='/admin'
                            element={offline ? <OfflinePage /> : user.admin ? <AdminPage /> : <AdminErrorPage />}
                        />
                        <Route exact path='/dataExtract' element={<DataExtractPage />} />
                        <Route exact path='/eventRankings' element={<EventRankingsPage />} />
                        <Route path='*' element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </Router>
        </ChakraProvider>
    );
}

export default App;
