import React, { useLayoutEffect, useRef, useState } from 'react';
import {
    Box,
    Button,
    Center,
    Flex,
    Grid,
    GridItem,
    HStack,
    IconButton,
    Input,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    Textarea,
    Tooltip,
    useToast
} from '@chakra-ui/react';
import { rtessIssuesStatus, teamNumber, timeZone, year } from '../util/helperConstants';
import { convertMatchKeyToString, roundToWhole } from '../util/helperFunctions';
import { circularLinkedList } from '../util/circularlinkedlist';
import { AiFillFilter, AiOutlinePlus } from 'react-icons/ai';
import { CheckCircleIcon, ChevronDownIcon, WarningIcon } from '@chakra-ui/icons';
import { HiWrenchScrewdriver } from 'react-icons/hi2';
import RTESSIssuesMemo from '../components/RTESSIssuesMemo.';
import { MdDownload } from 'react-icons/md';
import { v4 as uuidv4 } from 'uuid';
import FileSaver from 'file-saver';
import XLSX from 'sheetjs-style';

const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const issuesArr = [
    { name: 'Mechanical', key: uuidv4() },
    { name: 'Electrical', key: uuidv4() },
    { name: 'Programming', key: uuidv4() },
    { name: 'Inspection', key: uuidv4() },
    { name: 'Other', key: uuidv4() }
];
let rtessIssueCLL = new circularLinkedList();
rtessIssueCLL.append({ key: 'None', emptyMsg: '' });
rtessIssueCLL.append({ key: rtessIssuesStatus.unresolved, emptyMsg: 'No unresolved RTESS issues' });
rtessIssueCLL.append({ key: rtessIssuesStatus.beingResolved, emptyMsg: 'No RTESS issues being resolved' });
rtessIssueCLL.append({ key: rtessIssuesStatus.resolved, emptyMsg: 'No resolved RTESS issues' });

