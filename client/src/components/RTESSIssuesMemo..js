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
        <Box borderRadius={'0px 0px 10px 10px'} border={'1px solid black'} borderTop={'none'} minH={'50px'}>
            {rtessIssues.length === 0 ? (
                <Center paddingTop={'10px'} paddingBottom={'10px'}>
                    <Text textAlign={'center'} width={'90%'} fontSize={'20px'}>
                        {noRTESSIssues ? 'No RTESS issues reported yet' : filter.emptyMsg}
                    </Text>
                </Center>
            ) : (
                rtessIssues.map((rtessIssue, index) => (
                    <Grid
                        borderTop={'1px solid black'}
                        backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                        borderRadius={index % 2 === 0 ? 'none' : '0px 0px 10px 10px'}
                        key={rtessIssue._id}
                        templateColumns='1fr 1fr 1fr'
                        gap={'5px'}
                    >
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                {rtessIssue.teamNumber}
                            </Text>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'} noOfLines={2}>
                                {rtessIssue.issue}
                            </Text>
                        </GridItem>
                        <GridItem padding={'10px 0px 10px 0px'} textAlign={'center'}>
                            {getIcon(rtessIssue)}
                        </GridItem>
                    </Grid>
                ))
            )}
        </Box>
    );
}

function areEqual(prevProps, nextProps) {
    return prevProps.version === nextProps.version;
}

export default React.memo(RTESSIssuesMemo, areEqual);
