import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Box,
    Center,
    Flex,
    Image as ChakraImage,
    ListItem,
    OrderedList,
    Spinner,
    Tag,
    Text,
    Card,
    CardHeader,
    CardBody,
    Stack,
    StackDivider,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    Icon,
    Tooltip as ChakraToolTip
} from '@chakra-ui/react';
import { getValueByRange, roundToTenth, roundToWhole } from '../util/helperFunctions';
import { v4 as uuidv4 } from 'uuid';
import { matchFormStatus, teamPageTabs } from '../util/helperConstants';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import PreAutoBlueField from '../images/PreAutoBlueField.png';
import MatchLineGraphs from '../components/MatchLineGraphs';
import AutoPaths from '../components/AutoPaths';
import TeamStatsList from '../components/TeamStatsList';
import MatchScheduleTable from '../components/MatchScheduleTable';
import MatchFormsTable from '../components/MatchFormsTable';
import { RiSpeaker2Fill } from 'react-icons/ri';
import { GiHighShot } from 'react-icons/gi';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

let abilityTypes = {
    ranking: 'ranking',
    checkbox: 'checkbox',
    radio: 'radio'
};
let subAbilityTypes = {
    radio: 'radio',
    comment: 'comment'
};
let startingPositions = [
    [28, 35, uuidv4()],
    [60, 118, uuidv4()],
    [28, 200, uuidv4()],
    [28, 300, uuidv4()]
];
let imageWidth = 435;
let imageHeight = 435;

