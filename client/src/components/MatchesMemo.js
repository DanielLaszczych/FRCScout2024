import { CheckCircleIcon, QuestionIcon, WarningIcon } from '@chakra-ui/icons';
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
    VStack,
} from '@chakra-ui/react';
import React from 'react';
import { MdOutlineDoNotDisturbAlt } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { matchFormStatus } from '../util/helperConstants';
import { capitalizeFirstLetter, convertMatchKeyToString, convertStationKeyToString } from '../util/helperFunctions';

function MatchesMemo({ noMatches, matches, currentEvent, filter, hasSecondaryFilter, accuarcyData }) {
    function getIcon(match) {
        return match.accuarcyData ? (
            <Popover flip={true} placement='bottom'>
                <PopoverTrigger>
                    <IconButton icon={<WarningIcon />} colorScheme={'orange'} _focus={{ outline: 'none' }} size='sm' />
                </PopoverTrigger>
                <PopoverContent maxWidth={'50vw'} _focus={{ outline: 'none' }} rootProps={{ style: { transform: 'scale(0)' } }}>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader margin={'0 auto'} maxWidth={'165px'} color='black' fontSize='md' fontWeight='bold'>
                        Scouting Error
                    </PopoverHeader>
                    <PopoverBody maxHeight={'125px'} overflowY={'auto'}>
                        <Box>
                            {Object.keys(match.accuarcyData).map((key, index) => (
                                <Box key={key} marginTop={index > 0 && '10px'}>
                                    <Text>
                                        {capitalizeFirstLetter(key)
                                            .match(/[A-Z][a-z]+|[0-9]+/g)
                                            .join(' ')}
                                        :
                                    </Text>
                                    <Box>
                                        <Text fontSize={'14px'}>
                                            Scouted: {match.accuarcyData[key].scouted} ({match.accuarcyData[key].true})
                                        </Text>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </PopoverBody>
                    <PopoverFooter>
                        <Button _focus={{ outline: 'none' }} size='sm' as={Link} to={match.link} state={{ previousRoute: 'matches', scoutingError: true }}>
                            Go To
                        </Button>
                    </PopoverFooter>
                </PopoverContent>
            </Popover>
        ) : match.status === matchFormStatus.missing ? (
            <IconButton icon={<QuestionIcon />} colorScheme={'purple'} _focus={{ outline: 'none' }} size='sm' as={Link} to={match.link} state={{ previousRoute: 'matches' }} />
        ) : ![matchFormStatus.followUp, matchFormStatus.noShow].includes(match.status) ? (
            <IconButton icon={<CheckCircleIcon />} colorScheme={'green'} _focus={{ outline: 'none' }} size='sm' as={Link} to={match.link} state={{ previousRoute: 'matches' }} />
        ) : match.status === matchFormStatus.noShow ? (
            <IconButton icon={<MdOutlineDoNotDisturbAlt />} colorScheme={'red'} _focus={{ outline: 'none' }} size='sm' as={Link} to={match.link} state={{ previousRoute: 'matches' }} />
        ) : (
            <Popover flip={true} placement='bottom'>
                <PopoverTrigger>
                    <IconButton icon={<WarningIcon />} colorScheme={'yellow'} _focus={{ outline: 'none' }} size='sm' />
                </PopoverTrigger>
                <PopoverContent maxWidth={'50vw'} _focus={{ outline: 'none' }} rootProps={{ style: { transform: 'scale(0)' } }}>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader margin={'0 auto'} maxWidth={'165px'} color='black' fontSize='md' fontWeight='bold'>
                        Follow Up Comment
                    </PopoverHeader>
                    <PopoverBody maxHeight={'125px'} overflowY={'auto'}>
                        <Text>{match.comment}</Text>
                    </PopoverBody>
                    <PopoverFooter>
                        <Button _focus={{ outline: 'none' }} size='sm' as={Link} to={match.link} state={{ previousRoute: 'matches' }}>
                            Go To
                        </Button>
                    </PopoverFooter>
                </PopoverContent>
            </Popover>
        );
    }

    function getMatchAccuarcy(match, accuarcyData) {
        let matchData = accuarcyData.find((accuarcy) => accuarcy.matchKey === match.matchNumber);
        if (matchData) {
            let stationData;
            if (match.station.charAt(0) === 'r') {
                stationData = matchData.red?.errors[match.teamNumber];
            } else {
                stationData = matchData.blue?.errors[match.teamNumber];
            }
            if (stationData) {
                stationData = Object.keys(stationData).length === 0 ? null : stationData;
            }
            return stationData;
        } else {
            return null;
        }
    }

    return (
        <Box borderRadius={'0px 0px 10px 10px'} border={'1px solid black'} borderTop={'none'} minH={'50px'}>
            {(noMatches && filter.key !== 'missing') || matches.length === 0 ? (
                <Center paddingTop={'10px'} paddingBottom={'10px'}>
                    <Text textAlign={'center'} width={'90%'} fontSize={'20px'}>
                        {noMatches ? 'No matches have been scouted yet' : hasSecondaryFilter ? 'No matches match the filters' : filter.emptyMsg}
                    </Text>
                </Center>
            ) : (
                matches.map((match, index) => (
                    <Grid
                        borderTop={'1px solid black'}
                        backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                        borderRadius={index % 2 === 0 ? 'none' : '0px 0px 10px 10px'}
                        key={match._id}
                        templateColumns='2fr 1fr 1fr 1fr'
                        gap={'5px'}
                    >
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                {convertMatchKeyToString(match.matchNumber)} : {convertStationKeyToString(match.station)}
                            </Text>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                {match.teamNumber}
                            </Text>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                            <VStack pos={'relative'} top={'50%'} transform={'translateY(-50%)'} spacing={`${8 + 10}px`}>
                                <Text>
                                    {[undefined, matchFormStatus.missing].includes(match.standStatus) ? 'N/A' : `${match.standScouter.split(' ')[0]}  ${match.standScouter.split(' ')[1].charAt(0)}.`}
                                </Text>
                                <Text>
                                    {[undefined, matchFormStatus.missing].includes(match.superStatus) ? 'N/A' : `${match.superScouter.split(' ')[0]}  ${match.superScouter.split(' ')[1].charAt(0)}.`}
                                </Text>
                            </VStack>
                        </GridItem>
                        <GridItem padding={'10px 0px 10px 0px'} textAlign={'center'}>
                            <VStack spacing={'10px'} position={'relative'}>
                                <Box position={'relative'}>
                                    {getIcon({
                                        accuarcyData: getMatchAccuarcy(match, accuarcyData),
                                        status: match.standStatus || matchFormStatus.missing,
                                        comment: match.standStatusComment,
                                        link: `/standForm/${currentEvent.key}/${match.matchNumber}/${match.station}/${match.teamNumber}`,
                                    })}
                                </Box>
                                {getIcon({
                                    status: match.superStatus || matchFormStatus.missing,
                                    comment: match.superStatusComment,
                                    link: `/superForm/${currentEvent.key}/${match.matchNumber}/${match.station[0]}/${match.allianceNumbers[0]}/${match.allianceNumbers[1]}/${match.allianceNumbers[2]}`,
                                })}
                            </VStack>
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

export default React.memo(MatchesMemo, areEqual);
