import {
    Box,
    Center,
    Flex,
    Grid,
    GridItem,
    IconButton,
    Image as ChakraImage,
    ListItem,
    OrderedList,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverTrigger,
    Spinner,
    Tag,
    Text,
    UnorderedList,
    VStack
} from '@chakra-ui/react';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    averageArr,
    capitalizeFirstLetter,
    convertMatchKeyToString,
    convertStationKeyToString,
    countOccurencesForTFField,
    getDeepFields,
    getDefenseAllocation,
    getDefenseRatings,
    getFields,
    getPercentageForTFField,
    joinStandAndSuperForms,
    medianArr,
    roundToHundredth,
    roundToWhole,
    sortMatches
} from '../util/helperFunctions';
import '../stylesheets/teamstyle.css';
import { GrMap } from 'react-icons/gr';
import RedField from '../images/RedField.png';
import BlueField from '../images/BlueField.png';
import { BiCommentEdit } from 'react-icons/bi';
import HeatMap from '../components/HeatMap';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../context/auth';
import { Link } from 'react-router-dom';
import { matchFormStatus } from '../util/helperConstants';
import { BsCone } from 'react-icons/bs';
import { IoCube } from 'react-icons/io5';
import { getAccuarcy, getAutoContribution, getTeleContribution, getTotalAccuarcy } from '../util/gameSpecificHelpers';

let doResize;
let imageWidth = 438;
let imageHeight = 438;

let abilityTypes = {
    ranking: 'ranking',
    checkbox: 'checkbox',
    radio: 'radio'
};
let subAbilityTypes = {
    radio: 'radio',
    comment: 'comment'
};

