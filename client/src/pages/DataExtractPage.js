import React, { useEffect, useState } from 'react';
import { Box, Button, Center, Flex, Menu, MenuButton, MenuItem, MenuList, Spinner } from '@chakra-ui/react';
import FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import { matchFormStatus } from '../util/helperConstants';
import { convertMatchKeyToString, sortEvents, sortMatches } from '../util/helperFunctions';
import { ChevronDownIcon } from '@chakra-ui/icons';

function DataExtractPage() {
    const [events, setEvents] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [focusedEvent, setFocusedEvent] = useState(null);
    const [error, setError] = useState(null);
    const [excelType, setExcelType] = useState(true);

    useEffect(() => {
        fetch('/event/getEvents')
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then((data) => {
                let events = data;
                setEvents(sortEvents(events));
                if (events.length === 0) {
                    setError('No events are registered in the database');
                    return;
                }
                let currentEvent = events.find((event) => event.currentEvent);
                if (currentEvent) {
                    setCurrentEvent({ name: currentEvent.name, key: currentEvent.key, teams: currentEvent.teams });
                    setFocusedEvent(currentEvent.name);
                } else {
                    currentEvent = events[events.length - 1];
                    setCurrentEvent({ name: currentEvent.name, key: currentEvent.key, teams: currentEvent.teams });
                    setFocusedEvent(currentEvent.name);
                }
            })
            .catch((error) => setError(error.message));
    }, []);

    if (error) {
        return (
            <Box
                textAlign={'center'}
                fontSize={'lg'}
                fontWeight={'semibold'}
                margin={'0 auto'}
                width={{ base: '85%', md: '66%', lg: '50%' }}
            >
                {error}
            </Box>
        );
    }

    if (events === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    function getNoShowMatchValues(matchForm) {
        return {
            'Team Number': matchForm.teamNumber,
            'Team Name': currentEvent.teams.find((team) => matchForm.teamNumber === team.number)?.name || 'N/A',
            'Match Number': matchForm.matchIndex,
            'Match Name': convertMatchKeyToString(matchForm.matchNumber),
            Station: matchForm.station,
            'Stand Scouter': matchForm.standScouter,
            'Super Scouter': matchForm.superScouter,
            'Starting Position': 0,
            'Pre-Loaded Piece': 'None',
            'Left Start': 0,
            'Auto Intake Miss': 0,
            'Auto Amp Scored': 0,
            'Auto Speaker Scored': 0,
            'Auto Amp Miss': 0,
            'Auto Speaker Miss': 0,
            'Auto Points': 0,
            'Teleop Intake Source': 0,
            'Teleop Intake Ground': 0,
            'Teleop Amp Scored': 0,
            'Teleop Speaker Scored': 0,
            'Teleop Amp Miss': 0,
            'Teleop Speaker Miss': 0,
            'Teleop Ferry': 0,
            'Teleop Points': 0,
            'Climb Attempt': 0,
            'Climb Boolean': 0,
            'Climb Location': 0,
            Harmony: 0,
            Park: 0,
            Trap: 0,
            'Stage Points': 0,
            'Offensive Points': 0,
            'Was Defended': 0,
            'Defense Rating': 0,
            'Defense Allocation': 0,
            Agility: 0,
            'Field Awareness': 0,
            'Amp Player': 0,
            'High Note Score': 0,
            'High Note Miss': 0,
            'Lost Communication': 0,
            'Robot Broke': 0,
            'Yellow Card': 0,
            'Red Card': 0,
            'Stand Status': matchForm.standStatus,
            'Super Status': matchForm.superStatus
        };
    }

    return (
        <Box>
            <Center marginBottom={'25px'}>
                <Menu placement='bottom'>
                    <MenuButton
                        maxW={'65vw'}
                        onClick={() => setFocusedEvent('')}
                        as={Button}
                        rightIcon={<ChevronDownIcon />}
                    >
                        <Box overflow={'hidden'} textOverflow={'ellipsis'}>
                            {currentEvent.name}
                        </Box>
                    </MenuButton>
                    <MenuList>
                        {events.map((eventItem) => (
                            <MenuItem
                                textAlign={'center'}
                                justifyContent={'center'}
                                _focus={{ backgroundColor: 'none' }}
                                onMouseEnter={() => setFocusedEvent(eventItem.name)}
                                backgroundColor={
                                    (currentEvent.name === eventItem.name && focusedEvent === '') ||
                                    focusedEvent === eventItem.name
                                        ? 'gray.100'
                                        : 'none'
                                }
                                maxW={'65vw'}
                                key={eventItem.key}
                                onClick={() => {
                                    if (eventItem.key !== currentEvent.key) {
                                        setCurrentEvent({
                                            name: eventItem.name,
                                            key: eventItem.key,
                                            teams: eventItem.teams
                                        });
                                    }
                                }}
                            >
                                {eventItem.name}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
            </Center>
            <Flex
                justifyContent={'center'}
                alignItems={'center'}
                flexDirection={'column'}
                margin={'0 auto'}
                rowGap={'20px'}
            >
                <Flex columnGap={'20px'}>
                    <Button
                        width={'128px'}
                        colorScheme={excelType ? 'green' : 'gray'}
                        onClick={() => setExcelType(true)}
                    >
                        Excel Format
                    </Button>
                    <Button
                        width={'128px'}
                        colorScheme={!excelType ? 'green' : 'gray'}
                        onClick={() => setExcelType(false)}
                    >
                        CSV Format
                    </Button>
                </Flex>
                <Button
                    width={'fit-content'}
                    onClick={() => {
                        fetch('/ted/getTEDs', {
                            headers: {
                                filters: JSON.stringify({ eventKey: currentEvent.key })
                            }
                        })
                            .then((response) => {
                                if (response.status === 200) {
                                    return response.json();
                                } else {
                                    throw new Error(response.statusText);
                                }
                            })
                            .then((data) => {
                                const fileType =
                                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                                let dataArray = [];
                                data.forEach((ted) => {
                                    dataArray.push({
                                        'Team Number': ted.teamNumber,
                                        'Team Name':
                                            currentEvent.teams.find((team) => ted.teamNumber === team.number)?.name ||
                                            'N/A',
                                        'Left Start': ted.leftStart,
                                        'Auto Intake Miss': ted.autoGP.intakeMiss.avg,
                                        'Auto Amp Scored': ted.autoGP.ampScore.avg,
                                        'Auto Speaker Scored': ted.autoGP.speakerScore.avg,
                                        'Auto Amp Miss': ted.autoGP.ampMiss.avg,
                                        'Auto Speaker Miss': ted.autoGP.speakerMiss.avg,
                                        'Auto Points': ted.autoPoints.avg,
                                        'Teleop Intake Source': ted.teleopGP.intakeSource.avg,
                                        'Teleop Intake Ground': ted.teleopGP.intakeGround.avg,
                                        'Teleop Amp Scored': ted.teleopGP.ampScore.avg,
                                        'Teleop Speaker Scored': ted.teleopGP.speakerScore.avg,
                                        'Teleop Amp Miss': ted.teleopGP.ampMiss.avg,
                                        'Teleop Speaker Miss': ted.teleopGP.speakerMiss.avg,
                                        'Teleop Ferry': ted.teleopGP.ferry.avg,
                                        'Teleop Points': ted.teleopPoints.avg,
                                        'Climb Percentage':
                                            ted.climbSuccessPercentage === null ? 'N/A' : ted.climbSuccessPercentage,
                                        'Park Percentage':
                                            ted.parkSuccessPercentage === null ? 'N/A' : ted.parkSuccessPercentage,
                                        Trap: ted.teleopGP.trap.avg,
                                        'Stage Points': ted.stagePoints.avg,
                                        'Offensive Points': ted.offensivePoints.avg,
                                        'Was Defended': ted.wasDefended,
                                        'Defense Rating': ted.defenseRating.avg,
                                        'Defense Allocation': ted.defenseAllocation.avg,
                                        Agility: ted.agility.avg,
                                        'Field Awareness': ted.fieldAwareness.avg,
                                        'High Note Percentage':
                                            ted.highNoteScorePercentage === null ? 'N/A' : ted.highNoteScorePercentage,
                                        'Lost Communication': ted.lostCommunication,
                                        'Robot Broke': ted.robotBroke,
                                        'Yellow Card': ted.yellowCard,
                                        'Red Card': ted.redCard,
                                        'No Shows': ted.noShows
                                    });
                                });

                                const dataJSON = XLSX.utils.json_to_sheet(dataArray);
                                if (excelType) {
                                    const wb = { Sheets: { 'Team Raw Data': dataJSON }, SheetNames: ['Team Raw Data'] };
                                    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                                    const sheetData = new Blob([excelBuffer], { type: fileType });
                                    FileSaver.saveAs(sheetData, `${currentEvent.name}_TeamRawData.xlsx`);
                                } else {
                                    const csvData = new Blob([XLSX.utils.sheet_to_csv(dataJSON)]);
                                    FileSaver.saveAs(csvData, `${currentEvent.name}_TeamRawData.csv`);
                                }
                            });
                    }}
                >
                    Download team data
                </Button>

                <Button
                    width={'fit-content'}
                    onClick={() => {
                        fetch('/matchForm/getMatchForms', {
                            headers: {
                                filters: JSON.stringify({
                                    eventKey: currentEvent.key,
                                    standStatus: [matchFormStatus.complete, matchFormStatus.noShow],
                                    superStatus: [matchFormStatus.complete, matchFormStatus.noShow]
                                })
                            }
                        })
                            .then((response) => {
                                if (response.status === 200) {
                                    return response.json();
                                } else {
                                    throw new Error(response.statusText);
                                }
                            })
                            .then((data) => {
                                data = sortMatches(data);
                                let teamMatchCount = {};
                                data.forEach((matchForm) => {
                                    if (!Object.hasOwn(teamMatchCount, matchForm.teamNumber)) {
                                        matchForm.matchIndex = 1;
                                        teamMatchCount[matchForm.teamNumber] = 1;
                                    } else {
                                        teamMatchCount[matchForm.teamNumber] += 1;
                                        matchForm.matchIndex = teamMatchCount[matchForm.teamNumber];
                                    }
                                });

                                data.sort((a, b) => {
                                    let diff = a.teamNumber - b.teamNumber;
                                    if (diff === 0) {
                                        diff = a.matchIndex - b.matchIndex;
                                    }
                                    return diff;
                                });

                                const fileType =
                                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                                let dataArray = [];
                                data.forEach((matchForm) => {
                                    if (matchForm.standStatus === matchFormStatus.noShow) {
                                        dataArray.push(getNoShowMatchValues(matchForm));
                                    } else {
                                        dataArray.push({
                                            'Team Number': matchForm.teamNumber,
                                            'Team Name':
                                                currentEvent.teams.find((team) => matchForm.teamNumber === team.number)
                                                    ?.name || 'N/A',
                                            'Match Number': matchForm.matchIndex,
                                            'Match Name': convertMatchKeyToString(matchForm.matchNumber),
                                            Station: matchForm.station,
                                            'Stand Scouter': matchForm.standScouter,
                                            'Super Scouter': matchForm.superScouter,
                                            'Starting Position': matchForm.startingPosition,
                                            'Preloaded Piece': matchForm.preloadedPiece,
                                            'Left Start': matchForm.leftStart ? 1 : 0,
                                            'Auto Intake Miss': matchForm.autoGP.intakeMiss,
                                            'Auto Amp Scored': matchForm.autoGP.ampScore,
                                            'Auto Speaker Scored': matchForm.autoGP.speakerScore,
                                            'Auto Amp Miss': matchForm.autoGP.ampMiss,
                                            'Auto Speaker Miss': matchForm.autoGP.speakerMiss,
                                            'Auto Points': matchForm.autoPoints,
                                            'Teleop Intake Source': matchForm.teleopGP.intakeSource,
                                            'Teleop Intake Ground': matchForm.teleopGP.intakeGround,
                                            'Teleop Amp Scored': matchForm.teleopGP.ampScore,
                                            'Teleop Speaker Scored': matchForm.teleopGP.speakerScore,
                                            'Teleop Amp Miss': matchForm.teleopGP.ampMiss,
                                            'Teleop Speaker Miss': matchForm.teleopGP.speakerMiss,
                                            'Teleop Ferry': matchForm.teleopGP.ferry,
                                            'Teleop Points': matchForm.teleopPoints,
                                            'Climb Attempt': matchForm.climb.attempt,
                                            'Climb Boolean': matchForm.climb.attempt === 'Success' ? 1 : 0,
                                            'Climb Location': matchForm.climb.location || 'N/A',
                                            Harmony: matchForm.climb.harmony === null ? 'N/A' : matchForm.climb.harmony,
                                            Park: matchForm.climb.park ? 1 : matchForm.park === null ? 'N/A' : 0,
                                            Trap: matchForm.teleopGP.trap,
                                            'Stage Points': matchForm.stagePoints,
                                            'Offensive Points': matchForm.offensivePoints,
                                            'Was Defended': matchForm.wasDefended ? 1 : 0,
                                            'Defense Rating': matchForm.defenseRating,
                                            'Defense Allocation': matchForm.defenseAllocation,
                                            Agility: matchForm.agility,
                                            'Field Awareness': matchForm.fieldAwareness,
                                            'Amp Player': matchForm.ampPlayer ? 1 : 0,
                                            'High Note Score': matchForm.ampPlayerGP.highNoteScore,
                                            'High Note Miss': matchForm.ampPlayerGP.highNoteMiss,
                                            'Lost Communication': matchForm.lostCommunication ? 1 : 0,
                                            'Robot Broke': matchForm.robotBroke ? 1 : 0,
                                            'Yellow Card': matchForm.yellowCard ? 1 : 0,
                                            'Red Card': matchForm.redCard ? 1 : 0,
                                            'Stand Status': matchForm.standStatus,
                                            'Super Status': matchForm.superStatus
                                        });
                                    }
                                });

                                const dataJSON = XLSX.utils.json_to_sheet(dataArray);
                                if (excelType) {
                                    const wb = { Sheets: { 'TIM Raw Data': dataJSON }, SheetNames: ['TIM Raw Data'] };
                                    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                                    const sheetData = new Blob([excelBuffer], { type: fileType });
                                    FileSaver.saveAs(sheetData, `${currentEvent.name}_TIMRawData.xlsx`);
                                } else {
                                    const csvData = new Blob([XLSX.utils.sheet_to_csv(dataJSON)]);
                                    FileSaver.saveAs(csvData, `${currentEvent.name}_TIMRawData.csv`);
                                }
                            });
                    }}
                >
                    Download team in match data
                </Button>
                <Button
                    width={'fit-content'}
                    onClick={() => {
                        fetch('/pitForm/getPitFormsSimple', {
                            headers: {
                                filters: JSON.stringify({
                                    eventKey: currentEvent.key,
                                    followUp: false
                                })
                            }
                        })
                            .then((response) => {
                                if (response.status === 200) {
                                    return response.json();
                                } else {
                                    throw new Error(response.statusText);
                                }
                            })
                            .then((data) => {
                                data.sort((a, b) => {
                                    let diff = a.teamNumber - b.teamNumber;
                                    if (diff === 0) {
                                        diff = a.matchIndex - b.matchIndex;
                                    }
                                    return diff;
                                });

                                const fileType =
                                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                                let dataArray = [];
                                data.forEach((pitForm) => {
                                    dataArray.push({
                                        'Team Number': pitForm.teamNumber,
                                        'Robot Image': pitForm.robotImage,
                                        'Wiring Image': pitForm.wiringImage
                                    });
                                });

                                const dataJSON = XLSX.utils.json_to_sheet(dataArray);
                                if (excelType) {
                                    const wb = {
                                        Sheets: { 'Image Raw Data': dataJSON },
                                        SheetNames: ['Image Raw Data']
                                    };
                                    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                                    const sheetData = new Blob([excelBuffer], { type: fileType });
                                    FileSaver.saveAs(sheetData, `${currentEvent.name}_ImageRawData.xlsx`);
                                } else {
                                    const csvData = new Blob([XLSX.utils.sheet_to_csv(dataJSON)]);
                                    FileSaver.saveAs(csvData, `${currentEvent.name}_ImageRawData.csv`);
                                }
                            });
                    }}
                >
                    Download image raw data
                </Button>
                <Button
                    width={'fit-content'}
                    onClick={() => {
                        let matchesPromise = fetch('/matchForm/getMatchForms', {
                            headers: {
                                filters: JSON.stringify({
                                    eventKey: currentEvent.key,
                                    standStatus: [matchFormStatus.complete, matchFormStatus.noShow],
                                    superStatus: [matchFormStatus.complete, matchFormStatus.noShow]
                                })
                            }
                        });
                        let pitFormsPromise = fetch('/pitForm/getPitForms', {
                            headers: {
                                filters: JSON.stringify({
                                    eventKey: currentEvent.key,
                                    followUp: false
                                })
                            }
                        });

                        Promise.all([matchesPromise, pitFormsPromise])
                            .then((responses) =>
                                Promise.all(
                                    responses.map((response) => {
                                        if (response.status === 200) {
                                            return response.json();
                                        } else {
                                            throw new Error(response.statusText);
                                        }
                                    })
                                )
                            )
                            .then((data) => {
                                let matches = sortMatches(data[0]);
                                let pitForms = data[1];
                                console.log(data);
                                let teamMatchCount = {};
                                matches.forEach((matchForm) => {
                                    if (!Object.hasOwn(teamMatchCount, matchForm.teamNumber)) {
                                        matchForm.matchIndex = 1;
                                        teamMatchCount[matchForm.teamNumber] = 1;
                                    } else {
                                        teamMatchCount[matchForm.teamNumber] += 1;
                                        matchForm.matchIndex = teamMatchCount[matchForm.teamNumber];
                                    }
                                });

                                matches.sort((a, b) => {
                                    let diff = a.teamNumber - b.teamNumber;
                                    if (diff === 0) {
                                        diff = a.matchIndex - b.matchIndex;
                                    }
                                    return diff;
                                });

                                const fileType =
                                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                                let dataArray = [];
                                matches.forEach((matchForm) => {
                                    let obj;
                                    if (matchForm.standStatus === matchFormStatus.noShow) {
                                        obj = getNoShowMatchValues(matchForm);
                                    } else {
                                        obj = {
                                            'Team Number': matchForm.teamNumber,
                                            'Team Name':
                                                currentEvent.teams.find((team) => matchForm.teamNumber === team.number)
                                                    ?.name || 'N/A',
                                            'Match Number': matchForm.matchIndex,
                                            'Match Name': convertMatchKeyToString(matchForm.matchNumber),
                                            Station: matchForm.station,
                                            'Stand Scouter': matchForm.standScouter,
                                            'Super Scouter': matchForm.superScouter,
                                            'Starting Position': matchForm.startingPosition,
                                            'Preloaded Piece': matchForm.preloadedPiece,
                                            'Left Start': matchForm.leftStart ? 1 : 0,
                                            'Auto Intake Miss': matchForm.autoGP.intakeMiss,
                                            'Auto Amp Scored': matchForm.autoGP.ampScore,
                                            'Auto Speaker Scored': matchForm.autoGP.speakerScore,
                                            'Auto Amp Miss': matchForm.autoGP.ampMiss,
                                            'Auto Speaker Miss': matchForm.autoGP.speakerMiss,
                                            'Auto Points': matchForm.autoPoints,
                                            'Teleop Intake Source': matchForm.teleopGP.intakeSource,
                                            'Teleop Intake Ground': matchForm.teleopGP.intakeGround,
                                            'Teleop Amp Scored': matchForm.teleopGP.ampScore,
                                            'Teleop Speaker Scored': matchForm.teleopGP.speakerScore,
                                            'Teleop Amp Miss': matchForm.teleopGP.ampMiss,
                                            'Teleop Speaker Miss': matchForm.teleopGP.speakerMiss,
                                            'Teleop Ferry': matchForm.teleopGP.ferry,
                                            'Teleop Points': matchForm.teleopPoints,
                                            'Climb Attempt': matchForm.climb.attempt,
                                            'Climb Boolean': matchForm.climb.attempt === 'Success' ? 1 : 0,
                                            'Climb Location': matchForm.climb.location || 'N/A',
                                            Harmony: matchForm.climb.harmony === null ? 'N/A' : matchForm.climb.harmony,
                                            Park: matchForm.climb.park ? 1 : matchForm.park === null ? 'N/A' : 0,
                                            Trap: matchForm.teleopGP.trap,
                                            'Stage Points': matchForm.stagePoints,
                                            'Offensive Points': matchForm.offensivePoints,
                                            'Was Defended': matchForm.wasDefended ? 1 : 0,
                                            'Defense Rating': matchForm.defenseRating,
                                            'Defense Allocation': matchForm.defenseAllocation,
                                            Agility: matchForm.agility,
                                            'Field Awareness': matchForm.fieldAwareness,
                                            'Amp Player': matchForm.ampPlayer ? 1 : 0,
                                            'High Note Score': matchForm.ampPlayerGP.highNoteScore,
                                            'High Note Miss': matchForm.ampPlayerGP.highNoteMiss,
                                            'Lost Communication': matchForm.lostCommunication ? 1 : 0,
                                            'Robot Broke': matchForm.robotBroke ? 1 : 0,
                                            'Yellow Card': matchForm.yellowCard ? 1 : 0,
                                            'Red Card': matchForm.redCard ? 1 : 0,
                                            'Stand Status': matchForm.standStatus,
                                            'Super Status': matchForm.superStatus
                                        };
                                    }
                                    let pitForm = pitForms.find(
                                        (pitForm) => pitForm.teamNumber === matchForm.teamNumber
                                    );
                                    if (pitForm) {
                                        obj['Drive Train'] = pitForm.driveTrain;
                                        obj['Weight'] = pitForm.weight;
                                    }
                                    dataArray.push(obj);
                                });

                                const dataJSON = XLSX.utils.json_to_sheet(dataArray);
                                if (excelType) {
                                    const wb = {
                                        Sheets: { 'Tableau Raw Data': dataJSON },
                                        SheetNames: ['Tableau Raw Data']
                                    };
                                    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                                    const sheetData = new Blob([excelBuffer], { type: fileType });
                                    FileSaver.saveAs(sheetData, `${currentEvent.name}_TableauRawData.xlsx`);
                                } else {
                                    const csvData = new Blob([XLSX.utils.sheet_to_csv(dataJSON)]);
                                    FileSaver.saveAs(csvData, `${currentEvent.name}_TableauRawData.csv`);
                                }
                            });
                    }}
                >
                    Download tableau data
                </Button>
            </Flex>
        </Box>
    );
}

export default DataExtractPage;
