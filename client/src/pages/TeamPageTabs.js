import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
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
    VStack,
    AbsoluteCenter,
    Divider
} from '@chakra-ui/react';
import {
    averageArr,
    capitalizeFirstLetter,
    convertMatchKeyToString,
    convertStationKeyToString,
    roundToHundredth,
    roundToWhole,
    sortMatches
} from '../util/helperFunctions';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../context/auth';
import { Link } from 'react-router-dom';
import { matchFormStatus } from '../util/helperConstants';

let abilityTypes = {
    ranking: 'ranking',
    checkbox: 'checkbox',
    radio: 'radio'
};
let subAbilityTypes = {
    radio: 'radio',
    comment: 'comment'
};

function TeamPageTabs({ tab, pitForm, matchForms, teamEventData, teamNumberParam, teamName }) {
    const { user } = useContext(AuthContext);

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
                                            <ListItem
                                                marginLeft={'15px'}
                                                key={subAbility.label}
                                                fontWeight={'600'}
                                                fontSize={'100%'}
                                            >
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
                                            <ListItem
                                                marginLeft={'15px'}
                                                key={subAbility.label}
                                                fontWeight={'600'}
                                                fontSize={'100%'}
                                            >
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
                    <Flex flexWrap={'wrap'} justifyContent={'center'} marginBottom={'15px'} rowGap={'15px'}>
                        <Flex
                            width={{ base: '100%', lg: '40%' }}
                            flexDirection={'column'}
                            alignItems={'center'}
                            border={'1px solid red'}
                        >
                            <Text fontSize={'2xl'} fontWeight={'semibold'} textAlign={'center'}>
                                Team Number: {teamNumberParam}
                            </Text>
                            <Text fontSize={'2xl'} fontWeight={'semibold'} textAlign={'center'}>
                                Team Name: {teamName}
                            </Text>
                            {pitForm?.image && (
                                <ChakraImage
                                    marginTop={'25px'}
                                    width={{ base: '90%', sm: '70%', md: '50%', lg: '80%' }}
                                    src={pitForm.image}
                                />
                            )}
                        </Flex>
                        <Flex
                            // flex={{ base: 1, sm: 0.6 }}
                            width={{ base: '100%', lg: '60%' }}
                            flexDirection={'column'}
                            alignItems={'center'}
                            border={'1px solid blue'}
                            rowGap={'10px'}
                        >
                            {teamEventData && (
                                <Box width={'100%'} overflowX={'auto'} height={'fit-content'}>
                                    <Grid
                                        margin={'0 auto'}
                                        width={'900px'}
                                        templateColumns='minmax(auto, 80px) 4fr 2fr 2fr 3fr minmax(auto, 70px) minmax(auto, 80px)'
                                        border={'1px solid black'}
                                    >
                                        <GridItem backgroundColor={'lightgray'} borderRight={'1px solid black'}>
                                            <Flex
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                height={'100%'}
                                            >
                                                Team #
                                            </Flex>
                                        </GridItem>
                                        <GridItem backgroundColor={'lightgray'} borderRight={'1px solid black'}>
                                            <Flex flexDirection={'column'}>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    Total
                                                </Text>
                                                <Flex>
                                                    <Text
                                                        flex={1 / 4}
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                    >
                                                        Avg
                                                    </Text>
                                                    <Text
                                                        flex={1 / 4}
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                    >
                                                        Max
                                                    </Text>
                                                    <Text
                                                        flex={1 / 4}
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                    >
                                                        IDK
                                                    </Text>
                                                    <Text
                                                        flex={1 / 4}
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                    >
                                                        IDK
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        </GridItem>
                                        <GridItem backgroundColor={'lightgray'} borderRight={'1px solid black'}>
                                            <Flex flexDirection={'column'}>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    Auto
                                                </Text>
                                                <Flex>
                                                    <Text
                                                        flex={1 / 2}
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                    >
                                                        Avg
                                                    </Text>
                                                    <Text
                                                        flex={1 / 2}
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                    >
                                                        Max
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        </GridItem>
                                        <GridItem backgroundColor={'lightgray'} borderRight={'1px solid black'}>
                                            <Flex flexDirection={'column'}>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    Teleop
                                                </Text>
                                                <Flex>
                                                    <Text
                                                        flex={1 / 2}
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                    >
                                                        Avg
                                                    </Text>
                                                    <Text
                                                        flex={1 / 2}
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                    >
                                                        Max
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        </GridItem>
                                        <GridItem backgroundColor={'lightgray'} borderRight={'1px solid black'}>
                                            <Flex flexDirection={'column'}>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    Stage
                                                </Text>
                                                <Flex>
                                                    <Text
                                                        flex={1 / 3}
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                    >
                                                        Avg
                                                    </Text>
                                                    <Text
                                                        flex={1 / 3}
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                    >
                                                        Max
                                                    </Text>
                                                    <Text
                                                        flex={1 / 3}
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                    >
                                                        Hangs
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        </GridItem>
                                        <GridItem backgroundColor={'lightgray'} borderRight={'1px solid black'}>
                                            <Flex
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                height={'100%'}
                                            >
                                                Pts
                                            </Flex>
                                        </GridItem>
                                        <GridItem backgroundColor={'lightgray'} borderRight={'1px solid black'}>
                                            <Flex
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                height={'100%'}
                                            >
                                                Max Pts
                                            </Flex>
                                        </GridItem>

                                        <GridItem
                                            backgroundColor={'red.300'}
                                            borderRight={'1px solid black'}
                                            padding={'2px 0px'}
                                        >
                                            <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                {teamNumberParam}
                                            </Text>
                                        </GridItem>
                                        <GridItem
                                            backgroundColor={'red.300'}
                                            borderRight={'1px solid black'}
                                            padding={'2px 0px'}
                                        >
                                            <Flex>
                                                <Text
                                                    flex={1 / 4}
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                >
                                                    {teamEventData.offensivePoints.avg}
                                                </Text>
                                                <Text
                                                    flex={1 / 4}
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                >
                                                    {teamEventData.offensivePoints.max}
                                                </Text>
                                                <Text
                                                    flex={1 / 4}
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                >
                                                    {teamEventData.offensivePoints.max}
                                                </Text>
                                                <Text
                                                    flex={1 / 4}
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                >
                                                    {123}
                                                </Text>
                                            </Flex>
                                        </GridItem>
                                        <GridItem
                                            backgroundColor={'red.300'}
                                            borderRight={'1px solid black'}
                                            padding={'2px 0px'}
                                        >
                                            <Flex>
                                                <Text
                                                    flex={1 / 2}
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                >
                                                    {teamEventData.autoPoints.avg}
                                                </Text>
                                                <Text
                                                    flex={1 / 2}
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                >
                                                    {teamEventData.autoPoints.max}
                                                </Text>
                                            </Flex>
                                        </GridItem>
                                        <GridItem
                                            backgroundColor={'red.300'}
                                            borderRight={'1px solid black'}
                                            padding={'2px 0px'}
                                        >
                                            <Flex>
                                                <Text
                                                    flex={1 / 2}
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                >
                                                    {teamEventData.teleopPoints.avg}
                                                </Text>
                                                <Text
                                                    flex={1 / 2}
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                >
                                                    {teamEventData.teleopPoints.max}
                                                </Text>
                                            </Flex>
                                        </GridItem>
                                        <GridItem
                                            backgroundColor={'red.300'}
                                            borderRight={'1px solid black'}
                                            padding={'2px 0px'}
                                        >
                                            <Flex>
                                                <Text
                                                    flex={1 / 3}
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                >
                                                    {teamEventData.stagePoints.avg}
                                                </Text>
                                                <Text
                                                    flex={1 / 3}
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                >
                                                    {teamEventData.stagePoints.max}
                                                </Text>
                                                <Text
                                                    flex={1 / 3}
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                >
                                                    {teamEventData.climbSuccessFraction || 'N/A'}
                                                </Text>
                                            </Flex>
                                        </GridItem>
                                        <GridItem
                                            backgroundColor={'red.300'}
                                            borderRight={'1px solid black'}
                                            padding={'2px 0px'}
                                        >
                                            <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                Pts
                                            </Text>
                                        </GridItem>
                                        <GridItem
                                            backgroundColor={'red.300'}
                                            borderRight={'1px solid black'}
                                            padding={'2px 0px'}
                                        >
                                            <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                Max Pts
                                            </Text>
                                        </GridItem>
                                    </Grid>
                                </Box>
                            )}
                            {!teamEventData && (
                                <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                                    No match data
                                </Text>
                            )}
                            {pitForm && !pitForm.followUp && (
                                <Flex
                                    width={'100%'}
                                    border={'1px solid black'}
                                    flexWrap={'wrap'}
                                    rowGap={'10px'}
                                    columnGap={'40px'}
                                    justifyContent={'center'}
                                >
                                    <Flex flex={1 / 3} minWidth={'fit-content'} flexDirection={'column'} rowGap={'2px'}>
                                        <Text
                                            fontSize={'xl'}
                                            fontWeight={'semibold'}
                                            textAlign={'center'}
                                            textDecoration={'underline'}
                                        >
                                            Basic Attr.
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Weight: {pitForm.weight} lbs
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Height: {pitForm.height} inches
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Frame size: {pitForm.frameSize.width} in. by {pitForm.frameSize.length} in.
                                        </Text>
                                    </Flex>
                                    <Flex flex={1 / 3} minWidth={'fit-content'} flexDirection={'column'} rowGap={'2px'}>
                                        <Text
                                            fontSize={'xl'}
                                            fontWeight={'semibold'}
                                            textAlign={'center'}
                                            textDecoration={'underline'}
                                        >
                                            Drive Train
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Type: {pitForm.driveTrain}
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Motors:{' '}
                                            {pitForm.motors
                                                .map((motor) => `${motor.label} (${motor.value})`)
                                                .join(', ')}
                                        </Text>
                                    </Flex>
                                    <Flex flex={1 / 3} minWidth={'fit-content'} flexDirection={'column'} rowGap={'2px'}>
                                        <Text
                                            fontSize={'xl'}
                                            fontWeight={'semibold'}
                                            textAlign={'center'}
                                            textDecoration={'underline'}
                                        >
                                            Other
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Batteries: {pitForm.batteryCount}
                                        </Text>
                                        <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                            Charging: {pitForm.chargingBatteryCount}
                                        </Text>
                                    </Flex>
                                </Flex>
                            )}
                            {(!pitForm || pitForm.followUp) && (
                                <Text fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                                    No pit data
                                </Text>
                            )}
                        </Flex>
                    </Flex>
                );
            case 'pit':
                return (
                    <Box>
                        {/* pitForm ? (
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
                            <Text
                                textAlign={'center'}
                                marginBottom={'5px'}
                                textDecoration={'underline'}
                                fontWeight={'bold'}
                                fontSize={'125%'}
                            >
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
                            <Text
                                textAlign={'center'}
                                marginBottom={'5px'}
                                textDecoration={'underline'}
                                fontWeight={'bold'}
                                fontSize={'125%'}
                            >
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
                                    <Text
                                        marginLeft={'15px'}
                                        key={motor._id}
                                        fontWeight={'600'}
                                        fontSize={'100%'}
                                    >{`${motor.label} (${motor.value})`}</Text>
                                ))}
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Wheel:
                                </Text>
                                {pitForm.wheels.map((wheel) => (
                                    <Text
                                        marginLeft={'15px'}
                                        key={wheel._id}
                                        fontWeight={'600'}
                                        fontSize={'100%'}
                                    >{`${wheel.label} (${wheel.value}), ${wheel.size} in`}</Text>
                                ))}
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Stats:
                                </Text>
                                {pitForm.driveStats.map((stat) => (
                                    <Box key={stat._id}>
                                        <Text
                                            marginLeft={'15px'}
                                            fontWeight={'600'}
                                            fontSize={'100%'}
                                            textDecoration={'underline'}
                                        >{`Ratio - ${roundToHundredth(stat.drivenGear)} : ${stat.drivingGear}`}</Text>
                                        <Text
                                            marginLeft={'25px'}
                                            fontWeight={'600'}
                                            fontSize={'100%'}
                                        >{`Free Speed: ${roundToHundredth(stat.freeSpeed)} ft/s`}</Text>
                                        <Text
                                            marginLeft={'25px'}
                                            fontWeight={'600'}
                                            fontSize={'100%'}
                                        >{`Pushing Power (0-100): ${roundToHundredth(stat.pushingPower)}`}</Text>
                                    </Box>
                                ))}
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Comment:{' '}
                                    <span style={{ fontWeight: '600', fontSize: '95%' }}>
                                        {pitForm.driveTrainComment}
                                    </span>
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
                            <Text
                                textAlign={'center'}
                                marginBottom={'5px'}
                                textDecoration={'underline'}
                                fontWeight={'bold'}
                                fontSize={'125%'}
                            >
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
                                    <canvas
                                        id={pitForm._id}
                                        width={imageWidth * calculatePopoverImageScale()}
                                        height={imageHeight * calculatePopoverImageScale()}
                                        style={{ zIndex: 0 }}
                                    ></canvas>
                                </Center>
                                <Text marginBottom={'5px'} fontWeight={'600'} fontSize={'110%'}>
                                    Best Auto:{' '}
                                    <span style={{ fontWeight: '600', fontSize: '95%' }}>{pitForm.autoComment}</span>
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
                            <Text
                                textAlign={'center'}
                                marginBottom={'5px'}
                                textDecoration={'underline'}
                                fontWeight={'bold'}
                                fontSize={'125%'}
                            >
                                Abilities:
                            </Text>
                            <Box marginBottom={'5px'}>
                                {[...pitForm.autoAbilities, ...pitForm.teleAbilities].map((ability, index) =>
                                    renderAbilities(ability, index)
                                )}
                            </Box>
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
                            <Text
                                textAlign={'center'}
                                marginBottom={'5px'}
                                textDecoration={'underline'}
                                fontWeight={'bold'}
                                fontSize={'125%'}
                            >
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
                    <Box
                        textAlign={'center'}
                        fontSize={'25px'}
                        fontWeight={'medium'}
                        margin={'0 auto'}
                        width={{ base: '85%', md: '66%', lg: '50%' }}
                    >
                        No Pit Data
                    </Box>
                ); */}
                    </Box>
                );
            case 'stand':
                return (
                    <Box>
                        {/* standForms.length > 0 ? (
                    <Box marginBottom={'25px'}>
                        {!isDesktop ? (
                            sortMatches(standForms).map((stand) =>
                                stand.standStatus === matchFormStatus.noShow ? (
                                    <div key={stand._id} className='grid'>
                                        <div className='grid-column'>
                                            <Box
                                                as={user.admin && Link}
                                                className='grid-item header'
                                                to={
                                                    user.admin
                                                        ? `/standForm/${currentEvent.key}/${stand.matchNumber}/${stand.station}/${teamNumberParam}`
                                                        : ''
                                                }
                                                textDecoration={user.admin && 'underline'}
                                                state={{ previousRoute: 'team' }}
                                                _hover={{ backgroundColor: user.admin && 'gray.400' }}
                                                _active={{ backgroundColor: user.admin && 'gray.500' }}
                                            >
                                                {convertMatchKeyToString(stand.matchNumber)} :{' '}
                                                {convertStationKeyToString(stand.station)}
                                            </Box>
                                            <div className='grid-item header'>{`${
                                                stand.standScouter.split(' ')[0]
                                            }  ${stand.standScouter.split(' ')[1].charAt(0)}.`}</div>
                                        </div>
                                        <div className='grid-column' style={{ textAlign: 'center' }}>
                                            <div className='grid-item'>
                                                <Text
                                                    className='grid-comment-item'
                                                    flexBasis={'100px'}
                                                    flexGrow={1}
                                                    flexShrink={1}
                                                    overflowY={'auto'}
                                                    wordBreak={'break-word'}
                                                >
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
                                                to={
                                                    user.admin
                                                        ? `/standForm/${currentEvent.key}/${stand.matchNumber}/${stand.station}/${teamNumberParam}`
                                                        : ''
                                                }
                                                textDecoration={user.admin && 'underline'}
                                                state={{ previousRoute: 'team' }}
                                                _hover={{ backgroundColor: user.admin && 'gray.400' }}
                                                _active={{ backgroundColor: user.admin && 'gray.500' }}
                                            >
                                                {convertMatchKeyToString(stand.matchNumber)} :{' '}
                                                {convertStationKeyToString(stand.station)}
                                            </Box>
                                            <div className='grid-item header'>{`${
                                                stand.standScouter.split(' ')[0]
                                            }  ${stand.standScouter.split(' ')[1].charAt(0)}.`}</div>
                                        </div>
                                        <div className='grid-column'>
                                            <div className='grid-item header'>Pre-Auto</div>
                                            <div className='grid-item header'>Auto</div>
                                            <div className='grid-item header'>Post-Auto</div>
                                        </div>
                                        <div className='grid-column'>
                                            <div className='grid-item'>
                                                <Center
                                                    paddingTop={'5px'}
                                                    paddingBottom={'5px'}
                                                    pos={'relative'}
                                                    top={'50%'}
                                                    transform={'translateY(-50%)'}
                                                >
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
                                                    <Flex
                                                        flexWrap={'wrap'}
                                                        columnGap={'8px'}
                                                        rowGap={'8px'}
                                                        display='inline-flex'
                                                        marginBottom={'8px'}
                                                    >
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.topAuto.coneScored} (
                                                            {getAccuarcy(stand, 'auto', 'top', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.topAuto.cubeScored} (
                                                            {getAccuarcy(stand, 'auto', 'top', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                                <div className='grid-text-item'>
                                                    Middle Row:{' '}
                                                    <Flex
                                                        flexWrap={'wrap'}
                                                        columnGap={'8px'}
                                                        rowGap={'8px'}
                                                        display='inline-flex'
                                                        marginBottom={'8px'}
                                                    >
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.middleAuto.coneScored} (
                                                            {getAccuarcy(stand, 'auto', 'middle', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.middleAuto.cubeScored} (
                                                            {getAccuarcy(stand, 'auto', 'middle', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                                <div>
                                                    Bottom Row:{' '}
                                                    <Flex
                                                        flexWrap={'wrap'}
                                                        columnGap={'8px'}
                                                        rowGap={'8px'}
                                                        display='inline-flex'
                                                        marginBottom={'8px'}
                                                    >
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.bottomAuto.coneScored} (
                                                            {getAccuarcy(stand, 'auto', 'bottom', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.bottomAuto.cubeScored} (
                                                            {getAccuarcy(stand, 'auto', 'bottom', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                            </div>
                                            <Box className='grid-item'>
                                                <div className='grid-text-item'>
                                                    Mobility: {stand.crossCommunity ? 'Yes' : 'No'}
                                                </div>
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
                                                <Text
                                                    className='grid-comment-item'
                                                    flexBasis={'120px'}
                                                    flexGrow={1}
                                                    flexShrink={1}
                                                    overflowY={'auto'}
                                                    wordBreak={'break-word'}
                                                >
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
                                                    <Flex
                                                        flexWrap={'wrap'}
                                                        columnGap={'8px'}
                                                        rowGap={'8px'}
                                                        display='inline-flex'
                                                        marginBottom={'8px'}
                                                    >
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.topTele.coneScored} (
                                                            {getAccuarcy(stand, 'tele', 'top', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.topTele.cubeScored} (
                                                            {getAccuarcy(stand, 'tele', 'top', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                                <div className='grid-text-item'>
                                                    Middle Row:{' '}
                                                    <Flex
                                                        flexWrap={'wrap'}
                                                        columnGap={'8px'}
                                                        rowGap={'8px'}
                                                        display='inline-flex'
                                                        marginBottom={'8px'}
                                                    >
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.middleTele.coneScored} (
                                                            {getAccuarcy(stand, 'tele', 'middle', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.middleTele.cubeScored} (
                                                            {getAccuarcy(stand, 'tele', 'middle', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                                <div>
                                                    Bottom Row:{' '}
                                                    <Flex
                                                        flexWrap={'wrap'}
                                                        columnGap={'8px'}
                                                        rowGap={'8px'}
                                                        display='inline-flex'
                                                        marginBottom={'8px'}
                                                    >
                                                        <Tag color={'black'} backgroundColor={'yellow.300'}>
                                                            <BsCone />
                                                            &nbsp;
                                                            {stand.bottomTele.coneScored} (
                                                            {getAccuarcy(stand, 'tele', 'bottom', 'cone')})
                                                        </Tag>
                                                        <Tag color={'black'} backgroundColor={'purple.300'}>
                                                            <IoCube />
                                                            &nbsp;
                                                            {stand.bottomTele.cubeScored} (
                                                            {getAccuarcy(stand, 'tele', 'bottom', 'cube')})
                                                        </Tag>
                                                    </Flex>
                                                </div>
                                            </div>
                                            <div className='grid-item'>
                                                <div className='grid-text-item'>Charge: {stand.chargeTele}</div>
                                                <div className='grid-text-item'>
                                                    # on Station: {stand.chargeRobotCount || 'N/A'}
                                                </div>
                                                <div className='grid-text-item'>
                                                    Impaired Partners: {stand.impairedCharge ? 'Yes' : 'No'}
                                                </div>
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
                                                <Text
                                                    className='grid-comment-item'
                                                    flexBasis={'100px'}
                                                    flexGrow={1}
                                                    flexShrink={1}
                                                    overflowY={'auto'}
                                                    wordBreak={'break-word'}
                                                >
                                                    Impaired Comment: {stand.impairedComment || 'None'}
                                                </Text>
                                            </div>
                                            <div className='grid-item'>
                                                <div className='grid-text-item'>Defended By: {stand.defendedBy}</div>
                                                <Text
                                                    className='grid-comment-item'
                                                    flexBasis={'100px'}
                                                    flexGrow={1}
                                                    flexShrink={1}
                                                    overflowY={'auto'}
                                                    wordBreak={'break-word'}
                                                >
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
                                            to={
                                                user.admin
                                                    ? `/standForm/${currentEvent.key}/${stand.matchNumber}/${stand.station}/${teamNumberParam}`
                                                    : ''
                                            }
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
                                                {convertMatchKeyToString(stand.matchNumber)} :{' '}
                                                {convertStationKeyToString(stand.station)}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {`${stand.standScouter.split(' ')[0]}  ${stand.standScouter
                                                    .split(' ')[1]
                                                    .charAt(0)}.`}
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
                                                        drawPopoverImage(
                                                            stand.startingPosition,
                                                            stand.station,
                                                            stand._id
                                                        );
                                                        setCurrentPopoverData({
                                                            point: stand.startingPosition,
                                                            station: stand.station,
                                                            id: stand._id
                                                        });
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
                                                    <PopoverContent
                                                        padding={'25px'}
                                                        width={'max-content'}
                                                        height={'max-content'}
                                                        _focus={{ outline: 'none' }}
                                                    >
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
                                                {stand.standStatus === matchFormStatus.noShow
                                                    ? '-'
                                                    : stand.preLoadedPiece}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {stand.standStatus === matchFormStatus.noShow
                                                    ? '-'
                                                    : stand.crossCommunity
                                                    ? 'Yes'
                                                    : 'No'}
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
                                                        {stand.bottomAuto.coneScored} (
                                                        {getAccuarcy(stand, 'auto', 'bottom', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.bottomAuto.cubeScored} (
                                                        {getAccuarcy(stand, 'auto', 'bottom', 'cube')})
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
                                                        {stand.middleAuto.coneScored} (
                                                        {getAccuarcy(stand, 'auto', 'middle', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.middleAuto.cubeScored} (
                                                        {getAccuarcy(stand, 'auto', 'middle', 'cube')})
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
                                                        {stand.topAuto.coneScored} (
                                                        {getAccuarcy(stand, 'auto', 'top', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.topAuto.cubeScored} (
                                                        {getAccuarcy(stand, 'auto', 'top', 'cube')})
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
                                                        {stand.bottomTele.coneScored} (
                                                        {getAccuarcy(stand, 'tele', 'bottom', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.bottomTele.cubeScored} (
                                                        {getAccuarcy(stand, 'tele', 'bottom', 'cube')})
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
                                                        {stand.middleTele.coneScored} (
                                                        {getAccuarcy(stand, 'tele', 'middle', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.middleTele.cubeScored} (
                                                        {getAccuarcy(stand, 'tele', 'middle', 'cube')})
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
                                                        {stand.topTele.coneScored} (
                                                        {getAccuarcy(stand, 'tele', 'top', 'cone')})
                                                    </Tag>
                                                    <Tag color={'black'} backgroundColor={'purple.300'}>
                                                        <IoCube />
                                                        &nbsp;
                                                        {stand.topTele.cubeScored} (
                                                        {getAccuarcy(stand, 'tele', 'top', 'cube')})
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
                                                {stand.standStatus === matchFormStatus.noShow
                                                    ? '-'
                                                    : stand.chargeRobotCount || 'N/A'}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {stand.standStatus === matchFormStatus.noShow
                                                    ? '-'
                                                    : stand.impairedCharge
                                                    ? 'Yes'
                                                    : 'No'}
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
                                                    <PopoverContent
                                                        key={uuidv4()}
                                                        maxWidth={'75vw'}
                                                        padding={'15px'}
                                                        _focus={{ outline: 'none' }}
                                                    >
                                                        <PopoverArrow />
                                                        <PopoverCloseButton />
                                                        <PopoverBody>
                                                            <Box>
                                                                <Text>
                                                                    Auto Charge Comment:{' '}
                                                                    {stand.autoChargeComment || 'None'}
                                                                </Text>
                                                                <Text>
                                                                    Tele Charge Comment: {stand.chargeComment || 'None'}
                                                                </Text>
                                                                <Text>
                                                                    Impaired Comment: {stand.impairedComment || 'None'}
                                                                </Text>
                                                            </Box>
                                                        </PopoverBody>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {stand.standStatus === matchFormStatus.noShow
                                                    ? 'SHOW'
                                                    : stand.defendedBy}
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
                                                <PopoverContent
                                                    key={uuidv4()}
                                                    maxWidth={'75vw'}
                                                    padding={'15px'}
                                                    _focus={{ outline: 'none' }}
                                                >
                                                    <PopoverArrow />
                                                    <PopoverCloseButton />
                                                    <PopoverBody>
                                                        <Box>
                                                            {stand.standStatus === matchFormStatus.noShow ? (
                                                                <Text>
                                                                    Status Comment: {stand.standStatusComment || 'None'}
                                                                </Text>
                                                            ) : (
                                                                <React.Fragment>
                                                                    <Text>
                                                                        Auto Comment: {stand.standAutoComment || 'None'}
                                                                    </Text>
                                                                    <Text>
                                                                        End Comment: {stand.standEndComment || 'None'}
                                                                    </Text>
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
                    <Box
                        textAlign={'center'}
                        fontSize={'25px'}
                        fontWeight={'medium'}
                        margin={'0 auto'}
                        width={{ base: '85%', md: '66%', lg: '50%' }}
                    >
                        No Stand Data
                    </Box>
                ); */}
                    </Box>
                );
            case 'super':
                return (
                    <Box>
                        {/* superForms.length > 0 ? (
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
                                                        ? `/superForm/${currentEvent.key}/${
                                                              superForm.matchNumber
                                                          }/${superForm.station.charAt(0)}/${
                                                              superForm.allianceNumbers[0]
                                                          }/${superForm.allianceNumbers[1]}/${
                                                              superForm.allianceNumbers[2]
                                                          }`
                                                        : ''
                                                }
                                                textDecoration={user.admin && 'underline'}
                                                state={{ previousRoute: 'team', teamNumber: teamNumberParam }}
                                                _hover={{ backgroundColor: user.admin && 'gray.400' }}
                                                _active={{ backgroundColor: user.admin && 'gray.500' }}
                                            >
                                                {convertMatchKeyToString(superForm.matchNumber)} :{' '}
                                                {convertStationKeyToString(superForm.station)}
                                            </Box>
                                            <div className='grid-item header'>{`${
                                                superForm.superScouter.split(' ')[0]
                                            }  ${superForm.superScouter.split(' ')[1].charAt(0)}.`}</div>
                                        </div>
                                        <div className='grid-column' style={{ textAlign: 'center' }}>
                                            <div className='grid-item'>
                                                <Text
                                                    className='grid-comment-item'
                                                    flexBasis={'100px'}
                                                    flexGrow={1}
                                                    flexShrink={1}
                                                    overflowY={'auto'}
                                                    wordBreak={'break-word'}
                                                >
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
                                                        ? `/superForm/${currentEvent.key}/${
                                                              superForm.matchNumber
                                                          }/${superForm.station.charAt(0)}/${
                                                              superForm.allianceNumbers[0]
                                                          }/${superForm.allianceNumbers[1]}/${
                                                              superForm.allianceNumbers[2]
                                                          }`
                                                        : ''
                                                }
                                                textDecoration={user.admin && 'underline'}
                                                state={{ previousRoute: 'team', teamNumber: teamNumberParam }}
                                                _hover={{ backgroundColor: user.admin && 'gray.400' }}
                                                _active={{ backgroundColor: user.admin && 'gray.500' }}
                                            >
                                                {convertMatchKeyToString(superForm.matchNumber)} :{' '}
                                                {convertStationKeyToString(superForm.station)}
                                            </Box>
                                            <div className='grid-item header'>{`${
                                                superForm.superScouter.split(' ')[0]
                                            }  ${superForm.superScouter.split(' ')[1].charAt(0)}.`}</div>
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
                                                    <div className='grid-text-item'>
                                                        Defense Rating: {superForm.defenseRating}
                                                    </div>
                                                    <div className='grid-text-item'>
                                                        Defense Allocation:{' '}
                                                        {superForm.defenseRating > 0
                                                            ? superForm.defenseAllocation * 100 + '%'
                                                            : 'N/A'}
                                                    </div>
                                                    <div className='grid-text-item'>
                                                        Quickness: {superForm.quickness}
                                                    </div>
                                                    <div>Driver Awareness: {superForm.driverAwareness}</div>{' '}
                                                </div>
                                            )}

                                            <div className='grid-item'>
                                                <Text
                                                    className='grid-comment-item'
                                                    flexBasis={'100px'}
                                                    flexGrow={1}
                                                    flexShrink={1}
                                                    overflowY={'auto'}
                                                    wordBreak={'break-word'}
                                                >
                                                    End Comment: {superForm.superEndComment || 'None'}
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
                                    templateColumns='2fr 1fr 1fr 1fr 1fr 1fr 1fr'
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
                                                    ? `/superForm/${currentEvent.key}/${
                                                          superForm.matchNumber
                                                      }/${superForm.station.charAt(0)}/${
                                                          superForm.allianceNumbers[0]
                                                      }/${superForm.allianceNumbers[1]}/${superForm.allianceNumbers[2]}`
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
                                                {convertMatchKeyToString(superForm.matchNumber)} :{' '}
                                                {convertStationKeyToString(superForm.station)}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {`${superForm.superScouter.split(' ')[0]}  ${superForm.superScouter
                                                    .split(' ')[1]
                                                    .charAt(0)}.`}
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
                                                {superForm.superStatus === matchFormStatus.noShow ||
                                                superForm.superStatus === matchFormStatus.inconclusive
                                                    ? '-'
                                                    : superForm.defenseRating > 0
                                                    ? superForm.defenseAllocation * 100 + '%'
                                                    : 'N/A'}
                                            </Text>
                                        </GridItem>
                                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                            <Text pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                                {superForm.superStatus === matchFormStatus.noShow ||
                                                superForm.superStatus === matchFormStatus.inconclusive
                                                    ? '-'
                                                    : superForm.quickness}
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
                                                <PopoverContent
                                                    key={uuidv4()}
                                                    maxWidth={'75vw'}
                                                    padding={'15px'}
                                                    _focus={{ outline: 'none' }}
                                                >
                                                    <PopoverArrow />
                                                    <PopoverCloseButton />
                                                    <PopoverBody>
                                                        <Box>
                                                            {superForm.superStatus === matchFormStatus.noShow ? (
                                                                <Text>
                                                                    Status Comment:{' '}
                                                                    {superForm.superStatusComment || 'None'}
                                                                </Text>
                                                            ) : (
                                                                <React.Fragment>
                                                                    <Text>
                                                                        End Comment:{' '}
                                                                        {superForm.superEndComment || 'None'}
                                                                    </Text>
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
                    <Box
                        textAlign={'center'}
                        fontSize={'25px'}
                        fontWeight={'medium'}
                        margin={'0 auto'}
                        width={{ base: '85%', md: '66%', lg: '50%' }}
                    >
                        No Super Data
                    </Box>
                ); */}
                    </Box>
                );
            case 'other':
                return (
                    <Box marginBottom={'25px'}>
                        {/* <Center marginBottom={'25px'}>
                            <HeatMap
                                data={filteredStandForms}
                                largeScale={0.5}
                                mediumScale={0.7}
                                smallScale={1.0}
                                maxOccurances={3}
                            ></HeatMap>
                        </Center>
                        <Box
                            textAlign={'center'}
                            fontSize={'25px'}
                            fontWeight={'medium'}
                            margin={'0 auto'}
                            width={{ base: '85%', md: '66%', lg: '50%' }}
                        >
                            Comments and Concerns
                        </Box>
                        {joinStandAndSuperForms([...standForms], [...superForms]).map((match) => (
                            <div key={match._id} style={{ marginTop: '10px' }} className='grid'>
                                <div className='grid-column'>
                                    <div className='grid-item header'>
                                        {convertMatchKeyToString(match.matchNumber)} :{' '}
                                        {convertStationKeyToString(match.station)}
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
                                        ) : !match.lostCommunication &&
                                          !match.robotBroke &&
                                          !match.yellowCard & !match.redCard ? (
                                            <div style={{ wordBreak: 'break-word' }}>None</div>
                                        ) : (
                                            <Box>
                                                {match.lostCommunication ? (
                                                    <div style={{ wordBreak: 'break-word' }}>Lost Communication</div>
                                                ) : null}
                                                {match.robotBroke ? <div>Robot broke</div> : null}
                                                {match.yellowCard ? <div>Yellow Card Given</div> : null}
                                                {match.redCard ? <div>Red Card Given</div> : null}
                                            </Box>
                                        )}
                                    </div>
                                    <Box className='grid-item'>
                                        <Text
                                            flexBasis={
                                                match.standEndComment || match.standStatusComment
                                                    ? '120px'
                                                    : { base: '96px', md: '50px', lg: '50px' }
                                            }
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
                                            flexBasis={
                                                match.superEndComment || match.superStatusComment
                                                    ? '120px'
                                                    : { base: '96px', md: '50px', lg: '50px' }
                                            }
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
                        ))} */}
                    </Box>
                );
            default:
                return null;
        }
    }

    if (pitForm === undefined || matchForms === undefined || teamEventData === undefined) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return renderTab(tab);
}

export default TeamPageTabs;
