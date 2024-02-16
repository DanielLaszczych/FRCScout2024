import React, { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
    PopoverCloseButton,
    PopoverContent,
    PopoverTrigger,
    Spinner,
    Tag,
    Text,
    Card,
    CardHeader,
    CardBody,
    Stack,
    StackDivider,
    Button,
    PopoverBody,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent
} from '@chakra-ui/react';
import {
    convertMatchKeyToString,
    convertStationKeyToString,
    getValueByRange,
    roundToTenth,
    roundToWhole,
    shortenScouterName,
    sortMatches
} from '../util/helperFunctions';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from '../context/auth';
import { Link } from 'react-router-dom';
import { matchFormStatus, teamPageTabs } from '../util/helperConstants';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import PreAutoBlueField from '../images/PreAutoBlueField.png';
import PreAutoRedField from '../images/PreAutoRedField.png';
import { GrMap } from 'react-icons/gr';
import MatchLineGraphs from '../components/MatchLineGraphs';
import AutoPaths from '../components/AutoPaths';
import TeamStatsList from '../components/TeamStatsList';
import MatchScheduleTable from '../components/MatchScheduleTable';

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

function TeamPageTabs({ tab, pitForm, matchForms, teamEventData, teamNumber, teamName, currentEvent }) {
    const { user } = useContext(AuthContext);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const teamRef = useRef();
    const totalRef = useRef();
    const autoRef = useRef();
    const teleopRef = useRef();
    const stageRef = useRef();

    const [dimensionRatios, setDimensionRatios] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [commentsToggled, setCommentsToggled] = useState([]);
    const [oneValidMatchForms, setOneValidMatchForms] = useState(null);
    const [modalImage, setModalImage] = useState(null);
    const [childrenWrapped, setChildrenWrapped] = useState({
        team: false,
        total: false,
        auto: false,
        teleop: false
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
    }, [matchForms]);

    useLayoutEffect(() => {
        setDimensionRatios(null);
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

    const getChildrenWrapped = useCallback(() => {
        let newChildrenWrapped = {};
        newChildrenWrapped.team = teamRef.current?.offsetTop !== totalRef.current?.offsetTop;
        newChildrenWrapped.total = totalRef.current?.offsetTop !== autoRef.current?.offsetTop;
        newChildrenWrapped.auto = autoRef.current?.offsetTop !== teleopRef.current?.offsetTop;
        newChildrenWrapped.teleop = teleopRef.current?.offsetTop !== stageRef.current?.offsetTop;
        setChildrenWrapped(newChildrenWrapped);
    }, []);

    useLayoutEffect(() => {
        getChildrenWrapped();

        window.addEventListener('resize', getChildrenWrapped);

        return () => window.removeEventListener('resize', getChildrenWrapped);
    }, [pitForm, matchForms, oneValidMatchForms, teamEventData, getChildrenWrapped]);

    useLayoutEffect(() => {
        if ([teamPageTabs.pit, teamPageTabs.forms].includes(tab)) {
            getImageVariables();
            window.addEventListener('resize', getImageVariables);

            return () => window.removeEventListener('resize', getImageVariables);
        }
    }, [getImageVariables, tab]);

    function getPoint(pointX, station) {
        let mirror = 185;
        if (station.charAt(0) === 'r') {
            // Calculate mirrored x-coordinate
            return 2 * mirror - pointX;
        } else {
            return pointX;
        }
    }

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
                                        <ChakraImage
                                            width={'min(90vw, 90dvh)'}
                                            height={'min(90vw, 90dvh)'}
                                            fit={'contain'}
                                            src={modalImage}
                                        />
                                    </ModalContent>
                                </ModalOverlay>
                            </Modal>
                            <MatchScheduleTable teamNumber={teamNumber} currentEvent={currentEvent} />
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
                                    borderBottom={'none'}
                                    borderRadius={'10px'}
                                    backgroundColor={'gray.200'}
                                    overflow={'hidden'} //makes children obey border radius
                                >
                                    <Flex
                                        flex={0.75}
                                        flexDirection={'column'}
                                        minWidth={'80px'}
                                        borderRight={!childrenWrapped.team && '1px solid black'}
                                        borderBottom={'1px solid black'}
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
                                        minWidth={'190px'}
                                        borderRight={!childrenWrapped.total && '1px solid black'}
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
                                        <Flex
                                            padding={'2px 0px'}
                                            backgroundColor={'red.200'}
                                            borderBottom={'1px solid black'}
                                        >
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
                                        minWidth={'190px'}
                                        borderRight={!childrenWrapped.auto && '1px solid black'}
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
                                        <Flex
                                            padding={'2px 0px'}
                                            backgroundColor={'red.200'}
                                            borderBottom={'1px solid black'}
                                        >
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
                                        borderRight={!childrenWrapped.teleop && '1px solid black'}
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
                                        <Flex
                                            padding={'2px 0px'}
                                            backgroundColor={'red.200'}
                                            borderBottom={'1px solid black'}
                                        >
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
                                            <Text
                                                flex={1 / 4}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                            >
                                                {roundToTenth(teamEventData.teleopGP.speakerScore.avg)}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                    <Flex flexDirection={'column'} flex={1} minWidth={'240px'} ref={stageRef}>
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
                                        <Flex
                                            padding={'2px 0px'}
                                            backgroundColor={'red.200'}
                                            borderBottom={'1px solid black'}
                                        >
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
                return (
                    // Match #, Scouter (Both if possible), Starting Position, Pre-loaded, left zone, game piece auto, game piece tele, climb, super scout stats, issues, comment
                    <Box>
                        {oneValidMatchForms.length > 0 && (
                            <Box width={'100%'} overflowX={'auto'}>
                                <Grid
                                    templateColumns={'0.75fr 1fr 1fr 0.75fr 0.75fr repeat(8, 1fr)'}
                                    borderTop={'1px solid black'}
                                    minWidth={'1900px'}
                                >
                                    {[
                                        'Match #',
                                        'Scouters',
                                        'Starting Position',
                                        'Pre-loaded',
                                        'Left Start',
                                        'Scoring (Auto)',
                                        'Intaking (Tele)',
                                        'Scoring (Tele)',
                                        'Stage',
                                        'Defense',
                                        'Super Form',
                                        'Issues',
                                        'Comment'
                                    ].map((label) => (
                                        <GridItem
                                            key={label}
                                            fontSize={'lg'}
                                            fontWeight={'semibold'}
                                            textAlign={'center'}
                                            display={'flex'}
                                            justifyContent={'center'}
                                            alignItems={'center'}
                                            borderBottom={'1px solid black'}
                                            borderRight={'1px solid black'}
                                            backgroundColor={'gray.400'}
                                            padding={'10px 0px'}
                                            position={label === 'Match #' && 'sticky'}
                                            left={label === 'Match #' && 0}
                                            zIndex={label === 'Match #' && 1}
                                            borderLeft={label === 'Match #' && '1px solid black'}
                                        >
                                            {label}
                                        </GridItem>
                                    ))}
                                    {sortMatches(oneValidMatchForms).map((matchForm) => (
                                        <React.Fragment key={matchForm.matchNumber}>
                                            {user.admin ? (
                                                <Popover isLazy={true}>
                                                    <PopoverTrigger>
                                                        <GridItem
                                                            borderBottom={'1px solid black'}
                                                            borderRight={'1px solid black'}
                                                            backgroundColor={'gray.200'}
                                                            minHeight={'100px'}
                                                            position={'sticky'}
                                                            left={0}
                                                            zIndex={1}
                                                            borderLeft={'1px solid black'}
                                                        >
                                                            <Button
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textAlign={'center'}
                                                                whiteSpace={'pre-line'}
                                                                height={'100%'}
                                                                width={'100%'}
                                                                backgroundColor={'transparent'}
                                                                borderRadius={'0px'}
                                                                lineHeight={'unset'}
                                                                _hover={{ backgroundColor: 'gray.300' }}
                                                            >
                                                                {convertMatchKeyToString(matchForm.matchNumber, true)}
                                                                {'\n'}
                                                                {convertStationKeyToString(matchForm.station)}
                                                            </Button>
                                                        </GridItem>
                                                    </PopoverTrigger>
                                                    <PopoverContent width={'fit-content'}>
                                                        <PopoverArrow />
                                                        <PopoverCloseButton />
                                                        <PopoverBody
                                                            display={'flex'}
                                                            flexDirection={'column'}
                                                            rowGap={'10px'}
                                                        >
                                                            <Button
                                                                as={
                                                                    matchForm.standStatus !== matchFormStatus.missing &&
                                                                    Link
                                                                }
                                                                to={
                                                                    matchForm.standStatus !== matchFormStatus.missing
                                                                        ? `/standForm/${matchForm.eventKey}/${matchForm.matchNumber}/${matchForm.station}/${teamNumber}`
                                                                        : null
                                                                }
                                                                state={{ previousRoute: 'team' }}
                                                                isDisabled={
                                                                    matchForm.standStatus === matchFormStatus.missing
                                                                }
                                                            >
                                                                {matchForm.standStatus !== matchFormStatus.missing
                                                                    ? 'Stand Form'
                                                                    : 'No Stand Form'}
                                                            </Button>
                                                            <Button
                                                                as={
                                                                    matchForm.superStatus !== matchFormStatus.missing &&
                                                                    Link
                                                                }
                                                                to={
                                                                    matchForm.superStatus !== matchFormStatus.missing
                                                                        ? `/superForm/${matchForm.eventKey}/${
                                                                              matchForm.matchNumber
                                                                          }/${matchForm.station.charAt(0)}/${
                                                                              matchForm.allianceNumbers[0]
                                                                          }/${matchForm.allianceNumbers[1]}/${
                                                                              matchForm.allianceNumbers[2]
                                                                          }`
                                                                        : null
                                                                }
                                                                state={{
                                                                    previousRoute: 'team',
                                                                    teamNumber: teamNumber
                                                                }}
                                                                isDisabled={
                                                                    matchForm.superStatus === matchFormStatus.missing
                                                                }
                                                            >
                                                                {matchForm.superStatus !== matchFormStatus.missing
                                                                    ? 'Super Form'
                                                                    : 'No Super Form'}
                                                            </Button>
                                                        </PopoverBody>
                                                    </PopoverContent>
                                                </Popover>
                                            ) : (
                                                <GridItem
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                    display={'flex'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    borderBottom={'1px solid black'}
                                                    borderRight={'1px solid black'}
                                                    backgroundColor={'gray.200'}
                                                    minHeight={'100px'}
                                                    position={'sticky'}
                                                    left={0}
                                                    zIndex={1}
                                                    whiteSpace={'pre-line'}
                                                    borderLeft={'1px solid black'}
                                                >
                                                    {convertMatchKeyToString(matchForm.matchNumber, true)}
                                                    {'\n'}
                                                    {convertStationKeyToString(matchForm.station)}
                                                </GridItem>
                                            )}
                                            <GridItem
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                flexDirection={'column'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                backgroundColor={'gray.200'}
                                                minWidth={'160px'}
                                            >
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {`Stand: ${
                                                        matchForm.standStatus === matchFormStatus.missing
                                                            ? 'N/A'
                                                            : shortenScouterName(matchForm.standScouter)
                                                    }`}
                                                </Text>
                                                <Text fontSize={'lg'} fontWeight={'medium'} textAlign={'center'}>
                                                    {`Super: ${
                                                        matchForm.superStatus === matchFormStatus.missing
                                                            ? 'N/A'
                                                            : shortenScouterName(matchForm.superScouter)
                                                    }`}
                                                </Text>
                                            </GridItem>
                                            {[
                                                matchFormStatus.followUp,
                                                matchFormStatus.missing,
                                                matchFormStatus.noShow
                                            ].includes(matchForm.standStatus) && (
                                                <GridItem
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                    display={'flex'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    borderBottom={'1px solid black'}
                                                    borderRight={'1px solid black'}
                                                    colSpan={8}
                                                    backgroundColor={'gray.200'}
                                                >
                                                    {matchForm.standStatus === matchFormStatus.followUp
                                                        ? 'Marked for follow up'
                                                        : matchForm.standStatus === matchFormStatus.missing
                                                        ? 'Not yet completed'
                                                        : 'No show'}
                                                </GridItem>
                                            )}
                                            {matchForm.standStatus === matchFormStatus.complete && (
                                                <React.Fragment>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={'gray.200'}
                                                        minWidth={'150px'}
                                                    >
                                                        <Popover
                                                            flip={false}
                                                            placement={'bottom'}
                                                            onOpen={() => setImageLoaded(false)}
                                                            isLazy={true}
                                                        >
                                                            <PopoverTrigger>
                                                                <IconButton icon={<GrMap />} size='sm' />
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                // Unnessary border that add 1px to all sides
                                                                border={'none'}
                                                                width={{
                                                                    base: '75vw',
                                                                    sm: '60vw',
                                                                    md: '35vw',
                                                                    lg: '20vw'
                                                                }}
                                                                position={'relative'}
                                                                padding={'25px'}
                                                            >
                                                                <PopoverArrow />
                                                                <PopoverCloseButton />
                                                                <Center
                                                                    margin={'0 auto'}
                                                                    width={`${imageWidth * dimensionRatios.width}px`}
                                                                    height={`${imageHeight * dimensionRatios.height}px`}
                                                                    position={'relative'}
                                                                >
                                                                    <Spinner
                                                                        position={'absolute'}
                                                                        visibility={!imageLoaded ? 'visible' : 'hidden'}
                                                                    />
                                                                    <img
                                                                        src={
                                                                            matchForm.station.charAt(0) === 'r'
                                                                                ? PreAutoRedField
                                                                                : PreAutoBlueField
                                                                        }
                                                                        style={{
                                                                            visibility: imageLoaded
                                                                                ? 'visible'
                                                                                : 'hidden'
                                                                        }}
                                                                        alt={'Field Map'}
                                                                        onLoad={() => setImageLoaded(true)}
                                                                    />
                                                                    <Flex
                                                                        position={'absolute'}
                                                                        visibility={imageLoaded ? 'visible' : 'hidden'}
                                                                        left={`${
                                                                            getPoint(
                                                                                startingPositions[
                                                                                    matchForm.startingPosition - 1
                                                                                ][0],
                                                                                matchForm.station
                                                                            ) * dimensionRatios.width
                                                                        }px`}
                                                                        top={`${
                                                                            startingPositions[
                                                                                matchForm.startingPosition - 1
                                                                            ][1] * dimensionRatios.height
                                                                        }px`}
                                                                        width={`${65 * dimensionRatios.width}px`}
                                                                        height={`${65 * dimensionRatios.height}px`}
                                                                        backgroundColor={'gray.500'}
                                                                        textColor={'white'}
                                                                        justifyContent={'center'}
                                                                        alignItems={'center'}
                                                                        borderRadius={'5px'}
                                                                    >
                                                                        {matchForm.startingPosition}
                                                                    </Flex>
                                                                </Center>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </GridItem>
                                                    <GridItem
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={'gray.200'}
                                                    >
                                                        {matchForm.preLoadedPiece}
                                                    </GridItem>
                                                    <GridItem
                                                        fontSize={'lg'}
                                                        fontWeight={'medium'}
                                                        textAlign={'center'}
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={'gray.200'}
                                                    >
                                                        {matchForm.leftStart ? 'Yes' : 'No'}
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        flexDirection={'column'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={'gray.200'}
                                                        minWidth={'180px'}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Amp: `}
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textColor={'green'}
                                                                as={'span'}
                                                            >
                                                                {matchForm.autoGP.ampScore}
                                                            </Text>
                                                            <Text
                                                                fontSize={'md'}
                                                                fontWeight={'medium'}
                                                                textColor={'crimson'}
                                                                as={'span'}
                                                            >
                                                                {' '}
                                                                ({matchForm.autoGP.ampMiss})
                                                            </Text>
                                                            {matchForm.autoGP.ampScore + matchForm.autoGP.ampMiss >
                                                                0 && (
                                                                <Text fontSize={'md'} fontWeight={'medium'} as={'span'}>
                                                                    {` ${roundToWhole(
                                                                        (matchForm.autoGP.ampScore /
                                                                            (matchForm.autoGP.ampScore +
                                                                                matchForm.autoGP.ampMiss)) *
                                                                            100
                                                                    )}%`}
                                                                </Text>
                                                            )}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Speaker: `}
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textColor={'green'}
                                                                as={'span'}
                                                            >
                                                                {matchForm.autoGP.speakerScore}
                                                            </Text>
                                                            <Text
                                                                fontSize={'md'}
                                                                fontWeight={'medium'}
                                                                textColor={'crimson'}
                                                                as={'span'}
                                                            >
                                                                {' '}
                                                                ({matchForm.autoGP.speakerMiss})
                                                            </Text>
                                                            {matchForm.autoGP.speakerScore +
                                                                matchForm.autoGP.speakerMiss >
                                                                0 && (
                                                                <Text fontSize={'md'} fontWeight={'medium'} as={'span'}>
                                                                    {` ${roundToWhole(
                                                                        (matchForm.autoGP.speakerScore /
                                                                            (matchForm.autoGP.speakerScore +
                                                                                matchForm.autoGP.speakerMiss)) *
                                                                            100
                                                                    )}%`}
                                                                </Text>
                                                            )}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Intake Miss: `}
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textColor={'crimson'}
                                                                as={'span'}
                                                            >
                                                                {matchForm.autoGP.intakeMiss}
                                                            </Text>
                                                        </Text>
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        flexDirection={'column'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={'gray.200'}
                                                        minWidth={'140px'}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Source: ${matchForm.teleopGP.intakeSource}`}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Ground: ${matchForm.teleopGP.intakeGround}`}
                                                        </Text>
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        flexDirection={'column'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={'gray.200'}
                                                        minWidth={'180px'}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Amp: `}
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textColor={'green'}
                                                                as={'span'}
                                                            >
                                                                {matchForm.teleopGP.ampScore}
                                                            </Text>
                                                            <Text
                                                                fontSize={'md'}
                                                                fontWeight={'medium'}
                                                                textColor={'crimson'}
                                                                as={'span'}
                                                            >
                                                                {' '}
                                                                ({matchForm.teleopGP.ampMiss})
                                                            </Text>
                                                            {matchForm.teleopGP.ampScore + matchForm.teleopGP.ampMiss >
                                                                0 && (
                                                                <Text fontSize={'md'} fontWeight={'medium'} as={'span'}>
                                                                    {` ${roundToWhole(
                                                                        (matchForm.teleopGP.ampScore /
                                                                            (matchForm.teleopGP.ampScore +
                                                                                matchForm.teleopGP.ampMiss)) *
                                                                            100
                                                                    )}%`}
                                                                </Text>
                                                            )}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Speaker: `}
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textColor={'green'}
                                                                as={'span'}
                                                            >
                                                                {matchForm.teleopGP.speakerScore}
                                                            </Text>
                                                            <Text
                                                                fontSize={'md'}
                                                                fontWeight={'medium'}
                                                                textColor={'crimson'}
                                                                as={'span'}
                                                            >
                                                                {' '}
                                                                ({matchForm.teleopGP.speakerMiss})
                                                            </Text>
                                                            {matchForm.teleopGP.speakerScore +
                                                                matchForm.teleopGP.speakerMiss >
                                                                0 && (
                                                                <Text fontSize={'md'} fontWeight={'medium'} as={'span'}>
                                                                    {` ${roundToWhole(
                                                                        (matchForm.teleopGP.speakerScore /
                                                                            (matchForm.teleopGP.speakerScore +
                                                                                matchForm.teleopGP.speakerMiss)) *
                                                                            100
                                                                    )}%`}
                                                                </Text>
                                                            )}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Ferry: ${matchForm.teleopGP.ferry}`}
                                                        </Text>
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        flexDirection={'column'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={'gray.200'}
                                                        minWidth={'175px'}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Climb: ${matchForm.climb.attempt}${
                                                                matchForm.climb.attempt === 'Success'
                                                                    ? ` (+${matchForm.climb.harmony})`
                                                                    : ''
                                                            }`}
                                                        </Text>
                                                        {matchForm.climb.attempt !== 'Success' && (
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textAlign={'center'}
                                                            >
                                                                {`Park: ${matchForm.climb.park ? 'Yes' : 'No'}`}
                                                            </Text>
                                                        )}
                                                        {matchForm.climb.attempt === 'Success' && (
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textAlign={'center'}
                                                            >
                                                                {`Location: ${matchForm.climb.location}`}
                                                            </Text>
                                                        )}
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Trap: ${matchForm.teleopGP.trap}`}
                                                        </Text>
                                                    </GridItem>
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        flexDirection={'column'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={'gray.200'}
                                                        minWidth={'170px'}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Rating: ${matchForm.defenseRating || 'N/A'}`}
                                                        </Text>
                                                        {matchForm.defenseRating > 0 && (
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textAlign={'center'}
                                                            >
                                                                {`Allocation: ${
                                                                    matchForm.defenseAllocation * 100 + '%' || 'N/A'
                                                                }`}
                                                            </Text>
                                                        )}
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Was Defended: ${matchForm.wasDefended ? 'Yes' : 'No'}`}
                                                        </Text>
                                                    </GridItem>
                                                </React.Fragment>
                                            )}
                                            <GridItem
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                flexDirection={'column'}
                                                fontSize={'lg'}
                                                fontWeight={'medium'}
                                                textAlign={'center'}
                                                borderBottom={'1px solid black'}
                                                borderRight={'1px solid black'}
                                                backgroundColor={'gray.200'}
                                                minWidth={'135px'}
                                                // Just to make 'Not yet completed' look nicer
                                                padding={
                                                    matchForm.superStatus === matchFormStatus.missing
                                                        ? '0px 5px'
                                                        : '0px'
                                                }
                                            >
                                                {matchForm.superStatus === matchFormStatus.followUp
                                                    ? 'Marked for follow up'
                                                    : matchForm.superStatus === matchFormStatus.missing
                                                    ? 'Not yet completed'
                                                    : matchForm.superStatus === matchFormStatus.noShow
                                                    ? 'No show'
                                                    : ''}
                                                {matchForm.superStatus === matchFormStatus.complete && (
                                                    <React.Fragment>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Agility: ${matchForm.agility || 'N/A'}`}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`Field Aware: ${matchForm.fieldAwareness || 'N/A'}`}
                                                        </Text>
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                        >
                                                            {`High Note: `}
                                                            {matchForm.ampPlayer ? (
                                                                <React.Fragment>
                                                                    <Text
                                                                        fontSize={'lg'}
                                                                        fontWeight={'medium'}
                                                                        textColor={'green'}
                                                                        as={'span'}
                                                                    >
                                                                        {matchForm.ampPlayerGP.highNoteScore}
                                                                    </Text>
                                                                    <Text
                                                                        fontSize={'md'}
                                                                        fontWeight={'medium'}
                                                                        textColor={'crimson'}
                                                                        as={'span'}
                                                                    >
                                                                        {' '}
                                                                        ({matchForm.ampPlayerGP.highNoteMiss})
                                                                    </Text>
                                                                </React.Fragment>
                                                            ) : (
                                                                'N/A'
                                                            )}
                                                        </Text>
                                                    </React.Fragment>
                                                )}
                                            </GridItem>
                                            {[
                                                matchFormStatus.followUp,
                                                matchFormStatus.missing,
                                                matchFormStatus.noShow
                                            ].includes(matchForm.standStatus) && (
                                                <GridItem
                                                    fontSize={'lg'}
                                                    fontWeight={'medium'}
                                                    textAlign={'center'}
                                                    display={'flex'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    borderBottom={'1px solid black'}
                                                    borderRight={'1px solid black'}
                                                    colSpan={matchForm.standStatus === matchFormStatus.noShow ? 1 : 2}
                                                    backgroundColor={'gray.200'}
                                                >
                                                    {matchForm.standStatus === matchFormStatus.followUp
                                                        ? 'Marked for follow up'
                                                        : matchForm.standStatus === matchFormStatus.missing
                                                        ? 'Not yet completed'
                                                        : 'No show'}
                                                </GridItem>
                                            )}
                                            {[matchFormStatus.complete, matchFormStatus.noShow].includes(
                                                matchForm.standStatus
                                            ) && (
                                                <React.Fragment>
                                                    {matchForm.standStatus === matchFormStatus.complete && (
                                                        <GridItem
                                                            display={'flex'}
                                                            justifyContent={'center'}
                                                            alignItems={'center'}
                                                            flexDirection={'column'}
                                                            borderBottom={'1px solid black'}
                                                            borderRight={'1px solid black'}
                                                            backgroundColor={'gray.200'}
                                                            minWidth={'120px'}
                                                        >
                                                            <Text
                                                                fontSize={'lg'}
                                                                fontWeight={'medium'}
                                                                textAlign={'center'}
                                                            >
                                                                {[
                                                                    matchForm.lostCommunication ? 'Lost comms' : false,
                                                                    matchForm.robotBroke ? 'Broke' : false,
                                                                    matchForm.yellowCard ? 'Yellow card' : false,
                                                                    matchForm.redCard ? 'Red card' : false
                                                                ]
                                                                    .filter((elem) => elem)
                                                                    .join(', ') || 'No issues'}
                                                            </Text>
                                                        </GridItem>
                                                    )}
                                                    <GridItem
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                        borderBottom={'1px solid black'}
                                                        borderRight={'1px solid black'}
                                                        backgroundColor={'gray.200'}
                                                        minWidth={'120px'}
                                                        padding={
                                                            commentsToggled.includes(matchForm.matchNumber)
                                                                ? '10px 10px'
                                                                : '0px 10px'
                                                        }
                                                        onClick={() => {
                                                            if (commentsToggled.includes(matchForm.matchNumber)) {
                                                                setCommentsToggled(
                                                                    commentsToggled.filter(
                                                                        (matchNumber) =>
                                                                            matchNumber !== matchForm.matchNumber
                                                                    )
                                                                );
                                                            } else {
                                                                setCommentsToggled([
                                                                    ...commentsToggled,
                                                                    matchForm.matchNumber
                                                                ]);
                                                            }
                                                        }}
                                                        cursor={'pointer'}
                                                        _hover={{
                                                            backgroundColor: 'gray.300'
                                                        }}
                                                    >
                                                        <Text
                                                            fontSize={'lg'}
                                                            fontWeight={'medium'}
                                                            textAlign={'center'}
                                                            style={{
                                                                WebkitLineClamp: commentsToggled.includes(
                                                                    matchForm.matchNumber
                                                                )
                                                                    ? 'unset'
                                                                    : '3',
                                                                display: '-webkit-box',
                                                                WebkitBoxOrient: 'vertical'
                                                            }}
                                                            overflow={'hidden'}
                                                            textOverflow={'ellipsis'}
                                                        >
                                                            {matchForm.standStatus === matchFormStatus.noShow
                                                                ? matchForm.standStatusComment
                                                                : matchForm.standComment || 'No comment'}
                                                        </Text>
                                                    </GridItem>
                                                </React.Fragment>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                        {oneValidMatchForms.length === 0 && (
                            <Box fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                                No match data
                            </Box>
                        )}
                    </Box>
                );
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
                    <Box>
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

    if (
        pitForm === undefined ||
        matchForms === undefined ||
        oneValidMatchForms === null ||
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

    if ([teamPageTabs.pit, teamPageTabs.forms].includes(tab) && dimensionRatios === null) {
        return null;
    }

    return renderTab(tab);
}

export default TeamPageTabs;
