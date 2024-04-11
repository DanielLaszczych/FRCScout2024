import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Center,
    IconButton,
    Image as ChakraImage,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    VStack,
    useDisclosure,
    Flex
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import { config, teamNumber } from '../util/helperConstants';
import { containsSubsequence, fetchAndCache } from '../util/helperFunctions';
import { GrMapLocation } from 'react-icons/gr';
import GoogleButton from '../components/GoogleButton';
import MatchScheduleTable from '../components/MatchScheduleTable';
import PlayoffBracket from '../components/PlayoffBracket';
import MatchAnalystScheduleTable from '../components/MatchAnalystScheduleTable';

const scheduleTypes = {
    mainSchedule: 'Schedule',
    playoffBracket: 'Playoff Bracket',
    matchAnalystSchedule: 'Match Analyst'
};

function HomePage() {
    let navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const { isOpen, onOpen, onClose } = useDisclosure();

    const [error, setError] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [pitFormDialog, setPitFormDialog] = useState(false);
    const [pitTeamNumber, setPitTeamNumber] = useState('');
    const [pitPopoverError, setPitPopoverError] = useState(null);
    const [scheduleType, setScheduleType] = useState(scheduleTypes.mainSchedule);
    const [pitImageVariables, setPitImageVariables] = useState(null);

    useEffect(() => {
        if (user !== 'NoUser') {
            fetchAndCache('/event/getCurrentEvent')
                .then((response) => {
                    if (response.status === 200) {
                        return response.json();
                    } else {
                        throw new Error(response.statusText);
                    }
                })
                .then((data) => {
                    if (!data) {
                        throw new Error('There is no event to scout 😔');
                    } else {
                        setCurrentEvent(data);
                    }
                })
                .catch((error) => {
                    setError(error.message);
                });
        }
    }, [user]);

    const getPitImageVariables = useCallback(() => {
        if (currentEvent?.pitMapImage) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let maxWidth = viewportWidth * 0.9;
            let maxHeight = viewportHeight * 0.9;

            let img = new Image();
            img.src = currentEvent.pitMapImage;

            img.onload = () => {
                let screenAspectRatio = maxWidth / maxHeight;
                let imageAspectRatio = img.naturalWidth / img.naturalHeight;

                let scaledWidth, scaledHeight;
                if (imageAspectRatio > screenAspectRatio) {
                    // Original image has a wider aspect ratio, so add horizontal whitespace
                    scaledWidth = maxWidth;
                    scaledHeight = maxWidth / imageAspectRatio;

                    // Commenting this because we will never white space because we
                    // position inside the image
                    const extraHorizontalSpace = maxHeight - scaledHeight;
                    const whitespaceTop = extraHorizontalSpace / 2;
                    const whitespaceBottom = extraHorizontalSpace / 2;
                    setPitImageVariables({
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        width: scaledWidth,
                        height: scaledHeight,
                        top: whitespaceTop,
                        bottom: whitespaceBottom,
                        left: 0,
                        right: 0
                    });
                } else {
                    // Original image has a taller aspect ratio, so add vertical whitespace
                    scaledHeight = maxHeight;
                    scaledWidth = maxHeight * imageAspectRatio;

                    // Commenting this because we will never white space because we
                    // position inside the image
                    const extraVerticalSpace = maxWidth - scaledWidth;
                    const whitespaceLeft = extraVerticalSpace / 2;
                    const whitespaceRight = extraVerticalSpace / 2;
                    setPitImageVariables({
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        width: scaledWidth,
                        height: scaledHeight,
                        top: 0,
                        bottom: 0,
                        left: whitespaceLeft,
                        right: whitespaceRight
                    });
                }
            };
        }
    }, [currentEvent]);

    useEffect(() => {
        getPitImageVariables();

        window.addEventListener('resize', getPitImageVariables);

        return () => window.removeEventListener('resize', getPitImageVariables);
    }, [getPitImageVariables]);

    function handlePitFormConfirm() {
        if (currentEvent.teams.some((team) => team.number === parseInt(pitTeamNumber))) {
            navigate(`/pitForm/${currentEvent.key}/${pitTeamNumber}`);
        } else {
            setPitPopoverError('This team is not competing at this event');
        }
    }

    if (error) {
        return (
            <Box
                fontSize={'lg'}
                fontWeight={'semibold'}
                textAlign={'center'}
                margin={'0 auto'}
                width={{ base: '85%', md: '66%', lg: '50%' }}
            >
                {error}
            </Box>
        );
    }

    if (currentEvent === null && user !== 'NoUser') {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Center>
            {user === 'NoUser' ? (
                <a style={{ marginTop: '100px' }} href={`${config.API_URL}/auth/google`}>
                    <GoogleButton />
                </a>
            ) : (
                <Box>
                    {currentEvent.pitMapImage && (
                        <React.Fragment>
                            <IconButton
                                position={'absolute'}
                                left={'10px'}
                                top={'95px'}
                                onClick={onOpen}
                                icon={<GrMapLocation />}
                                size='sm'
                            />
                            <Modal
                                isOpen={isOpen}
                                onClose={onClose}
                                allowPinchZoom={true}
                                blockScrollOnMount={false}
                                autoFocus={false}
                            >
                                <ModalOverlay>
                                    <ModalContent
                                        margin={'auto'}
                                        maxWidth={'none'}
                                        backgroundColor={'transparent'}
                                        boxShadow={'none'}
                                        width={'fit-content'}
                                        position={'relative'}
                                    >
                                        <ModalHeader position={'sticky'} top={'5px'}>
                                            <Center>
                                                <Input
                                                    placeholder='Team Number'
                                                    type={'number'}
                                                    borderColor={'gray.300'}
                                                    backgroundColor={'white'}
                                                    width={'50vw'}
                                                    textAlign={'center'}
                                                    value={pitTeamNumber}
                                                    onChange={(e) => setPitTeamNumber(e.target.value)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter') {
                                                            event.target.blur();
                                                        }
                                                    }}
                                                />
                                            </Center>
                                        </ModalHeader>
                                        <ModalBody
                                            onClick={() => {
                                                onClose();
                                                setPitTeamNumber('');
                                            }}
                                            padding={'0px'}
                                            position={'relative'}
                                        >
                                            <ChakraImage
                                                width={'90vw'}
                                                height={'90dvh'}
                                                fit={'contain'}
                                                src={currentEvent.pitMapImage}
                                            />
                                            {pitImageVariables !== null &&
                                                currentEvent.pitImageOCRInfo &&
                                                currentEvent.pitImageOCRInfo
                                                    .filter((ocrInfo) =>
                                                        containsSubsequence(ocrInfo.number, parseInt(pitTeamNumber))
                                                    )
                                                    .map((ocrInfo) => (
                                                        <Box
                                                            key={ocrInfo.number.toString() + ocrInfo.left.toString()}
                                                            position={'absolute'}
                                                            border={'3px solid red'}
                                                            borderRadius={'25px'}
                                                            width={`${
                                                                (ocrInfo.width / pitImageVariables.naturalWidth) *
                                                                    pitImageVariables.width +
                                                                10
                                                            }px`}
                                                            height={`${
                                                                (ocrInfo.height / pitImageVariables.naturalHeight) *
                                                                    pitImageVariables.height +
                                                                10
                                                            }px`}
                                                            left={`${
                                                                (ocrInfo.left / pitImageVariables.naturalWidth) *
                                                                    pitImageVariables.width +
                                                                pitImageVariables.left -
                                                                5
                                                            }px`}
                                                            top={`${
                                                                (ocrInfo.top / pitImageVariables.naturalHeight) *
                                                                    pitImageVariables.height +
                                                                pitImageVariables.top -
                                                                5
                                                            }px`}
                                                        />
                                                    ))}
                                        </ModalBody>
                                    </ModalContent>
                                </ModalOverlay>
                            </Modal>
                        </React.Fragment>
                    )}
                    <Text
                        textAlign={'center'}
                        fontSize={'2xl'}
                        fontWeight={'semibold'}
                        margin={'0 auto'}
                        width={{ base: '75%', md: '75%', lg: '100%' }}
                    >
                        Current Event: {currentEvent.name}
                    </Text>
                    <VStack spacing={'25px'} marginTop={'25px'} marginBottom={'20px'}>
                        <Button minWidth={'120px'} onClick={() => setPitFormDialog(true)}>
                            Pit Scout
                        </Button>
                        <Modal
                            closeOnEsc={true}
                            isOpen={pitFormDialog}
                            onClose={() => {
                                setPitFormDialog(false);
                                setPitTeamNumber('');
                                setPitPopoverError(null);
                            }}
                        >
                            <ModalOverlay
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' && pitTeamNumber.trim() !== '') {
                                        handlePitFormConfirm();
                                    }
                                }}
                            >
                                <ModalContent width={{ base: '75%', md: '40%', lg: '30%' }}>
                                    <ModalHeader fontSize={'lg'} fontWeight={'semibold'}>
                                        Enter a team number
                                    </ModalHeader>
                                    <ModalBody>
                                        <Input
                                            placeholder='Team Number'
                                            type={'number'}
                                            borderColor='gray.300'
                                            value={pitTeamNumber}
                                            onChange={(e) => setPitTeamNumber(e.target.value)}
                                        />
                                        {pitPopoverError && (
                                            <Center color={'red.500'} marginTop={'5px'}>
                                                {pitPopoverError}
                                            </Center>
                                        )}
                                    </ModalBody>
                                    <ModalFooter paddingTop={pitPopoverError ? 0 : 'var(--chakra-space-4)'}>
                                        <Button
                                            onClick={() => {
                                                setPitFormDialog(false);
                                                setPitTeamNumber('');
                                                setPitPopoverError(null);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            colorScheme='blue'
                                            ml={3}
                                            isDisabled={pitTeamNumber.trim() === ''}
                                            onClick={() => handlePitFormConfirm()}
                                        >
                                            Confirm
                                        </Button>
                                    </ModalFooter>
                                </ModalContent>
                            </ModalOverlay>
                        </Modal>
                        <Button minWidth={'120px'} as={Link} to={'/preStandForm'}>
                            Stand Scout
                        </Button>
                        <Button minWidth={'120px'} as={Link} to={'/preSuperForm'}>
                            Super Scout
                        </Button>
                    </VStack>
                    <Text
                        textAlign={'center'}
                        fontSize={'xl'}
                        fontWeight={'semibold'}
                        margin={'0 auto'}
                        width={{ base: '75%', md: '75%', lg: '100%' }}
                    >
                        Schedule Info
                    </Text>
                    <Flex
                        flexWrap={'wrap'}
                        justifyContent={'center'}
                        marginTop={'10px'}
                        columnGap={'15px'}
                        rowGap={'10px'}
                    >
                        {Object.values(scheduleTypes).map((type) => (
                            <Button
                                key={type}
                                minWidth={'144px'}
                                colorScheme={scheduleType === type ? 'green' : 'gray'}
                                onClick={() => setScheduleType(type)}
                            >
                                {type}
                            </Button>
                        ))}
                    </Flex>
                    {scheduleType === scheduleTypes.mainSchedule ? (
                        <MatchScheduleTable
                            teamNumber={teamNumber}
                            event={currentEvent}
                            teamPage={false}
                            initialCollapse={false}
                        />
                    ) : scheduleType === scheduleTypes.playoffBracket ? (
                        <PlayoffBracket event={currentEvent} />
                    ) : scheduleType === scheduleTypes.matchAnalystSchedule ? (
                        <MatchAnalystScheduleTable teamNumber={teamNumber} event={currentEvent} />
                    ) : null}
                </Box>
            )}
        </Center>
    );
}

export default HomePage;