function TeamPageTabs({ tab, pitForm, superForms, filteredSuperForms, standForms, filteredStandForms, blueAllianceImage, dataMedian, teamNumberParam, teamName, currentEvent }) {
    const { user } = useContext(AuthContext);
    const [currentPopoverData, setCurrentPopoverData] = useState(null);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1200);
    const prevWidth = useRef(window.innerWidth);

    const updateDesktop = () => {
        setIsDesktop(window.innerWidth > 1300);
    };

    useEffect(() => {
        window.addEventListener('resize', updateDesktop);

        return () => window.removeEventListener('resize', updateDesktop);
    }, []);

    function calculatePopoverImageScale(isPit) {
        let scale;
        let screenWidth = window.innerWidth;
        let isDesktop = window.innerWidth > 1200;
        if (screenWidth < 768) {
            scale = isPit ? 0.4 : isDesktop ? 0.5 : 0.25;
        } else if (screenWidth < 992) {
            scale = isDesktop ? 0.35 : 0.175;
        } else {
            scale = isDesktop ? 0.2 : 0.15;
        }
        return (screenWidth / imageWidth) * scale;
    }

    function calculatePopoverCircleRadius(isPit) {
        let scale;
        let screenWidth = window.innerWidth;
        let isDesktop = window.innerWidth > 1200;
        if (screenWidth < 768) {
            scale = isPit ? 0.4 : isDesktop ? 0.5 : 0.25;
        } else if (screenWidth < 992) {
            scale = isDesktop ? 0.35 : 0.175;
        } else {
            scale = isDesktop ? 0.2 : 0.15;
        }
        return (screenWidth / 10) * scale;
    }

    const drawPopoverImage = useCallback(async (point, station, id, isPit = false) => {
        while (document.getElementById(`${id}`) === null) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        const canvasElement = document.getElementById(`${id}`);
        if (canvasElement !== null) {
            const ctx = canvasElement.getContext('2d');
            let img = new Image();
            img.src = station.charAt(0) === 'r' ? RedField : BlueField;
            img.onload = () => {
                let scale = calculatePopoverImageScale(isPit);
                canvasElement.width = imageWidth * scale;
                canvasElement.height = imageHeight * scale;
                ctx.drawImage(img, 0, 0, imageWidth * scale, imageHeight * scale);
                if (point.x && point.y) {
                    let ctx = canvasElement.getContext('2d');
                    ctx.lineWidth = '4';
                    ctx.strokeStyle = 'green';
                    ctx.beginPath();
                    ctx.arc(point.x * calculatePopoverImageScale(isPit), point.y * calculatePopoverImageScale(isPit), calculatePopoverCircleRadius(isPit), 0, 2 * Math.PI);
                    ctx.stroke();
                }
            };
        }
    }, []);

    const resizePopover = useCallback(() => {
        if (tab === 'stand' || tab === 'pit') {
            clearTimeout(doResize);
            if (window.innerWidth !== prevWidth.current) {
                prevWidth.current = window.innerWidth;
                if (isDesktop && currentPopoverData !== null && tab === 'stand') {
                    doResize = setTimeout(() => drawPopoverImage(currentPopoverData.point, currentPopoverData.station, currentPopoverData.id), 250);
                } else if (tab === 'stand') {
                    doResize = setTimeout(() => sortMatches(filteredStandForms).map((stand) => drawPopoverImage(stand.startingPosition, stand.station, stand._id)), 250);
                } else if (tab === 'pit' && pitForm !== null) {
                    doResize = setTimeout(() => drawPopoverImage(pitForm.startingPosition, 'r', pitForm._id, true), 250);
                }
            }
        } else {
            clearTimeout(doResize);
        }
    }, [tab, drawPopoverImage, currentPopoverData, isDesktop, filteredStandForms, pitForm]);

    useEffect(() => {
        window.addEventListener('resize', resizePopover);

        return () => window.removeEventListener('resize', resizePopover);
    }, [resizePopover]);

    useEffect(() => {
        if (tab === 'stand' && !isDesktop) {
            prevWidth.current = window.innerWidth;
            sortMatches(filteredStandForms).map((stand) => drawPopoverImage(stand.startingPosition, stand.station, stand._id));
        } else if (tab === 'pit' && pitForm) {
            drawPopoverImage(pitForm.startingPosition, 'r', pitForm._id, true);
        }
    }, [tab, isDesktop, filteredStandForms, drawPopoverImage, pitForm]);

    function renderAbilities(ability, index) {
        return (
            <Box key={ability.label + index} marginTop={index > 0 && '5px'}>
                <Text display={'inline-block'} fontWeight={'600'} fontSize={'110%'}>
                    {ability.label}:
                </Text>
                {(() => {
                    switch (ability.type) {
                        case abilityTypes.radio:
                            return (
                                <Text display={'inline-block'} fontWeight={'600'} fontSize={'110%'}>
                                    &nbsp;{`${ability.abilities[0].label}`}
                                </Text>
                            );
                        case abilityTypes.checkbox:
                            return (
                                <UnorderedList>
                                    {ability.abilities.map((subAbility) => {
                                        return (
                                            <ListItem marginLeft={'15px'} key={subAbility.label} fontWeight={'600'} fontSize={'100%'}>
                                                <Text fontWeight={'600'} fontSize={'100%'}>
                                                    {subAbility.label}
                                                </Text>
                                                {subAbility?.subType === subAbilityTypes.comment && (
                                                    <Text marginLeft={'10px'} fontWeight={'500'} fontSize={'90%'}>
                                                        Method: {subAbility.subField}
                                                    </Text>
                                                )}
                                            </ListItem>
                                        );
                                    })}
                                    ;
                                </UnorderedList>
                            );
                        case abilityTypes.ranking:
                            return (
                                <OrderedList>
                                    {ability.abilities.map((subAbility) => {
                                        return (
                                            <ListItem marginLeft={'15px'} key={subAbility.label} fontWeight={'600'} fontSize={'100%'}>
                                                <Text display={'inline-block'} fontWeight={'600'} fontSize={'100%'}>
                                                    {subAbility.label}
                                                </Text>
                                                {subAbility?.subType === subAbilityTypes.radio && (
                                                    <Text display={'inline-block'} fontWeight={'600'} fontSize={'100%'}>
                                                        &nbsp;{`(${subAbility.subField})`}
                                                    </Text>
                                                )}
                                            </ListItem>
                                        );
                                    })}
                                    ;
                                </OrderedList>
                            );
                        default:
                            return null;
                    }
                })()}
            </Box>
        );
    }

    function renderTab(tab) {
        switch (tab) {
            case 'overview':
                return (
                    <Flex flexWrap={'wrap'} marginBottom={'25px'}>
                        <Box flex={1} className='robotFlex1'>
                            <Box w={'100%'} margin={'0 auto'} marginBottom={'25px'} textAlign={'center'} padding={'0px 10px'}>
                                <Text marginBottom={'0px'} fontWeight={'600'} fontSize={'150%'}>
                                    Team Number: {teamNumberParam}
                                </Text>
                                <Text marginBottom={'0px'} fontWeight={'600'} fontSize={'150%'}>
                                    Team Name: {teamName}
                                </Text>
                                <Text marginBottom={'0px'} fontWeight={'600'} fontSize={'150%'}>
                                    Pit Form: {pitForm ? 'Completed' : 'Not Complete'}
                                </Text>
                                <Text marginBottom={'0px'} fontWeight={'600'} fontSize={'150%'}>
                                    Stand Forms: {standForms.length}
                                </Text>
                                <Text marginBottom={'0px'} fontWeight={'600'} fontSize={'150%'}>
                                    Super Forms: {superForms.length}
                                </Text>
                            </Box>
                            {pitForm && pitForm.image !== '' ? (
                                <ChakraImage
                                    margin={'0 auto'}
                                    w={{ base: '75%', sm: '75%', md: '75%', lg: '55%' }}
                                    minW={{ base: '75%', sm: '75%', md: '75%', lg: '55%' }}
                                    maxW={{ base: '75%', sm: '75%', md: '75%', lg: '55%' }}
                                    src={pitForm.image}
                                />
                            ) : blueAllianceImage !== null ? (
                                <ChakraImage
                                    margin={'0 auto'}
                                    w={{ base: '75%', sm: '75%', md: '75%', lg: '55%' }}
                                    minW={{ base: '75%', sm: '75%', md: '75%', lg: '55%' }}
                                    maxW={{ base: '75%', sm: '75%', md: '75%', lg: '55%' }}
                                    src={blueAllianceImage}
                                />
                            ) : (
                                <Box w={{ base: '90%', sm: '75%' }} margin={'0 auto'} boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'} textAlign={'center'} borderRadius={'10px'} padding={'10px'}>
                                    No Image Available
                                </Box>
                            )}
                        </Box>
                        <Flex flexWrap={'wrap'} flexDir={'row'} gap={'30px'} flex={1} padding={'25px'} className='robotFlex2'>
                            <Box
                                minW={{ base: '90%', lg: '40%' }}
                                w={{ base: '90%', lg: '40%' }}
                                margin={'0 auto'}
                                flex={1}
                                boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'}
                                textAlign={'start'}
                                borderRadius={'10px'}
                                padding={'10px'}
                            >
                                <Text textAlign={'center'} marginBottom={'5px'} textDecoration={'underline'} fontWeight={'bold'} fontSize={'125%'}>
                                    Auto:
                                </Text>
                                {filteredStandForms.length > 0 ? (
                                    <Box>
                                        {['top', 'middle', 'bottom'].map((row) => (
                                            <Box key={row} marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                                {capitalizeFirstLetter(row)}:
                                                <Box marginLeft={'15px'}>
                                                    <Text fontSize={'90%'}>
                                                        Cone(s):{' '}
                                                        {dataMedian
                                                            ? medianArr(getDeepFields(filteredStandForms, `${row}Auto`, 'coneScored'))
                                                            : averageArr(getDeepFields(filteredStandForms, `${row}Auto`, 'coneScored'))}{' '}
                                                        ({getTotalAccuarcy(filteredStandForms, 'auto', row, 'cone')})
                                                    </Text>
                                                    <Text fontSize={'90%'}>
                                                        Cube(s):{' '}
                                                        {dataMedian
                                                            ? medianArr(getDeepFields(filteredStandForms, `${row}Auto`, 'cubeScored'))
                                                            : averageArr(getDeepFields(filteredStandForms, `${row}Auto`, 'cubeScored'))}{' '}
                                                        ({getTotalAccuarcy(filteredStandForms, 'auto', row, 'cube')})
                                                    </Text>
                                                </Box>
                                            </Box>
                                        ))}
                                        <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            Mobility Percentage: {roundToWhole(getPercentageForTFField(filteredStandForms, 'crossCommunity') * 100)}%
                                        </Text>
                                        <Box marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            Charges:
                                            {filteredStandForms.some((e) => e.chargeAuto !== 'No Attempt' && e.chargeAuto !== 'None') ? (
                                                <Box marginLeft={'15px'}>
                                                    <Text fontSize={'90%'}>Dock(s): {filteredStandForms.filter((e) => e.chargeAuto === 'Dock').length}</Text>
                                                    <Text fontSize={'90%'}>Engage(s): {filteredStandForms.filter((e) => e.chargeAuto === 'Engage').length}</Text>
                                                    <Text fontSize={'90%'}>Fail(s): {filteredStandForms.filter((e) => e.chargeAuto === 'Fail').length}</Text>
                                                </Box>
                                            ) : (
                                                ' No Attempts'
                                            )}
                                        </Box>
                                        <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            Points Contributed ({dataMedian ? 'Med.' : 'Avg.'}):{' '}
                                            {dataMedian ? medianArr(getAutoContribution(filteredStandForms)) : averageArr(getAutoContribution(filteredStandForms))} pts.
                                        </Text>
                                    </Box>
                                ) : (
                                    <Text marginBottom={'0px'} fontWeight={'600'} fontSize={'110%'}>
                                        No Stand Data
                                    </Text>
                                )}
                            </Box>
                            <Box
                                minW={{ base: '90%', lg: '40%' }}
                                w={{ base: '90%', lg: '40%' }}
                                margin={'0 auto'}
                                flex={1}
                                boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'}
                                textAlign={'start'}
                                borderRadius={'10px'}
                                padding={'10px'}
                            >
                                <Text textAlign={'center'} marginBottom={'5px'} textDecoration={'underline'} fontWeight={'bold'} fontSize={'125%'}>
                                    Teleop:
                                </Text>
                                {filteredStandForms.length > 0 ? (
                                    <Box>
                                        {['top', 'middle', 'bottom'].map((row) => (
                                            <Box key={row} marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                                {capitalizeFirstLetter(row)}:
                                                <Box marginLeft={'15px'}>
                                                    <Text fontSize={'90%'}>
                                                        Cone(s):{' '}
                                                        {dataMedian
                                                            ? medianArr(getDeepFields(filteredStandForms, `${row}Tele`, 'coneScored'))
                                                            : averageArr(getDeepFields(filteredStandForms, `${row}Tele`, 'coneScored'))}{' '}
                                                        ({getTotalAccuarcy(filteredStandForms, 'tele', row, 'cone')})
                                                    </Text>
                                                    <Text fontSize={'90%'}>
                                                        Cube(s):{' '}
                                                        {dataMedian
                                                            ? medianArr(getDeepFields(filteredStandForms, `${row}Tele`, 'cubeScored'))
                                                            : averageArr(getDeepFields(filteredStandForms, `${row}Tele`, 'cubeScored'))}{' '}
                                                        ({getTotalAccuarcy(filteredStandForms, 'tele', row, 'cube')})
                                                    </Text>
                                                </Box>
                                            </Box>
                                        ))}
                                        <Box marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            Charges:
                                            {filteredStandForms.some((e) => e.chargeTele !== 'No Attempt') ? (
                                                <Box marginLeft={'15px'}>
                                                    <Text fontSize={'90%'}>Dock(s): {filteredStandForms.filter((e) => e.chargeTele === 'Dock').length}</Text>
                                                    <Text fontSize={'90%'}>Engage(s): {filteredStandForms.filter((e) => e.chargeTele === 'Engage').length}</Text>
                                                    <Text fontSize={'90%'}>Fail(s): {filteredStandForms.filter((e) => e.chargeTele === 'Fail').length}</Text>
                                                </Box>
                                            ) : (
                                                ' No Attempts'
                                            )}
                                        </Box>
                                        <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            Points Contributed ({dataMedian ? 'Med.' : 'Avg.'}):{' '}
                                            {dataMedian ? medianArr(getTeleContribution(filteredStandForms)) : averageArr(getTeleContribution(filteredStandForms))} pts.
                                        </Text>
                                    </Box>
                                ) : (
                                    <Text marginBottom={'0px'} fontWeight={'600'} fontSize={'110%'}>
                                        No Stand Data
                                    </Text>
                                )}
                            </Box>
                            <Box
                                minW={{ base: '90%', lg: '40%' }}
                                w={{ base: '90%', lg: '40%' }}
                                margin={'0 auto'}
                                flex={{ base: 1, lg: 0.5 }}
                                boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'}
                                textAlign={'start'}
                                borderRadius={'10px'}
                                padding={'10px'}
                            >
                                <Text textAlign={'center'} marginBottom={'5px'} textDecoration={'underline'} fontWeight={'bold'} fontSize={'125%'}>
                                    Ratings:
                                </Text>
                                {filteredSuperForms.length > 0 ? (
                                    <Box>
                                        <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            Defense Rating ({dataMedian ? 'Med.' : 'Avg.'}):{' '}
                                            {dataMedian ? medianArr(getDefenseRatings(filteredSuperForms)) : averageArr(getDefenseRatings(filteredSuperForms))} (1-3)
                                        </Text>
                                        <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            Defense Allocation ({dataMedian ? 'Med.' : 'Avg.'}):{' '}
                                            {getDefenseAllocation(filteredSuperForms).length === 0
                                                ? 'N/A'
                                                : `${roundToWhole((dataMedian ? medianArr(getDefenseAllocation(filteredSuperForms)) : averageArr(getDefenseAllocation(filteredSuperForms))) * 100)}%`}
                                        </Text>
                                        <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            Quickness ({dataMedian ? 'Med.' : 'Avg.'}):{' '}
                                            {dataMedian ? medianArr(getFields(filteredSuperForms, 'quickness')) : averageArr(getFields(filteredSuperForms, 'quickness'))} (1-3)
                                        </Text>
                                        <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            Driver Awareness ({dataMedian ? 'Med.' : 'Avg.'}):{' '}
                                            {dataMedian ? medianArr(getFields(filteredSuperForms, 'driverAwareness')) : averageArr(getFields(filteredSuperForms, 'driverAwareness'))} (1-3)
                                        </Text>
                                    </Box>
                                ) : (
                                    <Text marginBottom={'0px'} fontWeight={'600'} fontSize={'110%'}>
                                        No Super Data
                                    </Text>
                                )}
                            </Box>
                            <Box
                                minW={{ base: '90%', lg: '40%' }}
                                w={{ base: '90%', lg: '40%' }}
                                margin={'0 auto'}
                                flex={{ base: 1, lg: 0.5 }}
                                boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'}
                                textAlign={'start'}
                                borderRadius={'10px'}
                                padding={'10px'}
                            >
                                <Text textAlign={'center'} marginBottom={'5px'} textDecoration={'underline'} fontWeight={'bold'} fontSize={'125%'}>
                                    Concerns:
                                </Text>
                                {filteredStandForms.length > 0 ? (
                                    <Box>
                                        <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            # of Lost Communication: {countOccurencesForTFField(filteredStandForms, 'lostCommunication')}
                                        </Text>
                                        <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            # of Robot Broke: {countOccurencesForTFField(filteredStandForms, 'robotBroke')}
                                        </Text>
                                        <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            # of Yellow Card: {countOccurencesForTFField(filteredStandForms, 'yellowCard')}
                                        </Text>
                                        <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                            # of Red Card: {countOccurencesForTFField(filteredStandForms, 'redCard')}
                                        </Text>
                                    </Box>
                                ) : (
                                    <Text marginBottom={'0px'} fontWeight={'600'} fontSize={'110%'}>
                                        No Stand Data
                                    </Text>
                                )}
                            </Box>
                        </Flex>
                    </Flex>
                );
            case 'pit':
                return pitForm ? (
                    <Box marginBottom={'25px'}>
                        <Box
                            w={{ base: '90%', sm: '75%' }}
                            margin={'0 auto'}
                            boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'}
                            backgroundColor={'white'}
                            marginBottom={'25px'}
                            textAlign={'start'}
                            borderRadius={'10px'}
                            padding={'10px'}
                        >
                            <Text textAlign={'center'} marginBottom={'5px'} textDecoration={'underline'} fontWeight={'bold'} fontSize={'125%'}>
                                Basics:
                            </Text>
                            <Box>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Weight: {pitForm.weight} lbs
                                </Text>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Height: {pitForm.height} inches
                                </Text>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Frame Size: {pitForm.frameSize.width} in. by {pitForm.frameSize.length} in.
                                </Text>
                            </Box>
                        </Box>
                        <Box
                            w={{ base: '90%', sm: '75%' }}
                            margin={'0 auto'}
                            boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'}
                            backgroundColor={'white'}
                            marginBottom={'25px'}
                            textAlign={'start'}
                            borderRadius={'10px'}
                            padding={'10px'}
                        >
                            <Text textAlign={'center'} marginBottom={'5px'} textDecoration={'underline'} fontWeight={'bold'} fontSize={'125%'}>
                                Drive Train:
                            </Text>
                            <Box>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Type: {pitForm.driveTrain}
                                </Text>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Motors:
                                </Text>
                                {pitForm.motors.map((motor) => (
                                    <Text marginLeft={'15px'} key={motor._id} fontWeight={'600'} fontSize={'100%'}>{`${motor.label} (${motor.value})`}</Text>
                                ))}
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Wheel:
                                </Text>
                                {pitForm.wheels.map((wheel) => (
                                    <Text marginLeft={'15px'} key={wheel._id} fontWeight={'600'} fontSize={'100%'}>{`${wheel.label} (${wheel.value}), ${wheel.size} in`}</Text>
                                ))}
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Stats:
                                </Text>
                                {pitForm.driveStats.map((stat) => (
                                    <Box key={stat._id}>
                                        <Text marginLeft={'15px'} fontWeight={'600'} fontSize={'100%'} textDecoration={'underline'}>{`Ratio - ${roundToHundredth(stat.drivenGear)} : ${
                                            stat.drivingGear
                                        }`}</Text>
                                        <Text marginLeft={'25px'} fontWeight={'600'} fontSize={'100%'}>{`Free Speed: ${roundToHundredth(stat.freeSpeed)} ft/s`}</Text>
                                        <Text marginLeft={'25px'} fontWeight={'600'} fontSize={'100%'}>{`Pushing Power (0-100): ${roundToHundredth(stat.pushingPower)}`}</Text>
                                    </Box>
                                ))}
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Comment: <span style={{ fontWeight: '600', fontSize: '95%' }}>{pitForm.driveTrainComment}</span>
                                </Text>
                            </Box>
                        </Box>
                        <Box
                            w={{ base: '90%', sm: '75%' }}
                            margin={'0 auto'}
                            boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'}
                            backgroundColor={'white'}
                            marginBottom={'25px'}
                            textAlign={'start'}
                            borderRadius={'10px'}
                            padding={'10px'}
                        >
                            <Text textAlign={'center'} marginBottom={'5px'} textDecoration={'underline'} fontWeight={'bold'} fontSize={'125%'}>
                                Autonomous:
                            </Text>
                            <Box>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Programming Language: {pitForm.programmingLanguage}
                                </Text>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Prefered Starting Position:
                                </Text>
                                <Center marginBottom={'5px'}>
                                    <Spinner fontSize={'50px'} pos={'absolute'} zIndex={0}></Spinner>
                                    <canvas id={pitForm._id} width={imageWidth * calculatePopoverImageScale()} height={imageHeight * calculatePopoverImageScale()} style={{ zIndex: 0 }}></canvas>
                                </Center>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Best Auto: <span style={{ fontWeight: '600', fontSize: '95%' }}>{pitForm.autoComment}</span>
                                </Text>
                            </Box>
                        </Box>
                        <Box
                            w={{ base: '90%', sm: '75%' }}
                            margin={'0 auto'}
                            boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'}
                            backgroundColor={'white'}
                            marginBottom={'25px'}
                            textAlign={'start'}
                            borderRadius={'10px'}
                            padding={'10px'}
                        >
                            <Text textAlign={'center'} marginBottom={'5px'} textDecoration={'underline'} fontWeight={'bold'} fontSize={'125%'}>
                                Abilities:
                            </Text>
                            <Box marginBottom={'5px'}>{[...pitForm.autoAbilities, ...pitForm.teleAbilities].map((ability, index) => renderAbilities(ability, index))}</Box>
                        </Box>
                        <Box
                            w={{ base: '90%', sm: '75%' }}
                            margin={'0 auto'}
                            boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'}
                            backgroundColor={'white'}
                            textAlign={'start'}
                            borderRadius={'10px'}
                            padding={'10px'}
                        >
                            <Text textAlign={'center'} marginBottom={'5px'} textDecoration={'underline'} fontWeight={'bold'} fontSize={'125%'}>
                                Closing:
                            </Text>
                            <Box>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Total Batteries: {pitForm.batteryCount}
                                </Text>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Batteries Charging: {pitForm.chargingBatteryCount || 'N/A'}
                                </Text>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Working On: {pitForm.workingComment}
                                </Text>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    End Comment: {pitForm.closingComment}
                                </Text>
                            </Box>
                        </Box>
                    </Box>
                ) : (
                    <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                        No Pit Data
                    </Box>
                );
            case 'stand':
                return standForms.length > 0 ? (
                    <Box marginBottom={'25px'}>
                        {!isDesktop ? (
                            sortMatches(standForms).map((stand) =>
                                stand.standStatus === matchFormStatus.noShow ? (
                                    <div key={stand._id} className='grid'>
                                        <div className='grid-column'>
                                            <Box
                                                as={user.admin && Link}
                                                className='grid-item header'
                                                to={user.admin ? `/standForm/${currentEvent.key}/${stand.matchNumber}/${stand.station}/${teamNumberParam}` : ''}
                                                textDecoration={user.admin && 'underline'}
                                                state={{ previousRoute: 'team' }}
                                                _hover={{ backgroundColor: user.admin && 'gray.400' }}
                                                _active={{ backgroundColor: user.admin && 'gray.500' }}
                                            >
                                                {convertMatchKeyToString(stand.matchNumber)} : {convertStationKeyToString(stand.station)}
                                            </Box>
                                            <div className='grid-item header'>{`${stand.standScouter.split(' ')[0]}  ${stand.standScouter.split(' ')[1].charAt(0)}.`}</div>
                                        </div>
                                        <div className='grid-column' style={{ textAlign: 'center' }}>
                                            <div className='grid-item'>
                                                <Text className='grid-comment-item' flexBasis={'100px'} flexGrow={1} flexShrink={1} overflowY={'auto'} wordBreak={'break-word'}>
                                                    No Show: {stand.standStatusComment || 'None'}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={stand._id} className='grid'>
                                        <div className='grid-column'>
                                            <Box
                                                as={user.admin && Link}
                                                className='grid-item header'
                                                to={user.admin ? `/standForm/${currentEvent.key}/${stand.matchNumber}/${stand.station}/${teamNumberParam}` : ''}
                                                textDecoration={user.admin && 'underline'}
                                                state={{ previousRoute: 'team' }}
                                                _hover={{ backgroundColor: user.admin && 'gray.400' }}
                                                _active={{ backgroundColor: user.admin && 'gray.500' }}
                                            >
                                                {convertMatchKeyToString(stand.matchNumber)} : {convertStationKeyToString(stand.station)}
                                            </Box>
                                            <div className='grid-item header'>{`${stand.standScouter.split(' ')[0]}  ${stand.standScouter.split(' ')[1].charAt(0)}.`}</div>
                                        </div>
                                        <div className='grid-column'>
                                            <div className='grid-item header'>Pre-Auto</div>
                                            <div className='grid-item header'>Auto</div>
                                            <div className='grid-item header'>Post-Auto</div>
                                        </div>
                                        <div className='grid-column'>
                                            <div className='grid-item'>
                                                <Center paddingTop={'5px'} paddingBottom={'5px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    <Spinner pos={'absolute'} zIndex={-1}></Spinner>
                                                    <canvas
                                                        id={stand._id}
                                                        width={imageWidth * calculatePopoverImageScale()}
                                                        height={imageHeight * calculatePopoverImageScale()}
                                                        style={{ zIndex: 0 }}
                                                    ></canvas>
                                                </Center>
                                            </div>
                                            <div className='grid-item'>
                                                <div className='grid-text-item'>Pre-Loaded: {stand.preLoadedPiece}</div>
                                                <div className='grid-text-item'>
                                                    Top Row:{' '}
                                                    <Flex flexWrap={'wrap'} columnGap={'8px'} rowGap={'8px'} display='inline-flex' marginBottom={'8px'}>
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.topAuto.coneScored} ({getAccuarcy(stand, 'auto', 'top', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.topAuto.cubeScored} ({getAccuarcy(stand, 'auto', 'top', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                                <div className='grid-text-item'>
                                                    Middle Row:{' '}
                                                    <Flex flexWrap={'wrap'} columnGap={'8px'} rowGap={'8px'} display='inline-flex' marginBottom={'8px'}>
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.middleAuto.coneScored} ({getAccuarcy(stand, 'auto', 'middle', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.middleAuto.cubeScored} ({getAccuarcy(stand, 'auto', 'middle', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                                <div>
                                                    Bottom Row:{' '}
                                                    <Flex flexWrap={'wrap'} columnGap={'8px'} rowGap={'8px'} display='inline-flex' marginBottom={'8px'}>
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.bottomAuto.coneScored} ({getAccuarcy(stand, 'auto', 'bottom', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.bottomAuto.cubeScored} ({getAccuarcy(stand, 'auto', 'bottom', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                            </div>
                                            <Box className='grid-item'>
                                                <div className='grid-text-item'>Mobility: {stand.crossCommunity ? 'Yes' : 'No'}</div>
                                                <div className='grid-text-item'>Charge: {stand.chargeAuto}</div>
                                                <Text
                                                    className='grid-comment-item'
                                                    borderBottom={'2px solid black'}
                                                    flexBasis={'100px'}
                                                    flexGrow={1}
                                                    flexShrink={1}
                                                    overflowY={'auto'}
                                                    wordBreak={'break-word'}
                                                >
                                                    Charge Comment: {stand.autoChargeComment || 'None'}
                                                </Text>
                                                <Text className='grid-comment-item' flexBasis={'120px'} flexGrow={1} flexShrink={1} overflowY={'auto'} wordBreak={'break-word'}>
                                                    Auto Comment: {stand.standAutoComment || 'None'}
                                                </Text>
                                            </Box>
                                        </div>
                                        <div className='grid-column'>
                                            <div className='grid-item header'>Teleop</div>
                                            <div className='grid-item header'>End-Game</div>
                                            <div className='grid-item header'>Post-Game</div>
                                        </div>
                                        <div className='grid-column'>
                                            <div className='grid-item'>
                                                <div className='grid-text-item'>
                                                    Top Row:{' '}
                                                    <Flex flexWrap={'wrap'} columnGap={'8px'} rowGap={'8px'} display='inline-flex' marginBottom={'8px'}>
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.topTele.coneScored} ({getAccuarcy(stand, 'tele', 'top', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.topTele.cubeScored} ({getAccuarcy(stand, 'tele', 'top', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                                <div className='grid-text-item'>
                                                    Middle Row:{' '}
                                                    <Flex flexWrap={'wrap'} columnGap={'8px'} rowGap={'8px'} display='inline-flex' marginBottom={'8px'}>
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.middleTele.coneScored} ({getAccuarcy(stand, 'tele', 'middle', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.middleTele.cubeScored} ({getAccuarcy(stand, 'tele', 'middle', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                                <div>
                                                    Bottom Row:{' '}
                                                    <Flex flexWrap={'wrap'} columnGap={'8px'} rowGap={'8px'} display='inline-flex' marginBottom={'8px'}>
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.bottomTele.coneScored} ({getAccuarcy(stand, 'tele', 'bottom', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.bottomTele.cubeScored} ({getAccuarcy(stand, 'tele', 'bottom', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                            </div>
                                            <div className='grid-item'>
                                                <div className='grid-text-item'>Charge: {stand.chargeTele}</div>
                                                <div className='grid-text-item'># on Station: {stand.chargeRobotCount || 'N/A'}</div>
                                                <div className='grid-text-item'>Impaired Partners: {stand.impairedCharge ? 'Yes' : 'No'}</div>
                                                <Text
                                                    className='grid-comment-item'
                                                    borderBottom={'2px solid black'}
                                                    flexBasis={'100px'}
                                                    flexGrow={1}
                                                    flexShrink={1}
                                                    overflowY={'auto'}
                                                    wordBreak={'break-word'}
                                                >
                                                    Charge Comment: {stand.chargeComment || 'None'}
                                                </Text>
                                                <Text className='grid-comment-item' flexBasis={'100px'} flexGrow={1} flexShrink={1} overflowY={'auto'} wordBreak={'break-word'}>
                                                    Impaired Comment: {stand.impairedComment || 'None'}
                                                </Text>
                                            </div>
                                            <div className='grid-item'>
                                                <div className='grid-text-item'>Defended By: {stand.defendedBy}</div>
                                                <Text className='grid-comment-item' flexBasis={'100px'} flexGrow={1} flexShrink={1} overflowY={'auto'} wordBreak={'break-word'}>
                                                    End Comment: {stand.standEndComment || 'None'}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )
                        ) : (
                            <Box>
                                <Grid
                                    margin={'0 auto'}
                                    borderTop={'1px solid black'}
                                    backgroundColor={'gray.300'}
                                    templateColumns='2fr 1fr 1fr 0.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr'
                                    gap={'5px'}
                                >
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Match # : Station
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Scouter
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'10px 0px 10px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Starting Position
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'10px 0px 10px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Pre-Loaded
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Mobility
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Bottom Row (Auto)
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Middle Row (Auto)
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Top Row (Auto)
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Charge (Auto)
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Bottom Row (Tele)
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Middle Row (Tele)
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Top Row (Tele)
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Charge (Tele)
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            # on Station
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Impaired Partners
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Charge Comments
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Defended By
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Other Comments
                                        </Text>
                                    </GridItem>
                                </Grid>
                                {sortMatches(standForms).map((stand, index) => (
                                    <Grid
                                        margin={'0 auto'}
                                        borderTop={'1px solid black'}
                                        backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                                        key={stand._id}
                                        templateColumns='2fr 1fr 1fr 0.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr'
                                        gap={'5px'}
                                    >
                                        <GridItem
                                            as={user.admin && Link}
                                            to={user.admin ? `/standForm/${currentEvent.key}/${stand.matchNumber}/${stand.station}/${teamNumberParam}` : ''}
                                            state={{ previousRoute: 'team' }}
                                            textDecoration={user.admin && 'underline'}
                                            padding={'25px 0px 25px 0px'}
                                            pos={'relative'}
                                            top={'50%'}
                                            transform={'translateY(-50%)'}
                                            textAlign={'center'}
                                            _hover={{ backgroundColor: user.admin && 'gray.400' }}
                                            _active={{ backgroundColor: user.admin && 'gray.500' }}
                                        >
                                            <Text>
                                                {convertMatchKeyToString(stand.matchNumber)} : {convertStationKeyToString(stand.station)}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {`${stand.standScouter.split(' ')[0]}  ${stand.standScouter.split(' ')[1].charAt(0)}.`}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            {stand.standStatus === matchFormStatus.noShow ? (
                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    {'NO'}
                                                </Text>
                                            ) : (
                                                <Popover
                                                    onOpen={() => {
                                                        prevWidth.current = window.innerWidth;
                                                        drawPopoverImage(stand.startingPosition, stand.station, stand._id);
                                                        setCurrentPopoverData({ point: stand.startingPosition, station: stand.station, id: stand._id });
                                                    }}
                                                    onClose={() => setCurrentPopoverData(null)}
                                                    flip={false}
                                                    placement='bottom'
                                                >
                                                    <PopoverTrigger>
                                                        <IconButton
                                                            pos={'relative'}
                                                            top={'50%'}
                                                            transform={'translateY(-50%)'}
                                                            backgroundColor={'gray.300'}
                                                            _hover={{ backgroundColor: 'gray.400' }}
                                                            icon={<GrMap />}
                                                            _focus={{ outline: 'none' }}
                                                            size='sm'
                                                        />
                                                    </PopoverTrigger>
                                                    <PopoverContent padding={'25px'} width={'max-content'} height={'max-content'} _focus={{ outline: 'none' }}>
                                                        <PopoverArrow />
                                                        <PopoverCloseButton />
                                                        <PopoverBody>
                                                            <Center>
                                                                <Spinner pos={'absolute'} zIndex={-1}></Spinner>
                                                                <canvas
                                                                    id={stand._id}
                                                                    width={imageWidth * calculatePopoverImageScale()}
                                                                    height={imageHeight * calculatePopoverImageScale()}
                                                                    style={{ zIndex: 0 }}
                                                                ></canvas>
                                                            </Center>
                                                        </PopoverBody>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {stand.standStatus === matchFormStatus.noShow ? '-' : stand.preLoadedPiece}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {stand.standStatus === matchFormStatus.noShow ? '-' : stand.crossCommunity ? 'Yes' : 'No'}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            {stand.standStatus === matchFormStatus.noShow ? (
                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    -
                                                </Text>
                                            ) : (
                                                <VStack pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                        <BsCone />
                                                        &nbsp;
                                                        {stand.bottomAuto.coneScored} ({getAccuarcy(stand, 'auto', 'bottom', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.bottomAuto.cubeScored} ({getAccuarcy(stand, 'auto', 'bottom', 'cube')})
                                                    </Tag>
                                                </VStack>
                                            )}
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            {stand.standStatus === matchFormStatus.noShow ? (
                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    -
                                                </Text>
                                            ) : (
                                                <VStack pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                        <BsCone />
                                                        &nbsp;
                                                        {stand.middleAuto.coneScored} ({getAccuarcy(stand, 'auto', 'middle', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.middleAuto.cubeScored} ({getAccuarcy(stand, 'auto', 'middle', 'cube')})
                                                    </Tag>
                                                </VStack>
                                            )}
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            {stand.standStatus === matchFormStatus.noShow ? (
                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    -
                                                </Text>
                                            ) : (
                                                <VStack pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                        <BsCone />
                                                        &nbsp;
                                                        {stand.topAuto.coneScored} ({getAccuarcy(stand, 'auto', 'top', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.topAuto.cubeScored} ({getAccuarcy(stand, 'auto', 'top', 'cube')})
                                                    </Tag>
                                                </VStack>
                                            )}
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {stand.standStatus === matchFormStatus.noShow ? '-' : stand.chargeAuto}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            {stand.standStatus === matchFormStatus.noShow ? (
                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    -
                                                </Text>
                                            ) : (
                                                <VStack pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                        <BsCone />
                                                        &nbsp;
                                                        {stand.bottomTele.coneScored} ({getAccuarcy(stand, 'tele', 'bottom', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.bottomTele.cubeScored} ({getAccuarcy(stand, 'tele', 'bottom', 'cube')})
                                                    </Tag>
                                                </VStack>
                                            )}
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            {stand.standStatus === matchFormStatus.noShow ? (
                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    -
                                                </Text>
                                            ) : (
                                                <VStack pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                        <BsCone />
                                                        &nbsp;
                                                        {stand.middleTele.coneScored} ({getAccuarcy(stand, 'tele', 'middle', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.middleTele.cubeScored} ({getAccuarcy(stand, 'tele', 'middle', 'cube')})
                                                    </Tag>
                                                </VStack>
                                            )}
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            {stand.standStatus === matchFormStatus.noShow ? (
                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    -
                                                </Text>
                                            ) : (
                                                <VStack pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                        <BsCone />
                                                        &nbsp;
                                                        {stand.topTele.coneScored} ({getAccuarcy(stand, 'tele', 'top', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.topTele.cubeScored} ({getAccuarcy(stand, 'tele', 'top', 'cube')})
                                                    </Tag>
                                                </VStack>
                                            )}
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {stand.standStatus === matchFormStatus.noShow ? '-' : stand.chargeTele}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {stand.standStatus === matchFormStatus.noShow ? '-' : stand.chargeRobotCount || 'N/A'}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {stand.standStatus === matchFormStatus.noShow ? '-' : stand.impairedCharge ? 'Yes' : 'No'}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            {stand.standStatus === matchFormStatus.noShow ? (
                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    {'-'}
                                                </Text>
                                            ) : (
                                                <Popover flip={false} placement={'bottom'}>
                                                    <PopoverTrigger>
                                                        <IconButton
                                                            pos={'relative'}
                                                            backgroundColor={'gray.300'}
                                                            _hover={{ backgroundColor: 'gray.400' }}
                                                            top={'50%'}
                                                            transform={'translateY(-50%)'}
                                                            icon={<BiCommentEdit />}
                                                            _focus={{ outline: 'none' }}
                                                            size='sm'
                                                        />
                                                    </PopoverTrigger>
                                                    <PopoverContent key={uuidv4()} maxWidth={'75vw'} padding={'15px'} _focus={{ outline: 'none' }}>
                                                        <PopoverArrow />
                                                        <PopoverCloseButton />
                                                        <PopoverBody>
                                                            <Box>
                                                                <Text>Auto Charge Comment: {stand.autoChargeComment || 'None'}</Text>
                                                                <Text>Tele Charge Comment: {stand.chargeComment || 'None'}</Text>
                                                                <Text>Impaired Comment: {stand.impairedComment || 'None'}</Text>
                                                            </Box>
                                                        </PopoverBody>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {stand.standStatus === matchFormStatus.noShow ? 'SHOW' : stand.defendedBy}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Popover flip={false} placement='bottom-start'>
                                                <PopoverTrigger>
                                                    <IconButton
                                                        pos={'relative'}
                                                        backgroundColor={'gray.300'}
                                                        _hover={{ backgroundColor: 'gray.400' }}
                                                        top={'50%'}
                                                        transform={'translateY(-50%)'}
                                                        icon={<BiCommentEdit />}
                                                        _focus={{ outline: 'none' }}
                                                        size='sm'
                                                    />
                                                </PopoverTrigger>
                                                <PopoverContent key={uuidv4()} maxWidth={'75vw'} padding={'15px'} _focus={{ outline: 'none' }}>
                                                    <PopoverArrow />
                                                    <PopoverCloseButton />
                                                    <PopoverBody>
                                                        <Box>
                                                            {stand.standStatus === matchFormStatus.noShow ? (
                                                                <Text>Status Comment: {stand.standStatusComment || 'None'}</Text>
                                                            ) : (
                                                                <React.Fragment>
                                                                    <Text>Auto Comment: {stand.standAutoComment || 'None'}</Text>
                                                                    <Text>End Comment: {stand.standEndComment || 'None'}</Text>
                                                                </React.Fragment>
                                                            )}
                                                        </Box>
                                                    </PopoverBody>
                                                </PopoverContent>
                                            </Popover>
                                        </GridItem>
                                    </Grid>
                                ))}
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                        No Stand Data
                    </Box>
                );
            case 'super':
                return superForms.length > 0 ? (
                    <Box marginBottom={'25px'}>
                        {!isDesktop ? (
                            sortMatches(superForms).map((superForm) =>
                                superForm.superStatus === matchFormStatus.noShow ? (
                                    <div key={superForm._id} className='grid'>
                                        <div className='grid-column'>
                                            <Box
                                                as={user.admin && Link}
                                                className='grid-item header'
                                                to={
                                                    user.admin
                                                        ? `/superForm/${currentEvent.key}/${superForm.matchNumber}/${superForm.station.charAt(0)}/${superForm.allianceNumbers[0]}/${
                                                              superForm.allianceNumbers[1]
                                                          }/${superForm.allianceNumbers[2]}`
                                                        : ''
                                                }
                                                textDecoration={user.admin && 'underline'}
                                                state={{ previousRoute: 'team', teamNumber: teamNumberParam }}
                                                _hover={{ backgroundColor: user.admin && 'gray.400' }}
                                                _active={{ backgroundColor: user.admin && 'gray.500' }}
                                            >
                                                {convertMatchKeyToString(superForm.matchNumber)} : {convertStationKeyToString(superForm.station)}
                                            </Box>
                                            <div className='grid-item header'>{`${superForm.superScouter.split(' ')[0]}  ${superForm.superScouter.split(' ')[1].charAt(0)}.`}</div>
                                        </div>
                                        <div className='grid-column' style={{ textAlign: 'center' }}>
                                            <div className='grid-item'>
                                                <Text className='grid-comment-item' flexBasis={'100px'} flexGrow={1} flexShrink={1} overflowY={'auto'} wordBreak={'break-word'}>
                                                    No Show: {superForm.superStatusComment || 'None'}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div key={superForm._id} className='grid'>
                                        <div className='grid-column'>
                                            <Box
                                                as={user.admin && Link}
                                                className='grid-item header'
                                                to={
                                                    user.admin
                                                        ? `/superForm/${currentEvent.key}/${superForm.matchNumber}/${superForm.station.charAt(0)}/${superForm.allianceNumbers[0]}/${
                                                              superForm.allianceNumbers[1]
                                                          }/${superForm.allianceNumbers[2]}`
                                                        : ''
                                                }
                                                textDecoration={user.admin && 'underline'}
                                                state={{ previousRoute: 'team', teamNumber: teamNumberParam }}
                                                _hover={{ backgroundColor: user.admin && 'gray.400' }}
                                                _active={{ backgroundColor: user.admin && 'gray.500' }}
                                            >
                                                {convertMatchKeyToString(superForm.matchNumber)} : {convertStationKeyToString(superForm.station)}
                                            </Box>
                                            <div className='grid-item header'>{`${superForm.superScouter.split(' ')[0]}  ${superForm.superScouter.split(' ')[1].charAt(0)}.`}</div>
                                        </div>
                                        <div className='grid-column'>
                                            <div className='grid-item header'>Ratings</div>
                                            <div className='grid-item header'>Comment</div>
                                        </div>
                                        <div className='grid-column'>
                                            {superForm.superStatus === matchFormStatus.inconclusive ? (
                                                <div className='grid-item'>N/A (Inconclusive)</div>
                                            ) : (
                                                <div className='grid-item'>
                                                    <div className='grid-text-item'>Defense Rating: {superForm.defenseRating}</div>
                                                    <div className='grid-text-item'>Defense Allocation: {superForm.defenseRating > 0 ? superForm.defenseAllocation * 100 + '%' : 'N/A'}</div>
                                                    <div className='grid-text-item'>Quickness: {superForm.quickness}</div>
                                                    <div>Driver Awareness: {superForm.driverAwareness}</div>{' '}
                                                </div>
                                            )}

                                            <div className='grid-item'>
                                                <Text className='grid-comment-item' flexBasis={'100px'} flexGrow={1} flexShrink={1} overflowY={'auto'} wordBreak={'break-word'}>
                                                    End Comment: {superForm.superEndComment || 'None'}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )
                        ) : (
                            <Box>
                                <Grid margin={'0 auto'} borderTop={'1px solid black'} backgroundColor={'gray.300'} templateColumns='2fr 1fr 1fr 1fr 1fr 1fr 1fr' gap={'5px'}>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Match # : Station
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Scouter
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'10px 0px 10px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Defense Rating
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'10px 0px 10px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Defense Allocation
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Quickness
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Driver Awareness
                                        </Text>
                                    </GridItem>
                                    <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                        <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                            Comment
                                        </Text>
                                    </GridItem>
                                </Grid>
                                {sortMatches(superForms).map((superForm, index) => (
                                    <Grid
                                        margin={'0 auto'}
                                        borderTop={'1px solid black'}
                                        backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'}
                                        key={superForm._id}
                                        templateColumns='2fr 1fr 1fr 1fr 1fr 1fr 1fr'
                                        gap={'5px'}
                                    >
                                        <GridItem
                                            as={user.admin && Link}
                                            to={
                                                user.admin
                                                    ? `/superForm/${currentEvent.key}/${superForm.matchNumber}/${superForm.station.charAt(0)}/${superForm.allianceNumbers[0]}/${
                                                          superForm.allianceNumbers[1]
                                                      }/${superForm.allianceNumbers[2]}`
                                                    : ''
                                            }
                                            state={{ previousRoute: 'team', teamNumber: teamNumberParam }}
                                            textDecoration={user.admin && 'underline'}
                                            padding={'25px 0px 25px 0px'}
                                            pos={'relative'}
                                            top={'50%'}
                                            transform={'translateY(-50%)'}
                                            textAlign={'center'}
                                            _hover={{ backgroundColor: user.admin && 'gray.400' }}
                                            _active={{ backgroundColor: user.admin && 'gray.500' }}
                                        >
                                            <Text>
                                                {convertMatchKeyToString(superForm.matchNumber)} : {convertStationKeyToString(superForm.station)}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {`${superForm.superScouter.split(' ')[0]}  ${superForm.superScouter.split(' ')[1].charAt(0)}.`}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            {superForm.superStatus === matchFormStatus.noShow ? (
                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    {'NO'}
                                                </Text>
                                            ) : superForm.superStatus === matchFormStatus.inconclusive ? (
                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    {'Inconclusive'}
                                                </Text>
                                            ) : (
                                                <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                    {superForm.defenseRating}
                                                </Text>
                                            )}
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {superForm.superStatus === matchFormStatus.noShow || superForm.superStatus === matchFormStatus.inconclusive
                                                    ? '-'
                                                    : superForm.defenseRating > 0
                                                    ? superForm.defenseAllocation * 100 + '%'
                                                    : 'N/A'}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {superForm.superStatus === matchFormStatus.noShow || superForm.superStatus === matchFormStatus.inconclusive ? '-' : superForm.quickness}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {superForm.superStatus === matchFormStatus.noShow
                                                    ? 'SHOW'
                                                    : superForm.superStatus === matchFormStatus.inconclusive
                                                    ? 'Inconclusive'
                                                    : superForm.driverAwareness}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Popover flip={false} placement='bottom-start'>
                                                <PopoverTrigger>
                                                    <IconButton
                                                        pos={'relative'}
                                                        backgroundColor={'gray.300'}
                                                        _hover={{ backgroundColor: 'gray.400' }}
                                                        top={'50%'}
                                                        transform={'translateY(-50%)'}
                                                        icon={<BiCommentEdit />}
                                                        _focus={{ outline: 'none' }}
                                                        size='sm'
                                                    />
                                                </PopoverTrigger>
                                                <PopoverContent key={uuidv4()} maxWidth={'75vw'} padding={'15px'} _focus={{ outline: 'none' }}>
                                                    <PopoverArrow />
                                                    <PopoverCloseButton />
                                                    <PopoverBody>
                                                        <Box>
                                                            {superForm.superStatus === matchFormStatus.noShow ? (
                                                                <Text>Status Comment: {superForm.superStatusComment || 'None'}</Text>
                                                            ) : (
                                                                <React.Fragment>
                                                                    <Text>End Comment: {superForm.superEndComment || 'None'}</Text>
                                                                </React.Fragment>
                                                            )}
                                                        </Box>
                                                    </PopoverBody>
                                                </PopoverContent>
                                            </Popover>
                                        </GridItem>
                                    </Grid>
                                ))}
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                        No Super Data
                    </Box>
                );
            case 'other':
                return (
                    <Box marginBottom={'25px'}>
                        <Center marginBottom={'25px'}>
                            <HeatMap data={filteredStandForms} largeScale={0.5} mediumScale={0.7} smallScale={1.0} maxOccurances={3}></HeatMap>
                        </Center>
                        <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                            Comments and Concerns
                        </Box>
                        {joinStandAndSuperForms([...standForms], [...superForms]).map((match) => (
                            <div key={match._id} style={{ marginTop: '10px' }} className='grid'>
                                <div className='grid-column'>
                                    <div className='grid-item header'>
                                        {convertMatchKeyToString(match.matchNumber)} : {convertStationKeyToString(match.station)}
                                    </div>
                                </div>
                                <div className='grid-column'>
                                    <div className='grid-item header'>Problems</div>
                                    <div className='grid-item header'>Stand Comment</div>
                                    <div className='grid-item header'>Super Comment</div>
                                </div>
                                <div className='grid-column'>
                                    <div className='grid-item'>
                                        {match.standStatus === matchFormStatus.noShow ? (
                                            <div style={{ wordBreak: 'break-word' }}>No Show</div>
                                        ) : !match.lostCommunication && !match.robotBroke && !match.yellowCard & !match.redCard ? (
                                            <div style={{ wordBreak: 'break-word' }}>None</div>
                                        ) : (
                                            <Box>
                                                {match.lostCommunication ? <div style={{ wordBreak: 'break-word' }}>Lost Communication</div> : null}
                                                {match.robotBroke ? <div>Robot broke</div> : null}
                                                {match.yellowCard ? <div>Yellow Card Given</div> : null}
                                                {match.redCard ? <div>Red Card Given</div> : null}
                                            </Box>
                                        )}
                                    </div>
                                    <Box className='grid-item'>
                                        <Text
                                            flexBasis={match.standEndComment || match.standStatusComment ? '120px' : { base: '96px', md: '50px', lg: '50px' }}
                                            flexGrow={1}
                                            flexShrink={1}
                                            overflowY={'auto'}
                                            wordBreak={'break-word'}
                                        >
                                            Stand Comment: {match.standEndComment || match.standStatusComment || 'None'}
                                        </Text>
                                    </Box>
                                    <Box className='grid-item'>
                                        <Text
                                            flexBasis={match.superEndComment || match.superStatusComment ? '120px' : { base: '96px', md: '50px', lg: '50px' }}
                                            flexGrow={1}
                                            flexShrink={1}
                                            overflowY={'auto'}
                                            wordBreak={'break-word'}
                                        >
                                            Super Comment: {match.superEndComment || match.superStatusComment || 'None'}
                                        </Text>
                                    </Box>
                                </div>
                            </div>
                        ))}
                    </Box>
                );
            default:
                return null;
        }
    }

    return renderTab(tab);
}

export default TeamPageTabs;
