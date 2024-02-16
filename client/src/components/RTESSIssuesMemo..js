import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { Box, Center, Grid, GridItem, IconButton, Text } from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';
import { HiWrenchScrewdriver } from 'react-icons/hi2';
import { rtessIssuesStatus } from '../util/helperConstants';

function RTESSIssuesMemo({ noRTESSIssues, rtessIssues, filter }) {
    function getIcon(rtessIssue) {
        switch (rtessIssue.status) {
            case rtessIssuesStatus.unresolved:
                return (
                    <IconButton
                        icon={<WarningIcon />}
                        colorScheme={'red'}
                        _focus={{ outline: 'none' }}
                        size='sm'
                        as={Link}
                        to={`/rtessIssue/${rtessIssue._id}`}
                        state={{ previousRoute: 'rtessIssues' }}
                    />
                );
            case rtessIssuesStatus.resolved:
                return (
                    <IconButton
                        icon={<CheckCircleIcon />}
                        colorScheme={'green'}
                        _focus={{ outline: 'none' }}
                        size='sm'
                        as={Link}
                        to={`/rtessIssue/${rtessIssue._id}`}
                        state={{ previousRoute: 'rtessIssues' }}
                    />
                );
            case rtessIssuesStatus.beingResolved:
            default:
                return (
                    <IconButton
                        icon={<HiWrenchScrewdriver />}
                        colorScheme={'yellow'}
                        _focus={{ outline: 'none' }}
                        size='sm'
                        as={Link}
                        to={`/rtessIssue/${rtessIssue._id}`}
                        state={{ previousRoute: 'rtessIssues' }}
                    />
                );
        }
    }

    return (
        <Box borderRadius={'0px 0px 10px 10px'} border={'1px solid black'} borderTop={'none'}>
            {rtessIssues.length === 0 ? (
                <Center padding={'10px 0px'} borderTop={'1px solid black'}>
                    <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'} width={'90%'}>
                        {noRTESSIssues ? 'No RTESS issues reported yet' : filter.emptyMsg}
                    </Text>
                </Center>
            ) : (
                <Grid borderTop={'1px solid black'} templateColumns={'1fr 1fr 1fr'}>
                    {rtessIssues.map((rtessIssue, index) => (
                        <React.Fragment key={rtessIssue._id}>
                            <GridItem
                                fontSize={'md'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                                borderBottom={index < rtessIssues.length - 1 && '1px solid black'}
                                borderRadius={index === rtessIssues.length - 1 && '0px 0px 0px 10px'}
                            >
                                {rtessIssue.teamNumber}
                            </GridItem>
                            <GridItem
                                fontSize={'md'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                                borderBottom={index < rtessIssues.length - 1 && '1px solid black'}
                            >
                                <Text noOfLines={2}>{rtessIssue.issue}</Text>
                            </GridItem>
                            <GridItem
                                fontSize={'md'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                                borderBottom={index < rtessIssues.length - 1 && '1px solid black'}
                                padding={'10px 0px'}
                                borderRadius={index === rtessIssues.length - 1 && '0px 0px 10px 0px'}
                            >
                                {getIcon(rtessIssue)}
                            </GridItem>
                        </React.Fragment>
                    ))}
                </Grid>
            )}
        </Box>
    );
}

function areEqual(prevProps, nextProps) {
    return prevProps.version === nextProps.version;
}

export default React.memo(RTESSIssuesMemo, areEqual);
