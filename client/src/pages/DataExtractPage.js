import React, { useEffect, useState } from 'react';
import { Box, Button, Center } from '@chakra-ui/react';
import FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';

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

    return (
        <Center>
            <Button
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
                                        currentEvent.teams.find((team) => ted.teamNumber === team.number).name || 'N/A',
                                    'Left Start': ted.leftStart,
                                    'Auto Intake Miss': ted.autoGP.intakeMiss.avg,
                                    'Auto Amp Scored': ted.autoGP.ampScore.avg,
                                    'Auto Speaker Scored': ted.autoGP.speakerScore.avg,
                                    'Auto Amp Miss': ted.autoGP.ampMiss.avg,
                                    'Auto Speaker MIss': ted.autoGP.speakerMiss.avg,
                                    'Auto Points': ted.autoPoints.avg,
                                    'Teleop Intake Source': ted.teleopGP.intakeSource.avg,
                                    'Teleop Intake Ground': ted.teleopGP.intakeGround.avg,
                                    'Teleop Amp Scored': ted.teleopGP.ampScore.avg,
                                    'Teleop Speaker Scored': ted.teleopGP.speakerScore.avg,
                                    'Teleop Amp Miss': ted.teleopGP.ampMiss.avg,
                                    'Teleop Speaker MIss': ted.teleopGP.speakerMiss.avg,
                                    'Teleop Ferry': ted.teleopGP.ferry.avg,
                                    'Teleop Points': ted.teleopPoints.avg,
                                    'Climb Percentage': ted.climbSuccessPercentage || 'N/A',
                                    'Park Percentage': ted.parkSuccessPercentage || 'N/A',
                                    Trap: ted.teleopGP.trap.avg,
                                    'Stage Points': ted.stagePoints.avg,
                                    'Offensive Points': ted.offensivePoints.avg,
                                    'Was Defended': ted.wasDefended,
                                    'Defense Rating': ted.defenseRating.avg || 'N/A',
                                    'Defense Allocation': ted.defenseAllocation.avg || 'N/A',
                                    Agility: ted.agility.avg,
                                    'Field Awareness': ted.fieldAwareness.avg,
                                    'High Note Percentage': ted.highNoteScorePercentage || 'N/A',
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
        </Center>
    );
}

export default DataExtractPage;