function TeamPageTabs({ tab, pitForm, matchForms, practiceForms, teamEventData, teamNumber, teamName, currentEvent }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const teamRef = useRef();
    const totalRef = useRef();
    const autoRef = useRef();
    const teleopRef = useRef();
    const stageRef = useRef();

    const [dimensionRatios, setDimensionRatios] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [oneValidMatchForms, setOneValidMatchForms] = useState(null);
    const [oneValidPracticeForms, setOneValidPracticeForms] = useState(null);
    const [modalImage, setModalImage] = useState(null);
    const [childrenOffsetTop, setChildrenOffsetTop] = useState({
        team: null,
        total: null,
        auto: null,
        teleop: null,
        stage: null
    });

    useEffect(() => {
        if (matchForms) {
            setOneValidMatchForms(
                matchForms.filter(
                    (matchForm) =>
                        [matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.standStatus) ||
                        [matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.superStatus)
                )
            );
        } else {
            setOneValidMatchForms(null);
        }
        if (practiceForms) {
            setOneValidPracticeForms(
                practiceForms.filter(
                    (matchForm) =>
                        [matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.standStatus) ||
                        [matchFormStatus.complete, matchFormStatus.noShow].includes(matchForm.superStatus)
                )
            );
        } else {
            setOneValidPracticeForms(null);
        }
    }, [matchForms, practiceForms]);

    useLayoutEffect(() => {
        setImageLoaded(false);
    }, [tab]);

    const getImageVariables = useCallback(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const breakPointWidth = window.innerWidth;
        // const viewportHeight = window.innerHeight;

        // Calculate image dimensions based on screen size
        // We subtract by 50 in this one to account for the 25px of padding on all sides
        const maxWidth =
            viewportWidth *
                (tab !== teamPageTabs.forms
                    ? getValueByRange(breakPointWidth)
                    : getValueByRange(breakPointWidth, [0.75, 0.6, 0.35, 0.2])) -
            (tab !== teamPageTabs.forms ? 0 : 50); // Adjust the multiplier as needed
        const maxHeight = imageHeight - (tab !== teamPageTabs.forms ? 0 : 50);

        const screenAspectRatio = maxWidth / maxHeight;
        const imageAspectRatio = imageWidth / imageHeight;

        // Calculate the new dimensions to fit the screen while maintaining the aspect ratio
        let scaledWidth, scaledHeight;
        if (imageAspectRatio > screenAspectRatio) {
            // Original image has a wider aspect ratio, so add horizontal whitespace
            scaledWidth = maxWidth;
            scaledHeight = maxWidth / imageAspectRatio;

            // Commenting this because we will never white space because we
            // position inside the image
            // const extraHorizontalSpace = maxHeight - scaledHeight;
            // const whitespaceTop = extraHorizontalSpace / 2;
            // const whitespaceBottom = extraHorizontalSpace / 2;
            // setWhitespace({ top: whitespaceTop, bottom: whitespaceBottom, left: 0, right: 0 });
        } else {
            // Original image has a taller aspect ratio, so add vertical whitespace
            scaledHeight = maxHeight;
            scaledWidth = maxHeight * imageAspectRatio;

            // Commenting this because we will never white space because we
            // position inside the image
            // const extraVerticalSpace = maxWidth - scaledWidth;
            // const whitespaceLeft = extraVerticalSpace / 2;
            // const whitespaceRight = extraVerticalSpace / 2;
            // setWhitespace({ top: 0, bottom: 0, left: whitespaceLeft, right: whitespaceRight });
        }
        setDimensionRatios({ width: scaledWidth / imageWidth, height: scaledHeight / imageHeight });
    }, [tab]);

    const getChildrenOffsetTop = useCallback(() => {
        let newChildrenOffsetTop = {};
        newChildrenOffsetTop.team = teamRef.current?.offsetTop;
        newChildrenOffsetTop.total = totalRef.current?.offsetTop;
        newChildrenOffsetTop.auto = autoRef.current?.offsetTop;
        newChildrenOffsetTop.teleop = teleopRef.current?.offsetTop;
        newChildrenOffsetTop.stage = stageRef.current?.offsetTop;
        setChildrenOffsetTop(newChildrenOffsetTop);
    }, []);

    useLayoutEffect(() => {
        if (tab === teamPageTabs.overview) {
            getChildrenOffsetTop();

            window.addEventListener('resize', getChildrenOffsetTop);

            return () => window.removeEventListener('resize', getChildrenOffsetTop);
        }
    }, [pitForm, matchForms, oneValidMatchForms, oneValidPracticeForms, teamEventData, getChildrenOffsetTop, tab]);

    useLayoutEffect(() => {
        if ([teamPageTabs.pit, teamPageTabs.forms, teamPageTabs.other].includes(tab)) {
            getImageVariables();
            window.addEventListener('resize', getImageVariables);

            return () => window.removeEventListener('resize', getImageVariables);
        }
    }, [pitForm, matchForms, oneValidMatchForms, oneValidPracticeForms, teamEventData, getImageVariables, tab]);

    function renderAbilities(ability, index) {
        return (
            <Box key={ability.label + index} textAlign={'center'}>
                <Text fontSize={'md'} fontWeight={'semibold'}>
                    {ability.label}
                    {ability.type === abilityTypes.radio ? `: ${ability.abilities[0].label}` : ''}
                </Text>
                {(() => {
                    switch (ability.type) {
                        case abilityTypes.checkbox:
                            return (
                                <Flex
                                    justifyContent={'center'}
                                    flexWrap={'wrap'}
                                    marginTop={'5px'}
                                    columnGap={'10px'}
                                    rowGap={'8px'}
                                >
                                    {ability.abilities.length === 0 && (
                                        <Tag fontSize={'md'} fontWeight={'medium'}>
                                            None
                                        </Tag>
                                    )}
                                    {ability.abilities.map((subAbility) => {
                                        return (
                                            <Tag
                                                key={subAbility.label}
                                                fontSize={'md'}
                                                fontWeight={'medium'}
                                                colorScheme='green'
                                            >
                                                {subAbility.label}
                                            </Tag>
                                        );
                                    })}
                                </Flex>
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
            case teamPageTabs.overview:
                return (
                    <Flex flexWrap={'wrap'} justifyContent={'center'} rowGap={'15px'}>
                        <Flex width={{ base: '100%', lg: '40%' }} flexDirection={'column'} alignItems={'center'}>
                            <Text fontSize={'2xl'} fontWeight={'semibold'} textAlign={'center'}>
                                Team Number: {teamNumber}
                            </Text>
                            <Text fontSize={'2xl'} fontWeight={'semibold'} textAlign={'center'}>
                                Team Name: {teamName}
                            </Text>
                            <Flex
                                marginTop={'25px'}
                                width={{ base: '90%', sm: '60%', md: '60%', lg: '90%' }}
                                justifyContent={'center'}
                                flexWrap={'wrap'}
                                rowGap={'15px'}
                                columnGap={'15px'}
                            >
                                {pitForm?.robotImage && (
                                    <ChakraImage
                                        width={{ base: '90%', md: '45%' }}
                                        src={pitForm.robotImage}
                                        objectFit={'contain'}
                                        cursor={'pointer'}
                                        onClick={() => {
                                            setModalImage(pitForm.robotImage);
                                            onOpen();
                                        }}
                                    />
                                )}
                                {pitForm?.wiringImage && (
                                    <ChakraImage
                                        width={{ base: '90%', md: '45%' }}
                                        src={pitForm.wiringImage}
                                        objectFit={'contain'}
                                        cursor={'pointer'}
                                        onClick={() => {
                                            setModalImage(pitForm.wiringImage);
                                            onOpen();
                                        }}
                                    />
                                )}
                            </Flex>
                            <Modal isOpen={isOpen} onClose={onClose} closeOnEsc={true} closeOnOverlayClick={true}>
                                <ModalOverlay>
                                    <ModalContent
                                        margin={'auto'}
                                        maxWidth={'none'}
                                        backgroundColor={'transparent'}
                                        boxShadow={'none'}
                                        width={'fit-content'}
                                        onClick={onClose}
                                    >
                                        <ChakraImage width={'90vw'} height={'90dvh'} fit={'contain'} src={modalImage} />
                                    </ModalContent>
                                </ModalOverlay>
                            </Modal>
                            <MatchScheduleTable teamNumber={teamNumber} event={currentEvent} />
                        </Flex>
                        <Flex
                            width={{ base: '100%', lg: '60%' }}
                            flexDirection={'column'}
                            alignItems={'center'}
                            rowGap={'10px'}
                        >
                            {teamEventData && (
                                <Flex
                                    width={'90%'}
                                    flexWrap={'wrap'}
                                    justifyContent={'center'}
                                    border={'1px solid black'}
                                    borderRadius={'10px'}
                                    backgroundColor={'gray.300'}
                                    overflow={'hidden'} //makes children obey border radius
                                >
                                    <Flex
                                        flex={0.75}
                                        flexGrow={1}
                                        flexDirection={'column'}
                                        minWidth={'80px'}
                                        ref={teamRef}
                                    >
                                        <Flex
                                            alignItems={'center'}
                                            justifyContent={'center'}
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            borderBottom={'1px solid black'}
                                            height={'54px'}
                                        >
                                            Team #
                                        </Flex>
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            padding={'2px 0px'}
                                            backgroundColor={'red.200'}
                                        >
                                            {teamNumber}
                                        </Text>
                                    </Flex>
                                    <Flex
                                        flex={1}
                                        flexDirection={'column'}
                                        minWidth={'200px'}
                                        borderLeft={
                                            childrenOffsetTop.team === childrenOffsetTop.total && '1px solid black'
                                        }
                                        borderTop={
                                            childrenOffsetTop.team !== childrenOffsetTop.total && '1px solid black'
                                        }
                                        ref={totalRef}
                                    >
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            height={'27px'}
                                        >
                                            Total
                                        </Text>
                                        <Flex borderBottom={'1px solid black'} height={'27px'}>
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
                                                Avg GP
                                            </Text>
                                        </Flex>
                                        <Flex padding={'2px 0px'} backgroundColor={'red.200'}>
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {roundToTenth(teamEventData.offensivePoints.avg)}
                                            </Text>
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.offensivePoints.max}
                                            </Text>
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {roundToTenth(
                                                    teamEventData.autoGP.ampScore.avg +
                                                        teamEventData.autoGP.speakerScore.avg +
                                                        teamEventData.teleopGP.ampScore.avg +
                                                        teamEventData.teleopGP.speakerScore.avg
                                                )}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Flex
                                        flexDirection={'column'}
                                        flex={1}
                                        minWidth={'200px'}
                                        borderLeft={
                                            childrenOffsetTop.total === childrenOffsetTop.auto && '1px solid black'
                                        }
                                        borderTop={
                                            childrenOffsetTop.total !== childrenOffsetTop.auto && '1px solid black'
                                        }
                                        ref={autoRef}
                                    >
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            height={'27px'}
                                        >
                                            Auto
                                        </Text>
                                        <Flex borderBottom={'1px solid black'} height={'27px'}>
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
                                                Avg GP
                                            </Text>
                                        </Flex>
                                        <Flex padding={'2px 0px'} backgroundColor={'red.200'}>
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {roundToTenth(teamEventData.autoPoints.avg)}
                                            </Text>
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.autoPoints.max}
                                            </Text>
                                            <Text
                                                flex={1 / 3}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {roundToTenth(
                                                    teamEventData.autoGP.ampScore.avg +
                                                        teamEventData.autoGP.speakerScore.avg
                                                )}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Flex
                                        flexDirection={'column'}
                                        flex={1}
                                        minWidth={'220px'}
                                        borderLeft={
                                            childrenOffsetTop.auto === childrenOffsetTop.teleop && '1px solid black'
                                        }
                                        borderTop={
                                            (childrenOffsetTop.auto !== childrenOffsetTop.teleop ||
                                                childrenOffsetTop.total !== childrenOffsetTop.teleop) &&
                                            '1px solid black'
                                        }
                                        ref={teleopRef}
                                    >
                                        <Flex>
                                            <Text
                                                flex={1 / 2}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                                height={'27px'}
                                            >
                                                Teleop
                                            </Text>
                                            <Text
                                                flex={1 / 2}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                                height={'27px'}
                                            >
                                                Avg GP
                                            </Text>
                                        </Flex>
                                        <Flex borderBottom={'1px solid black'} height={'27px'}>
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
                                                Amp
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                Spea.
                                            </Text>
                                        </Flex>
                                        <Flex padding={'2px 0px'} backgroundColor={'red.200'}>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {roundToTenth(teamEventData.teleopPoints.avg)}
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.teleopPoints.max}
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {roundToTenth(teamEventData.teleopGP.ampScore.avg)}
                                            </Text>
                                            <Flex
                                                flex={1 / 4}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                columnGap={'3px'}
                                            >
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {roundToTenth(teamEventData.teleopGP.speakerScore.avg)}
                                                </Text>
                                                {teamEventData.teleopGP.subwooferScore.avg +
                                                    teamEventData.teleopGP.subwooferMiss.avg >
                                                teamEventData.teleopGP.otherScore.avg +
                                                    teamEventData.teleopGP.otherMiss.avg ? (
                                                    <ChakraToolTip label={'Primary Subwoofer w/Allocation %'} hasArrow>
                                                        <Center>
                                                            <Icon boxSize={5} as={RiSpeaker2Fill} />
                                                            <Text fontSize={'sm'}>{`${roundToWhole(
                                                                ((teamEventData.teleopGP.subwooferScore.avg +
                                                                    teamEventData.teleopGP.subwooferMiss.avg) /
                                                                    (teamEventData.teleopGP.speakerScore.avg +
                                                                        teamEventData.teleopGP.speakerMiss.avg)) *
                                                                    100
                                                            )}%`}</Text>
                                                        </Center>
                                                    </ChakraToolTip>
                                                ) : (
                                                    <ChakraToolTip label={'Primary Ranged w/Allocation %'} hasArrow>
                                                        <Center>
                                                            <Icon boxSize={4} as={GiHighShot} />
                                                            <Text fontSize={'sm'}>{`${roundToWhole(
                                                                ((teamEventData.teleopGP.otherScore.avg +
                                                                    teamEventData.teleopGP.otherMiss.avg) /
                                                                    (teamEventData.teleopGP.speakerScore.avg +
                                                                        teamEventData.teleopGP.speakerMiss.avg)) *
                                                                    100
                                                            )}%`}</Text>
                                                        </Center>
                                                    </ChakraToolTip>
                                                )}
                                            </Flex>
                                        </Flex>
                                    </Flex>
                                    <Flex
                                        flexDirection={'column'}
                                        flex={1}
                                        minWidth={'240px'}
                                        borderLeft={
                                            childrenOffsetTop.teleop === childrenOffsetTop.stage && '1px solid black'
                                        }
                                        borderTop={
                                            (childrenOffsetTop.teleop !== childrenOffsetTop.stage ||
                                                childrenOffsetTop.auto !== childrenOffsetTop.stage) &&
                                            '1px solid black'
                                        }
                                        ref={stageRef}
                                    >
                                        <Text
                                            fontSize={'lg'}
                                            fontWeight={'medium'}
                                            textAlign={'center'}
                                            height={'27px'}
                                        >
                                            Stage
                                        </Text>
                                        <Flex borderBottom={'1px solid black'} height={'27px'}>
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
                                                Hangs
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                Traps
                                            </Text>
                                        </Flex>
                                        <Flex padding={'2px 0px'} backgroundColor={'red.200'}>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {roundToTenth(teamEventData.stagePoints.avg)}
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.stagePoints.max}
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.climbSuccessFraction || 'N/A'}
                                            </Text>
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {teamEventData.teleopGP.trap.total}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            )}
                            {!teamEventData && (
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                    No match data
                                </Text>
                            )}
                            {pitForm && !pitForm.followUp && (
                                <Flex
                                    width={'90%'}
                                    flexWrap={'wrap'}
                                    rowGap={'10px'}
                                    columnGap={'40px'}
                                    justifyContent={'center'}
                                >
                                    <Card
                                        width={{ base: '100%', md: 'calc((100% / 3) - 40px)' }}
                                        size={'sm'}
                                        margin={'0 auto'}
                                        boxShadow={'0 1px 3px 0 rgba(0, 0, 0, 0.15),0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                                    >
                                        <CardHeader paddingBottom={'2px'}>
                                            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                                Basics
                                            </Text>
                                        </CardHeader>
                                        <CardBody>
                                            <Stack divider={<StackDivider />} spacing={'2'}>
                                                <Box textAlign={'center'}>
                                                    <Text fontSize={'md'} fontWeight={'semibold'}>
                                                        Weight
                                                    </Text>
                                                    <Text fontSize={'md'} fontWeight={'medium'}>
                                                        {pitForm.weight} lbs
                                                    </Text>
                                                </Box>
                                                <Box textAlign={'center'}>
                                                    <Text fontSize={'md'} fontWeight={'semibold'}>
                                                        Starting Height
                                                    </Text>
                                                    <Text fontSize={'md'} fontWeight={'medium'}>
                                                        {pitForm.height} inches
                                                    </Text>
                                                </Box>
                                                <Box textAlign={'center'}>
                                                    <Text fontSize={'md'} fontWeight={'semibold'}>
                                                        Frame Size
                                                    </Text>
                                                    <Text fontSize={'md'} fontWeight={'medium'}>
                                                        {pitForm.frameSize.width} in. by {pitForm.frameSize.length} in.
                                                    </Text>
                                                </Box>
                                            </Stack>
                                        </CardBody>
                                    </Card>
                                    <Card
                                        width={{ base: '100%', md: 'calc((100% / 3) - 40px)' }}
                                        size={'sm'}
                                        margin={'0 auto'}
                                        boxShadow={'0 1px 3px 0 rgba(0, 0, 0, 0.15),0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                                    >
                                        <CardHeader paddingBottom={'2px'}>
                                            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                                Drive Train
                                            </Text>
                                        </CardHeader>
                                        <CardBody display={'flex'}>
                                            <Stack divider={<StackDivider />} spacing={'2'} width={'100%'}>
                                                <Box textAlign={'center'}>
                                                    <Text fontSize={'md'} fontWeight={'semibold'}>
                                                        Type
                                                    </Text>
                                                    <Text fontSize={'md'} fontWeight={'medium'}>
                                                        {pitForm.driveTrain}
                                                    </Text>
                                                </Box>
                                                <Flex
                                                    textAlign={'center'}
                                                    flexDirection={'column'}
                                                    justifyContent={'center'}
                                                    flex={1}
                                                >
                                                    <Text fontSize={'md'} fontWeight={'semibold'}>
                                                        Motors
                                                    </Text>
                                                    <Text fontSize={'md'} fontWeight={'medium'}>
                                                        {pitForm.motors
                                                            .map((motor) => `${motor.label} (${motor.value})`)
                                                            .join(', ')}
                                                    </Text>
                                                </Flex>
                                            </Stack>
                                        </CardBody>
                                    </Card>
                                    <Card
                                        width={{ base: '100%', md: 'calc((100% / 3) - 40px)' }}
                                        size={'sm'}
                                        margin={'0 auto'}
                                        boxShadow={'0 1px 3px 0 rgba(0, 0, 0, 0.15),0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                                    >
                                        <CardHeader paddingBottom={'2px'}>
                                            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                                Other
                                            </Text>
                                        </CardHeader>
                                        <CardBody>
                                            <Stack divider={<StackDivider />} spacing={'2'}>
                                                <Box textAlign={'center'}>
                                                    <Text fontSize={'md'} fontWeight={'semibold'}>
                                                        Total Batteries
                                                    </Text>
                                                    <Text fontSize={'md'} fontWeight={'medium'}>
                                                        {pitForm.batteryCount}
                                                    </Text>
                                                </Box>
                                                <Box textAlign={'center'}>
                                                    <Text fontSize={'md'} fontWeight={'semibold'}>
                                                        Batteries Charging
                                                    </Text>
                                                    <Text fontSize={'md'} fontWeight={'medium'}>
                                                        {pitForm.chargingBatteryCount}
                                                    </Text>
                                                </Box>
                                                <Box textAlign={'center'}>
                                                    <Text fontSize={'md'} fontWeight={'semibold'}>
                                                        Wiring
                                                    </Text>
                                                    <Text fontSize={'md'} fontWeight={'medium'}>
                                                        {pitForm.wiringRating.label}
                                                    </Text>
                                                </Box>
                                            </Stack>
                                        </CardBody>
                                    </Card>
                                </Flex>
                            )}
                            {(!pitForm || pitForm.followUp) && (
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                    No pit data
                                </Text>
                            )}
                            {teamEventData && (
                                <Text
                                    fontSize={'xl'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    textDecoration={'underline'}
                                >
                                    Event Ranking
                                </Text>
                            )}
                            {teamEventData && (
                                // This has to be in its own space
                                <Flex
                                    width={{ base: '90vw', sm: '60vw', md: '40vw' }}
                                    height={{ base: '90vw', sm: '60vw', md: 'max(40dvh, 300px)' }}
                                    marginTop={{ base: '-20px', md: '0px' }}
                                    justifyContent={'center'}
                                    position={'relative'}
                                >
                                    <Radar
                                        data={{
                                            labels: [
                                                `Offense (${teamEventData.rank.offense})`,
                                                ['Speaker', `Tele (${teamEventData.rank.teleopSpeaker})`],
                                                `Stage (${teamEventData.rank.stage})`,
                                                `Defense (${
                                                    teamEventData.playedDefense === 0
                                                        ? 'N/A'
                                                        : teamEventData.rank.defense
                                                })`,
                                                `Auto (${teamEventData.rank.auto})`,
                                                ['Amp', `Tele (${teamEventData.rank.teleopAmp})`]
                                            ],
                                            datasets: [
                                                {
                                                    data: [
                                                        'offense',
                                                        'teleopSpeaker',
                                                        'stage',
                                                        'defense',
                                                        'auto',
                                                        'teleopAmp'
                                                    ].map((field) => {
                                                        if (field === 'defense' && teamEventData.playedDefense === 0) {
                                                            return teamEventData.rank.totalTeam;
                                                        }
                                                        return teamEventData.rank[field];
                                                    }),
                                                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                                    borderColor: 'red',
                                                    borderWidth: 1
                                                }
                                            ]
                                        }}
                                        options={{
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                }
                                            },
                                            scales: {
                                                r: {
                                                    reverse: true,
                                                    min: 1,
                                                    max: teamEventData.rank.totalTeams || 10,
                                                    ticks: {
                                                        font: {
                                                            family: `'Open Sans', sans-serif`
                                                        }
                                                    },
                                                    pointLabels: {
                                                        font: {
                                                            size: 14,
                                                            family: `'Open Sans', sans-serif`
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </Flex>
                            )}
                        </Flex>
                    </Flex>
                );
            case teamPageTabs.pit:
                return pitForm && !pitForm.followUp ? (
                    <Box margin={'0 auto'} width={{ base: '90%', md: '66%', lg: '50%' }}>
                        <Box marginBottom={'25px'} position={'relative'}>
                            <Box
                                position={'absolute'}
                                height={'100%'}
                                width={'50%'}
                                boxShadow={'0 1px 3px 0 rgba(0, 0, 0, 0.15),0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                                borderRadius={'0.25rem'}
                            ></Box>
                            <Box
                                position={'absolute'}
                                height={'100%'}
                                width={'50%'}
                                boxShadow={'0 1px 3px 0 rgba(0, 0, 0, 0.15),0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                                borderRadius={'0.25rem'}
                                left={'50%'}
                            ></Box>
                            <Flex padding={'12px'} paddingBottom={'2px'}>
                                <Text
                                    flex={1}
                                    fontSize={'lg'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    paddingRight={'12px'}
                                >
                                    Basics
                                </Text>
                                <Text
                                    flex={1}
                                    fontSize={'lg'}
                                    fontWeight={'semibold'}
                                    textAlign={'center'}
                                    paddingLeft={'12px'}
                                >
                                    Drive Train
                                </Text>
                            </Flex>
                            <Flex padding={'12px'} paddingBottom={'0px'}>
                                <Flex flex={1} flexDirection={'column'}>
                                    <Box marginBottom={'auto'} marginTop={'auto'} paddingRight={'12px'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                            Weight
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                                            {pitForm.weight} lbs
                                        </Text>
                                    </Box>
                                    <StackDivider
                                        borderBottomWidth={'1px'}
                                        margin={'0.5rem 0px'}
                                        marginRight={'12px'}
                                    />
                                </Flex>
                                <Flex flex={1} flexDirection={'column'}>
                                    <Box marginBottom={'auto'} marginTop={'auto'} paddingLeft={'12px'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                            Type
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                                            {pitForm.driveTrain}
                                        </Text>
                                    </Box>
                                    <StackDivider borderBottomWidth={'1px'} margin={'0.5rem 0px'} marginLeft={'12px'} />
                                </Flex>
                            </Flex>
                            <Flex padding={'0px 12px'}>
                                <Flex flex={1} flexDirection={'column'} justifyContent={'center'}>
                                    <Box marginBottom={'auto'} marginTop={'auto'} paddingRight={'12px'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                            Starting Height
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                                            {pitForm.height} inches
                                        </Text>
                                    </Box>
                                    <StackDivider
                                        borderBottomWidth={'1px'}
                                        margin={'0.5rem 0px'}
                                        marginRight={'12px'}
                                    />
                                </Flex>
                                <Flex flex={1} flexDirection={'column'}>
                                    <Box marginBottom={'auto'} marginTop={'auto'} paddingLeft={'12px'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                            Motors
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                                            {pitForm.motors
                                                .map((motor) => `${motor.label} (${motor.value})`)
                                                .join(', ')}
                                        </Text>
                                    </Box>
                                    <StackDivider borderBottomWidth={'1px'} margin={'0.5rem 0px'} marginLeft={'12px'} />
                                </Flex>
                            </Flex>
                            <Flex padding={'0px 12px'} paddingBottom={'12px'}>
                                <Flex flex={1} flexDirection={'column'} justifyContent={'center'}>
                                    <Box marginBottom={'auto'} marginTop={'auto'} paddingRight={'12px'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                            Frame Size
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                                            {pitForm.frameSize.width} in. by {pitForm.frameSize.length} in.
                                        </Text>
                                    </Box>
                                </Flex>
                                <Flex flex={1} flexDirection={'column'}>
                                    <Box marginBottom={'auto'} marginTop={'auto'} paddingLeft={'12px'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'center'}>
                                            Comment
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'} textAlign={'center'}>
                                            {pitForm.driveTrainComment || 'None'}
                                        </Text>
                                    </Box>
                                </Flex>
                            </Flex>
                        </Box>
                        <Card
                            size={'sm'}
                            margin={'0 auto'}
                            boxShadow={'0 1px 3px 0 rgba(0, 0, 0, 0.15),0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                            marginBottom={'25px'}
                        >
                            <CardHeader paddingBottom={'2px'}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                    Autonomous
                                </Text>
                            </CardHeader>
                            <CardBody>
                                <Stack divider={<StackDivider />} spacing={'2'}>
                                    <Box textAlign={'center'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'}>
                                            Programming Lanaguage
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'}>
                                            {pitForm.programmingLanguage}
                                        </Text>
                                    </Box>
                                    <Box textAlign={'center'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'} marginBottom={'5px'}>
                                            Prefered Starting Position
                                        </Text>
                                        <Center
                                            margin={'0 auto'}
                                            marginBottom={'10px'}
                                            width={`${imageWidth * dimensionRatios.width}px`}
                                            height={`${imageHeight * dimensionRatios.height}px`}
                                            position={'relative'}
                                        >
                                            <Spinner
                                                position={'absolute'}
                                                visibility={!imageLoaded ? 'visible' : 'hidden'}
                                            />
                                            <img
                                                src={PreAutoBlueField}
                                                alt={'Field Map'}
                                                style={{ visibility: imageLoaded ? 'visible' : 'hidden' }}
                                                onLoad={() => setImageLoaded(true)}
                                            />
                                            <Flex
                                                position={'absolute'}
                                                visibility={imageLoaded ? 'visible' : 'hidden'}
                                                left={`${
                                                    startingPositions[pitForm.startingPosition - 1][0] *
                                                    dimensionRatios.width
                                                }px`}
                                                top={`${
                                                    startingPositions[pitForm.startingPosition - 1][1] *
                                                    dimensionRatios.height
                                                }px`}
                                                width={`${65 * dimensionRatios.width}px`}
                                                height={`${65 * dimensionRatios.height}px`}
                                                backgroundColor={'gray.500'}
                                                textColor={'white'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                borderRadius={'5px'}
                                            >
                                                {pitForm.startingPosition}
                                            </Flex>
                                        </Center>
                                    </Box>
                                    <Box textAlign={'center'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'}>
                                            Comment
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'}>
                                            {pitForm.autoComment || 'None'}
                                        </Text>
                                    </Box>
                                </Stack>
                            </CardBody>
                        </Card>
                        <Card
                            size={'sm'}
                            margin={'0 auto'}
                            boxShadow={'0 1px 3px 0 rgba(0, 0, 0, 0.15),0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                            marginBottom={'25px'}
                        >
                            <CardHeader paddingBottom={'2px'}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                    Abilities
                                </Text>
                            </CardHeader>
                            <CardBody>
                                <Stack divider={<StackDivider />} spacing={'2'}>
                                    {[...pitForm.autoAbilities, ...pitForm.teleAbilities].map((ability, index) =>
                                        renderAbilities(ability, index)
                                    )}
                                </Stack>
                            </CardBody>
                        </Card>
                        <Card
                            size={'sm'}
                            margin={'0 auto'}
                            boxShadow={'0 1px 3px 0 rgba(0, 0, 0, 0.15),0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                            marginBottom={'25px'}
                        >
                            <CardHeader paddingBottom={'2px'}>
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                    Closing
                                </Text>
                            </CardHeader>
                            <CardBody>
                                <Stack divider={<StackDivider />} spacing={'2'}>
                                    <Box textAlign={'center'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'}>
                                            Total Batteries
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'}>
                                            {pitForm.batteryCount}
                                        </Text>
                                    </Box>
                                    <Box textAlign={'center'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'} marginBottom={'5px'}>
                                            Batteries Charging
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'}>
                                            {pitForm.chargingBatteryCount}
                                        </Text>
                                    </Box>
                                    <Box textAlign={'center'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'} marginBottom={'5px'}>
                                            Wiring
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'}>
                                            {pitForm.wiringRating.label}
                                        </Text>
                                    </Box>
                                    <Box textAlign={'center'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'}>
                                            Working On
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'}>
                                            {pitForm.workingComment || 'None'}
                                        </Text>
                                    </Box>
                                    <Box textAlign={'center'}>
                                        <Text fontSize={'md'} fontWeight={'semibold'}>
                                            End Comment
                                        </Text>
                                        <Text fontSize={'md'} fontWeight={'medium'}>
                                            {pitForm.closingComment || 'None'}
                                        </Text>
                                    </Box>
                                </Stack>
                            </CardBody>
                        </Card>
                    </Box>
                ) : (
                    <Box fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                        No pit data
                    </Box>
                );
            case teamPageTabs.forms:
                return <MatchFormsTable oneValidMatchForms={oneValidMatchForms} dimensionRatios={dimensionRatios} />;
            case teamPageTabs.analysis:
                return (
                    <Flex flexDirection={'column'} rowGap={'15px'}>
                        <MatchLineGraphs
                            teamNumbers={[teamNumber]}
                            multiTeamMatchForms={{
                                [teamNumber]: oneValidMatchForms
                            }}
                        />
                        <AutoPaths
                            teamNumbers={[teamNumber]}
                            autoPaths={{ [teamNumber]: teamEventData?.autoPaths }}
                            showTeamNumber={false}
                        />
                        <TeamStatsList
                            teamNumbers={[teamNumber]}
                            multiTeamEventsData={{ [teamNumber]: teamEventData }}
                            multiTeamMatchForms={{
                                [teamNumber]: oneValidMatchForms
                            }}
                            showTeamNumber={false}
                        />
                    </Flex>
                );
            case teamPageTabs.other:
                return (
                    <MatchFormsTable
                        oneValidMatchForms={oneValidPracticeForms}
                        dimensionRatios={dimensionRatios}
                        practiceForms={true}
                    />
                );
            default:
                return null;
        }
    }

    if (
        pitForm === undefined ||
        matchForms === undefined ||
        practiceForms === undefined ||
        oneValidMatchForms === null ||
        oneValidPracticeForms === null ||
        teamEventData === undefined
    ) {
        // For some reason these needs a zIndex value other wise a black line
        // shows up under the tabs bar but only on chrome and mobile inspector display
        return (
            <Center>
                <Spinner zIndex={-1}></Spinner>
            </Center>
        );
    }

    if ([teamPageTabs.pit, teamPageTabs.forms, teamPageTabs.other].includes(tab) && dimensionRatios === null) {
        return null;
    }

    return renderTab(tab);
}

export default TeamPageTabs;
