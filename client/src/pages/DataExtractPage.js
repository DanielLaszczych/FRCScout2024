import React, { useEffect, useState } from 'react';
import { Box, Button, Flex } from '@chakra-ui/react';
import FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';
import { matchFormStatus } from '../util/helperConstants';
import { convertMatchKeyToString, sortMatches } from '../util/helperFunctions';

function DataExtractPage() {
    const [currentEvent, setCurrentEvent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/event/getCurrentEvent')
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then((data) => {
                if (!data) {
                    throw new Error('There is no event to scout 😔');
                } else {
                    console.log(data);
                    setCurrentEvent(data);
                }
            })
            .catch((error) => {
                setError(error.message);
            });
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

    if (currentEvent === null) {
        return null;
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
        <Flex
            justifyContent={'center'}
            alignItems={'center'}
            flexDirection={'column'}
            margin={'0 auto'}
            rowGap={'20px'}
        >
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
                            console.log(data);
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
                            const wb = { Sheets: { 'Team Raw Data': dataJSON }, SheetNames: ['Team Raw Data'] };
                            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                            const sheetData = new Blob([excelBuffer], { type: fileType });
                            FileSaver.saveAs(sheetData, `${currentEvent.name}_TeamRawData.xlsx`);
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
                            console.log(data);
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
                            console.log(dataArray);
                            const dataJSON = XLSX.utils.json_to_sheet(dataArray);
                            const wb = { Sheets: { 'TIM Raw Data': dataJSON }, SheetNames: ['TIM Raw Data'] };
                            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                            const sheetData = new Blob([excelBuffer], { type: fileType });
                            FileSaver.saveAs(sheetData, `${currentEvent.name}_TIMRawData.xlsx`);
                        });
                }}
            >
                Download team in match data
            </Button>
        </Flex>
    );
}

export default DataExtractPage;