function RTESSIssuesTabs({ tab, currentEvent, rtessIssues, eventInfo, setError, fetchRTESSIssues }) {
    const cancelRef = useRef();
    const toast = useToast();

    const [rtessIssueFilter, setRTESSIssueFilter] = useState(rtessIssueCLL.getHead());
    const [rtessIssuesListVersion, setRTESSIssuesListVersion] = useState(0);
    const [filteredRTESSIssues, setFilteredRTESSIssues] = useState(rtessIssues);
    const [rtessIssueDialog, setRTESSIssueDialog] = useState({ open: false, issue: null });
    const [rtessIssueData, setRTESSIssueData] = useState({
        teamNumber: '',
        issue: '',
        focusedIssue: '',
        problemComment: '',
        solutionComment: ''
    });
    const [rtessIssuePopoverError, setRTESSIssuePopoverError] = useState(null);
    const [fetchingConfirmation, setFetchingConfirmation] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useLayoutEffect(() => {
        let newRTESSIssues = [];
        for (let rtessIssue of rtessIssues) {
            if (rtessIssueFilter.elem.key !== 'None' && rtessIssueFilter.elem.key !== rtessIssue.status) {
                continue;
            }
            newRTESSIssues.push(rtessIssue);
        }
        newRTESSIssues = newRTESSIssues.sort((a, b) => {
            let diff =
                Object.values(rtessIssuesStatus).indexOf(a.status) - Object.values(rtessIssuesStatus).indexOf(b.status);
            if (diff === 0) {
                diff = parseInt(a.teamNumber) - parseInt(b.teamNumber);
            }
            if (diff === 0) {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            }
            return diff;
        });
        setFilteredRTESSIssues(newRTESSIssues);
        setRTESSIssuesListVersion((prevVersion) => prevVersion + 1);
    }, [rtessIssues, rtessIssueFilter]);

    function getIssueOfTeam(teamNumber) {
        let issue = rtessIssues.find(
            (rtessIssue) =>
                rtessIssue.teamNumber === parseInt(teamNumber) &&
                [rtessIssuesStatus.unresolved, rtessIssuesStatus.beingResolved].includes(rtessIssue.status)
        );
        if (issue) {
            return issue;
        }
        return null;
    }

    function getIcon(filter) {
        switch (filter) {
            case 'None':
                return <AiFillFilter />;
            case rtessIssuesStatus.unresolved:
                return <WarningIcon />;
            case rtessIssuesStatus.resolved:
                return <CheckCircleIcon />;
            case rtessIssuesStatus.beingResolved:
                return <HiWrenchScrewdriver />;
            default:
                return <WarningIcon />;
        }
    }

    function getColor(filter) {
        switch (filter) {
            case 'None':
                return 'black';
            case rtessIssuesStatus.unresolved:
                return 'red';
            case rtessIssuesStatus.beingResolved:
                return 'yellow';
            case rtessIssuesStatus.resolved:
                return 'green';
            default:
                return 'black';
        }
    }

    function submit() {
        setSubmitting(true);
        fetch(`/blueAlliance/team/frc${parseInt(rtessIssueData.teamNumber)}/simple`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    fetch('/rtessIssue/postRTESSIssue', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            eventKey: currentEvent.key,
                            teamNumber: parseInt(rtessIssueData.teamNumber),
                            teamName: data.nickname,
                            issue: rtessIssueData.issue,
                            problemComment: rtessIssueData.problemComment.trim(),
                            solutionComment: rtessIssueData.solutionComment.trim(),
                            status: rtessIssueDialog.issue ? rtessIssuesStatus.unresolved : rtessIssuesStatus.resolved
                        })
                    })
                        .then((response) => {
                            if (response.status === 200) {
                                toast({
                                    title: 'RTESS Issue Created',
                                    status: 'success',
                                    duration: 3000,
                                    isClosable: true
                                });
                                setRTESSIssueDialog({ open: false, issue: null });
                                setRTESSIssueData({
                                    teamNumber: '',
                                    issue: '',
                                    focusedIssue: '',
                                    problemComment: '',
                                    solutionComment: ''
                                });
                                setRTESSIssuePopoverError(null);
                                setSubmitAttempted(false);
                                setSubmitting(false);
                                fetchRTESSIssues();
                            } else {
                                throw new Error(response.statusText);
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            toast({
                                title: 'Error',
                                description: 'RTESS Issue could not be created',
                                status: 'error',
                                duration: 3000,
                                isClosable: true
                            });
                            setSubmitting(false);
                        });
                } else {
                    setError(data.Error);
                }
            })
            .catch((error) => {
                setError(error);
            });
    }

    function handleRTESSIssueConfirm() {
        if (currentEvent.custom) {
            submit();
            return;
        }
        setFetchingConfirmation(true);
        setSubmitAttempted(true);
        fetch(`/blueAlliance/team/frc${parseInt(rtessIssueData.teamNumber)}/events/${year}/simple`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    let event = data.find((event) => event.key === currentEvent.key);
                    if (event === undefined) {
                        setRTESSIssuePopoverError('This team is not competing at this event');
                    } else {
                        submit();
                    }
                } else {
                    setRTESSIssuePopoverError(data.Error);
                }
                setFetchingConfirmation(false);
            })
            .catch((error) => {
                setRTESSIssuePopoverError(error);
                setFetchingConfirmation(false);
            });
    }

    function downloadRTESSLogs() {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

        rtessIssues = rtessIssues.sort((a, b) => {
            let diff =
                Object.values(rtessIssuesStatus).indexOf(a.status) - Object.values(rtessIssuesStatus).indexOf(b.status);
            if (diff === 0) {
                diff = parseInt(a.teamNumber) - parseInt(b.teamNumber);
            }
            if (diff === 0) {
                return new Date(parseInt(b.updatedAt)) - new Date(parseInt(a.updatedAt));
            }
            return diff;
        });
        let issuesArray = [];
        rtessIssues.forEach((rtessIssue) => {
            issuesArray.push({
                'Event Name': currentEvent.name,
                'Team Number': rtessIssue.teamNumber,
                Submitter: rtessIssue.submitter,
                'RTESS Member': rtessIssue.rtessMember,
                Status: rtessIssue.status,
                Category: rtessIssue.issue,
                Problem: rtessIssue.problemComment,
                Solution: rtessIssue.solutionComment
            });
        });
        const issuesJSON = XLSX.utils.json_to_sheet(issuesArray);
        const wb = {
            Sheets: { RTESS: issuesJSON },
            SheetNames: ['RTESS']
        };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, `${currentEvent.name} RTESSLogs.xlsx`);
    }

    function renderTab(tab) {
        switch (tab) {
            case 'team':
                return (
                    <Box>
                        {!eventInfo.inEvent ? (
                            <Text
                                fontSize={'lg'}
                                fontWeight={'semibold'}
                                textAlign={'center'}
                                margin={'0 auto'}
                                width={{ base: '85%', md: '66%', lg: '50%' }}
                            >
                                We are not registered for this event
                            </Text>
                        ) : (
                            <Box>
                                {eventInfo.matchTable.length === 0 ? (
                                    <Text
                                        fontSize={'lg'}
                                        fontWeight={'semibold'}
                                        textAlign={'center'}
                                        margin={'0 auto'}
                                        width={{ base: '85%', md: '66%', lg: '50%' }}
                                    >
                                        {eventInfo.eventDone ? 'This event has finished' : 'No matches posted yet'}
                                    </Text>
                                ) : (
                                    <Box>
                                        <Grid
                                            margin={'0 auto'}
                                            border={'1px solid black'}
                                            borderBottom={'none'}
                                            borderRadius={'10px 10px 0px 0px'}
                                            backgroundColor={'gray.300'}
                                            templateColumns={'1fr 0.75fr 1fr'}
                                        >
                                            <GridItem
                                                padding={'7px 0px'}
                                                textAlign={'center'}
                                                borderRight={'1px solid black'}
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                            >
                                                Match
                                            </GridItem>
                                            <GridItem
                                                textAlign={'center'}
                                                borderRight={'1px solid black'}
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                            >
                                                TT
                                            </GridItem>
                                            <GridItem
                                                textAlign={'center'}
                                                display={'flex'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                            >
                                                Alliance
                                            </GridItem>
                                        </Grid>
                                        <Box
                                            borderRadius={'0px 0px 10px 10px'}
                                            border={'1px solid black'}
                                            borderTop={'none'}
                                        >
                                            {eventInfo.matchTable.map((match, index) => (
                                                <Grid
                                                    borderTop={index === 0 ? '1px solid black' : '1px solid black'}
                                                    backgroundColor={index % 2 === 0 ? 'gray.100' : 'white'}
                                                    borderRadius={
                                                        eventInfo.matchTable.length - 1 === index && '0px 0px 10px 10px'
                                                    }
                                                    key={match.matchNumber}
                                                    templateColumns={'1fr 0.75fr 1fr'}
                                                >
                                                    <GridItem
                                                        padding={'7px 0px'}
                                                        textAlign={'center'}
                                                        borderRight={'1px solid black'}
                                                        display={'flex'}
                                                        justifyContent={'center'}
                                                        alignItems={'center'}
                                                    >
                                                        {convertMatchKeyToString(match.matchNumber)}
                                                    </GridItem>
                                                    <GridItem textAlign={'center'} borderRight={'1px solid black'}>
                                                        <Tooltip
                                                            isDisabled={!match.predictedTime}
                                                            label={
                                                                !match.scheduledTime
                                                                    ? 'No time scheduled' //this will likely never occur because our tooltip is only enabled if theres a predicted time which means there should also be a scheduled time
                                                                    : `Scheduled at ${
                                                                          weekday[
                                                                              new Date(
                                                                                  match.scheduledTime * 1000
                                                                              ).getDay()
                                                                          ]
                                                                      } ${new Date(
                                                                          match.scheduledTime * 1000
                                                                      ).toLocaleString('en-US', {
                                                                          hour: 'numeric',
                                                                          minute: 'numeric',
                                                                          hour12: true,
                                                                          timeZone: timeZone
                                                                      })}`
                                                            }
                                                        >
                                                            {index === 0 ? (
                                                                <Text
                                                                    fontStyle={
                                                                        match.predictedTime ? 'italic' : 'normal'
                                                                    }
                                                                    pos={'relative'}
                                                                    top={'50%'}
                                                                    transform={'translateY(-50%)'}
                                                                >
                                                                    {match.predictedTime
                                                                        ? `${
                                                                              weekday[
                                                                                  new Date(
                                                                                      match.predictedTime * 1000
                                                                                  ).getDay()
                                                                              ]
                                                                          } ${new Date(
                                                                              match.predictedTime * 1000
                                                                          ).toLocaleString('en-US', {
                                                                              hour: 'numeric',
                                                                              minute: 'numeric',
                                                                              hour12: true,
                                                                              timeZone: timeZone
                                                                          })}*`
                                                                        : match.scheduledTime
                                                                        ? `${
                                                                              weekday[
                                                                                  new Date(
                                                                                      match.scheduledTime * 1000
                                                                                  ).getDay()
                                                                              ]
                                                                          } ${new Date(
                                                                              match.scheduledTime * 1000
                                                                          ).toLocaleString('en-US', {
                                                                              hour: 'numeric',
                                                                              minute: 'numeric',
                                                                              hour12: true,
                                                                              timeZone: timeZone
                                                                          })}`
                                                                        : '?'}
                                                                </Text>
                                                            ) : (
                                                                <Text
                                                                    fontStyle={
                                                                        match.predictedTime ? 'italic' : 'normal'
                                                                    }
                                                                    pos={'relative'}
                                                                    top={'50%'}
                                                                    transform={'translateY(-50%)'}
                                                                >
                                                                    {match.predictedTime
                                                                        ? `${roundToWhole(
                                                                              (match.predictedTime -
                                                                                  (eventInfo.matchTable[index - 1]
                                                                                      .predictedTime ||
                                                                                      eventInfo.matchTable[index - 1]
                                                                                          .scheduledTime ||
                                                                                      0)) /
                                                                                  60
                                                                          )} min*`
                                                                        : match.scheduledTime
                                                                        ? `${roundToWhole(
                                                                              (match.scheduledTime -
                                                                                  (eventInfo.matchTable[index - 1]
                                                                                      .predictedTime ||
                                                                                      eventInfo.matchTable[index - 1]
                                                                                          .scheduledTime ||
                                                                                      0)) /
                                                                                  60
                                                                          )} min`
                                                                        : '?'}
                                                                </Text>
                                                            )}
                                                        </Tooltip>
                                                    </GridItem>
                                                    <GridItem textAlign={'center'}>
                                                        <Flex height={'100%'}>
                                                            {match.alliance.map((team, innerIndex) => (
                                                                <Flex
                                                                    borderRadius={
                                                                        eventInfo.matchTable.length - 1 === index &&
                                                                        innerIndex === 2 &&
                                                                        '0px 0px 10px 0px'
                                                                    }
                                                                    height={'100%'}
                                                                    justifyContent={'center'}
                                                                    alignItems={'center'}
                                                                    borderRight={innerIndex !== 2 && '1px solid black'}
                                                                    width={`${100.0 / 3.0}%`}
                                                                    key={team}
                                                                    textDecoration={
                                                                        team === `frc${teamNumber}`
                                                                            ? 'underline'
                                                                            : 'none'
                                                                    }
                                                                    textDecorationThickness={'2px'}
                                                                    fontWeight={'normal'}
                                                                    backgroundColor={
                                                                        getIssueOfTeam(team.substring(3))?.status ===
                                                                        rtessIssuesStatus.unresolved
                                                                            ? 'red.300'
                                                                            : getIssueOfTeam(team.substring(3))
                                                                                  ?.status ===
                                                                              rtessIssuesStatus.beingResolved
                                                                            ? 'yellow.300'
                                                                            : ''
                                                                    }
                                                                    _hover={{
                                                                        backgroundColor:
                                                                            getIssueOfTeam(team.substring(3))
                                                                                ?.status ===
                                                                            rtessIssuesStatus.unresolved
                                                                                ? 'red.400'
                                                                                : getIssueOfTeam(team.substring(3))
                                                                                      ?.status ===
                                                                                  rtessIssuesStatus.beingResolved
                                                                                ? 'yellow.400'
                                                                                : 'gray.200'
                                                                    }}
                                                                    _active={{
                                                                        backgroundColor:
                                                                            getIssueOfTeam(team.substring(3))
                                                                                ?.status ===
                                                                            rtessIssuesStatus.unresolved
                                                                                ? 'red.400'
                                                                                : getIssueOfTeam(team.substring(3))
                                                                                      ?.status ===
                                                                                  rtessIssuesStatus.beingResolved
                                                                                ? 'yellow.400'
                                                                                : 'gray.300'
                                                                    }}
                                                                >
                                                                    {team.substring(3)}
                                                                </Flex>
                                                            ))}
                                                        </Flex>
                                                    </GridItem>
                                                </Grid>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                );
            case 'event':
                return (
                    <Box>
                        <IconButton
                            position={'absolute'}
                            right={'10px'}
                            top={'155px'}
                            onClick={() => setRTESSIssueFilter((prevFilter) => prevFilter.next)}
                            icon={getIcon(rtessIssueFilter.elem.key)}
                            colorScheme={getColor(rtessIssueFilter.elem.key)}
                            variant={rtessIssueFilter.elem.key !== 'None' ? 'solid' : 'outline'}
                            size='sm'
                        />
                        <IconButton
                            position={'absolute'}
                            right={'10px'}
                            top={'195px'}
                            onClick={() => downloadRTESSLogs()}
                            icon={<MdDownload />}
                            variant={'solid'}
                            size='xs'
                        />
                        <IconButton
                            position={'absolute'}
                            left={'10px'}
                            top={'155px'}
                            onClick={() => setRTESSIssueDialog({ open: true, issue: null })}
                            icon={<AiOutlinePlus />}
                            variant={'solid'}
                            size={'sm'}
                            color={'black'}
                        />
                        <Modal
                            closeOnEsc={true}
                            isOpen={rtessIssueDialog.open}
                            onClose={() => {
                                setRTESSIssueDialog({ open: false, issue: null });
                                setRTESSIssueData({
                                    teamNumber: '',
                                    issue: '',
                                    focusedIssue: '',
                                    problemComment: '',
                                    solutionComment: ''
                                });
                                setRTESSIssuePopoverError(null);
                                setFetchingConfirmation(false);
                                setSubmitAttempted(false);
                                setSubmitting(false);
                            }}
                        >
                            <ModalOverlay>
                                <ModalContent
                                    width={{ base: '75%', md: '40%', lg: '30%' }}
                                    marginTop={'10dvh'}
                                    marginBottom={'10dvh'}
                                    maxHeight={'80dvh'}
                                >
                                    <ModalHeader fontSize={'lg'} fontWeight={'semibold'} paddingBottom={'5px'}>
                                        {rtessIssueDialog.issue === null
                                            ? 'Select One'
                                            : rtessIssueDialog.issue
                                            ? 'Report Issue'
                                            : 'RTESS Report'}
                                    </ModalHeader>
                                    <ModalBody overflowY={'auto'}>
                                        <HStack
                                            marginBottom={rtessIssueDialog.issue === null ? '0px' : '20px'}
                                            marginLeft={'5px'}
                                            spacing={'15px'}
                                        >
                                            <Button
                                                outline={
                                                    rtessIssueDialog.issue === null && submitAttempted
                                                        ? '2px solid red'
                                                        : 'none'
                                                }
                                                colorScheme={rtessIssueDialog.issue === true ? 'green' : 'gray'}
                                                onClick={() => {
                                                    setRTESSIssueDialog({ ...rtessIssueDialog, issue: true });
                                                }}
                                            >
                                                Issue
                                            </Button>
                                            <Button
                                                outline={
                                                    rtessIssueDialog.issue === null && submitAttempted
                                                        ? '2px solid red'
                                                        : 'none'
                                                }
                                                colorScheme={rtessIssueDialog.issue === false ? 'green' : 'gray'}
                                                onClick={() =>
                                                    setRTESSIssueDialog({ ...rtessIssueDialog, issue: false })
                                                }
                                            >
                                                Report
                                            </Button>
                                        </HStack>
                                        {rtessIssueDialog.issue !== null && (
                                            <Box>
                                                <Input
                                                    type={'number'}
                                                    borderColor='gray.300'
                                                    value={rtessIssueData.teamNumber}
                                                    onChange={(e) =>
                                                        setRTESSIssueData({
                                                            ...rtessIssueData,
                                                            teamNumber: e.target.value
                                                        })
                                                    }
                                                    marginBottom={'20px'}
                                                    placeholder={'Team Number'}
                                                    outline={
                                                        rtessIssueData.teamNumber.trim() === '' && submitAttempted
                                                            ? '2px solid red'
                                                            : 'none'
                                                    }
                                                    marginLeft={'5px'}
                                                />
                                                <Menu>
                                                    <MenuButton
                                                        maxW={'75vw'}
                                                        onClick={() =>
                                                            setRTESSIssueData({ ...rtessIssueData, focusedIssue: '' })
                                                        }
                                                        as={Button}
                                                        rightIcon={<ChevronDownIcon />}
                                                        outline={
                                                            rtessIssueData.issue === '' && submitAttempted
                                                                ? '2px solid red'
                                                                : 'none'
                                                        }
                                                        marginLeft={'5px'}
                                                    >
                                                        <Box
                                                            overflow={'hidden'}
                                                            textOverflow={'ellipsis'}
                                                            lineHeight={'base'}
                                                        >
                                                            {rtessIssueData.issue || 'Select One'}
                                                        </Box>
                                                    </MenuButton>
                                                    <MenuList>
                                                        {issuesArr.map((issue) => (
                                                            <MenuItem
                                                                paddingLeft={'25px'}
                                                                _focus={{ outline: 'none' }}
                                                                onMouseEnter={() =>
                                                                    setRTESSIssueData({
                                                                        ...rtessIssueData,
                                                                        focusedIssue: issue.name
                                                                    })
                                                                }
                                                                backgroundColor={
                                                                    (rtessIssueData.issue === issue.name &&
                                                                        rtessIssueData.focusedIssue === '') ||
                                                                    rtessIssueData.focusedIssue === issue.name
                                                                        ? 'gray.100'
                                                                        : 'none'
                                                                }
                                                                maxW={'75vw'}
                                                                key={issue.key}
                                                                onClick={() => {
                                                                    setRTESSIssueData({
                                                                        ...rtessIssueData,
                                                                        issue: issue.name
                                                                    });
                                                                }}
                                                            >
                                                                {issue.name}
                                                            </MenuItem>
                                                        ))}
                                                    </MenuList>
                                                </Menu>
                                            </Box>
                                        )}
                                        {issuesArr.find((issue) => issue.name === rtessIssueData.issue) && (
                                            <Center marginTop={'20px'}>
                                                <Textarea
                                                    outline={
                                                        rtessIssueData.problemComment.trim() === '' && submitAttempted
                                                            ? '2px solid red'
                                                            : 'none'
                                                    }
                                                    onChange={(event) =>
                                                        setRTESSIssueData({
                                                            ...rtessIssueData,
                                                            problemComment: event.target.value
                                                        })
                                                    }
                                                    value={rtessIssueData.problemComment}
                                                    placeholder={
                                                        rtessIssueDialog.issue
                                                            ? 'What is the issue specifically?'
                                                            : 'What was the issue specifically?'
                                                    }
                                                    w={'85%'}
                                                ></Textarea>
                                            </Center>
                                        )}
                                        {!rtessIssueDialog.issue && rtessIssueData.issue !== '' && (
                                            <Center marginTop={'20px'}>
                                                <Textarea
                                                    outline={
                                                        rtessIssueData.solutionComment.trim() === '' && submitAttempted
                                                            ? '2px solid red'
                                                            : 'none'
                                                    }
                                                    _focus={{
                                                        outline: 'none',
                                                        boxShadow: 'rgba(0, 0, 0, 0.35) 0px 3px 8px'
                                                    }}
                                                    onChange={(event) =>
                                                        setRTESSIssueData({
                                                            ...rtessIssueData,
                                                            solutionComment: event.target.value
                                                        })
                                                    }
                                                    value={rtessIssueData.solutionComment}
                                                    placeholder={
                                                        issuesArr.find((issue) => issue.name === rtessIssueData.issue)
                                                            ? 'How did RTESS help?'
                                                            : 'Name of tool/part'
                                                    }
                                                    w={'85%'}
                                                ></Textarea>
                                            </Center>
                                        )}
                                        {rtessIssuePopoverError && (
                                            <Center color={'red.500'} marginTop={'5px'} textAlign={'center'}>
                                                {rtessIssuePopoverError}
                                            </Center>
                                        )}
                                    </ModalBody>
                                    <ModalFooter paddingTop={rtessIssuePopoverError ? 0 : 'var(--chakra-space-4)'}>
                                        <Button
                                            ref={cancelRef}
                                            onClick={() => {
                                                setRTESSIssueDialog({ open: false, issue: null });
                                                setRTESSIssueData({
                                                    teamNumber: '',
                                                    issue: '',
                                                    focusedIssue: '',
                                                    problemComment: '',
                                                    solutionComment: ''
                                                });
                                                setRTESSIssuePopoverError(null);
                                                setFetchingConfirmation(false);
                                                setSubmitAttempted(false);
                                                setSubmitting(false);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            colorScheme='blue'
                                            ml={3}
                                            isDisabled={
                                                rtessIssueData.teamNumber.trim() === '' ||
                                                rtessIssueData.issue === '' ||
                                                (rtessIssueDialog.issue &&
                                                    rtessIssueData.problemComment.trim() === '') ||
                                                (!rtessIssueDialog.issue &&
                                                    issuesArr.find((issue) => issue.name === rtessIssueData.issue) &&
                                                    (rtessIssueData.problemComment.trim() === '' ||
                                                        rtessIssueData.solutionComment.trim() === '')) ||
                                                fetchingConfirmation ||
                                                submitting
                                            }
                                            onClick={() => handleRTESSIssueConfirm()}
                                            isLoading={fetchingConfirmation || submitting}
                                        >
                                            Submit
                                        </Button>
                                    </ModalFooter>
                                </ModalContent>
                            </ModalOverlay>
                        </Modal>
                        {rtessIssues.length > 0 ? (
                            <Box>
                                <Grid
                                    border={'1px solid black'}
                                    borderBottom={'none'}
                                    borderRadius={'10px 10px 0px 0px'}
                                    backgroundColor={'gray.300'}
                                    templateColumns='1fr 1fr 1fr'
                                >
                                    <GridItem
                                        fontSize={'lg'}
                                        fontWeight={'semibold'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        padding={'10px 0px'}
                                    >
                                        Team #
                                    </GridItem>
                                    <GridItem
                                        fontSize={'lg'}
                                        fontWeight={'semibold'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                    >
                                        Issue(s)
                                    </GridItem>
                                    <GridItem
                                        fontSize={'lg'}
                                        fontWeight={'semibold'}
                                        textAlign={'center'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                    >
                                        Status
                                    </GridItem>
                                </Grid>
                                <RTESSIssuesMemo
                                    noRTESSIssues={rtessIssues.length === 0}
                                    rtessIssues={filteredRTESSIssues}
                                    filter={rtessIssueFilter.elem}
                                    version={rtessIssuesListVersion}
                                ></RTESSIssuesMemo>
                            </Box>
                        ) : (
                            <Box
                                fontSize={'lg'}
                                fontWeight={'semibold'}
                                textAlign={'center'}
                                margin={'0 auto'}
                                width={{ base: '85%', md: '66%', lg: '50%' }}
                            >
                                No RTESS Reports For This Event
                            </Box>
                        )}
                    </Box>
                );
            default:
                return <Box>Page error</Box>;
        }
    }

    if (tab === 'team' && eventInfo.inEvent === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return renderTab(tab);
}

export default RTESSIssuesTabs;
