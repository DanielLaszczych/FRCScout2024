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
    Text,
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
        <Box borderRadius={'0px 0px 10px 10px'} border={'1px solid black'} borderTop={'none'} minH={'50px'}>
            {eventData.length === 0 ? (
                <Center paddingTop={'10px'} paddingBottom={'10px'}>
                    <Text textAlign={'center'} width={'90%'} fontSize={'20px'}>
                        No pit forms marked for follow up or missing
                    </Text>
                </Center>
            ) : (
                eventData.map((team, index) => (
                    <Grid
                        borderTop={'1px solid black'}
                        backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                        borderRadius={index % 2 === 0 ? 'none' : '0px 0px 10px 10px'}
                        key={team.key}
                        templateColumns='1fr 2fr 1fr 1fr'
                        gap={'5px'}
                    >
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                {team.number}
                            </Text>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                {team.name}
                            </Text>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                {getPitFormScouter(team.number)}
                            </Text>
                        </GridItem>
                        <GridItem padding={'10px 0px 10px 0px'} marginRight={'10px'} marginLeft={'10px'} textAlign={'center'}>
                            {getPitFormStatusColor(team.number) !== 'yellow' ? (
                                <IconButton
                                    icon={getPitFormStatusIcon(team.number)}
                                    colorScheme={getPitFormStatusColor(team.number)}
                                    backgroundColor={getPitFormStatusColor(team.number) === 'gray' ? 'gray.300' : 'green.500'}
                                    _hover={{ backgroundColor: getPitFormStatusColor(team.number) === 'gray' ? 'gray.400' : 'green.600' }}
                                    _focus={{ outline: 'none' }}
                                    size='sm'
                                    as={Link}
                                    to={`/pitForm/${currentEvent.key}/${team.number}`}
                                    state={{ previousRoute: 'pits' }}
                                />
                            ) : (
                                <Popover flip={true} placement='bottom'>
                                    <PopoverTrigger>
                                        <IconButton icon={getPitFormStatusIcon(team.number)} colorScheme={getPitFormStatusColor(team.number)} _focus={{ outline: 'none' }} size='sm' />
                                    </PopoverTrigger>
                                    <PopoverContent maxWidth={'50vw'} _focus={{ outline: 'none' }}>
                                        <PopoverArrow />
                                        <PopoverCloseButton />
                                        <PopoverHeader margin={'0 auto'} maxWidth={'165px'} color='black' fontSize='md' fontWeight='bold'>
                                            Follow Up Comment
                                        </PopoverHeader>
                                        <PopoverBody maxHeight={'125px'} overflowY={'auto'}>
                                            <Text>{getPitFormFollowUpComment(team.number)}</Text>
                                        </PopoverBody>
                                        <PopoverFooter>
                                            <Button _focus={{ outline: 'none' }} size='sm' as={Link} to={`/pitForm/${currentEvent.key}/${team.number}`} state={{ previousRoute: 'pits' }}>
                                                Go To
                                            </Button>
                                        </PopoverFooter>
                                    </PopoverContent>
                                </Popover>
                            )}
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

export default React.memo(PitsMemo, areEqual);
