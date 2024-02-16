import React, { useContext, useEffect, useState } from 'react';
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
    useDisclosure
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import { config, teamNumber } from '../util/helperConstants';
import { fetchAndCache } from '../util/helperFunctions';
import { GrMapLocation } from 'react-icons/gr';
import GoogleButton from '../components/GoogleButton';
import MatchScheduleTable from '../components/MatchScheduleTable';

function HomePage() {
    let navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const { isOpen, onOpen, onClose } = useDisclosure();

    const [error, setError] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [pitFormDialog, setPitFormDialog] = useState(false);
    const [pitTeamNumber, setPitTeamNumber] = useState('');
    const [pitPopoverError, setPitPopoverError] = useState(null);

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
                <Box width={'100vw'}>
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
                                            src={currentEvent.pitMapImage}
                                        />
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
                    <VStack spacing={'25px'} marginTop={'25px'}>
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
                    <MatchScheduleTable
                        teamNumber={teamNumber}
                        currentEvent={currentEvent}
                        teamPage={false}
                        initialCollapse={false}
                    />
                </Box>
            )}
        </Center>
    );
}

export default HomePage;
