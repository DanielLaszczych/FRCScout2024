import { CheckCircleIcon, EditIcon, WarningIcon } from '@chakra-ui/icons';
import {
    Box,
    Button,
    Center,
    Grid,
    GridItem,
    IconButton,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    Text
} from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';

function PitsMemo({ eventData, pitForms, currentEvent }) {
    function getPitFormStatusIcon(teamNumber) {
        let pitForm = null;
        for (const pitFormData of pitForms) {
            if (pitFormData.teamNumber === teamNumber) {
                pitForm = pitFormData;
                break;
            }
        }
        if (pitForm === null) {
            return <EditIcon />;
        } else if (pitForm.followUp) {
            return <WarningIcon />;
        } else {
            return <CheckCircleIcon />;
        }
    }

    function getPitFormScouter(teamNumber) {
        for (const pitFormData of pitForms) {
            if (pitFormData.teamNumber === teamNumber) {
                let nameArr = pitFormData.scouter.split(' ');
                return nameArr[0] + ' ' + nameArr[1].charAt(0) + '.';
            }
        }
        return 'N/A';
    }

    function getPitFormFollowUpComment(teamNumber) {
        for (const pitFormData of pitForms) {
            if (pitFormData.teamNumber === teamNumber) {
                return pitFormData.followUpComment;
            }
        }
        return 'No Comment';
    }

    function getPitFormStatusColor(teamNumber) {
        let pitForm = null;
        for (const pitFormData of pitForms) {
            if (pitFormData.teamNumber === teamNumber) {
                pitForm = pitFormData;
                break;
            }
        }
        if (pitForm === null) {
            return 'gray';
        } else if (pitForm.followUp) {
            return 'yellow';
        } else {
            return 'green';
        }
    }

    return (
        <Box borderRadius={'0px 0px 10px 10px'} border={'1px solid black'} borderTop={'none'}>
            {eventData.length === 0 ? (
                <Center padding={'10px 0px'}>
                    <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'} width={'90%'}>
                        No pit forms marked for follow up or missing
                    </Text>
                </Center>
            ) : (
                <Grid borderTop={'1px solid black'} templateColumns='1fr 1.5fr 1fr 1fr'>
                    {eventData.map((team, index) => (
                        <React.Fragment key={team.key}>
                            <GridItem
                                fontSize={'md'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                                borderBottom={index < eventData.length - 1 && '1px solid black'}
                            >
                                {team.number}
                            </GridItem>
                            <GridItem
                                fontSize={'md'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                                borderBottom={index < eventData.length - 1 && '1px solid black'}
                                padding={'10px 0px'}
                            >
                                {team.name}
                            </GridItem>
                            <GridItem
                                fontSize={'md'}
                                fontWeight={'medium'}
                                textAlign={'center'}
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                                borderBottom={index < eventData.length - 1 && '1px solid black'}
                            >
                                {getPitFormScouter(team.number)}
                            </GridItem>
                            <GridItem
                                display={'flex'}
                                justifyContent={'center'}
                                alignItems={'center'}
                                backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                                borderBottom={index < eventData.length - 1 && '1px solid black'}
                            >
                                {getPitFormStatusColor(team.number) !== 'yellow' ? (
                                    <IconButton
                                        icon={getPitFormStatusIcon(team.number)}
                                        colorScheme={getPitFormStatusColor(team.number)}
                                        backgroundColor={
                                            getPitFormStatusColor(team.number) === 'gray' ? 'gray.300' : 'green.500'
                                        }
                                        _hover={{
                                            backgroundColor:
                                                getPitFormStatusColor(team.number) === 'gray' ? 'gray.400' : 'green.600'
                                        }}
                                        size='sm'
                                        as={Link}
                                        to={`/pitForm/${currentEvent.key}/${team.number}`}
                                        state={{ previousRoute: 'pits' }}
                                    />
                                ) : (
                                    <Popover flip={true} placement='bottom'>
                                        <PopoverTrigger>
                                            <IconButton
                                                icon={getPitFormStatusIcon(team.number)}
                                                colorScheme={getPitFormStatusColor(team.number)}
                                                size='sm'
                                            />
                                        </PopoverTrigger>
                                        <PopoverContent maxWidth={'200px'}>
                                            <PopoverArrow />
                                            <PopoverCloseButton />
                                            <PopoverHeader
                                                margin={'0 auto'}
                                                maxWidth={'75%'}
                                                fontSize={'md'}
                                                fontWeight={'semibold'}
                                                textAlign={'center'}
                                            >
                                                Follow Up Comment
                                            </PopoverHeader>
                                            <PopoverBody maxHeight={'100px'} overflowY={'auto'}>
                                                <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                                                    {getPitFormFollowUpComment(team.number)}
                                                </Text>
                                            </PopoverBody>
                                            <PopoverFooter margin={'0 auto'}>
                                                <Button
                                                    size='sm'
                                                    as={Link}
                                                    to={`/pitForm/${currentEvent.key}/${team.number}`}
                                                    state={{ previousRoute: 'pits' }}
                                                >
                                                    Go To
                                                </Button>
                                            </PopoverFooter>
                                        </PopoverContent>
                                    </Popover>
                                )}
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

export default React.memo(PitsMemo, areEqual);
