import { React, useContext, useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import {
    Box,
    Button,
    Center,
    HStack,
    IconButton,
    Image,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Spinner,
    useToast
} from '@chakra-ui/react';
import { AuthContext } from '../context/auth';
import { sortEvents, sortRegisteredEvents } from '../util/helperFunctions';
import { FiSave, FiUpload } from 'react-icons/fi';
import { AiOutlineRotateRight } from 'react-icons/ai';
import { GiCancel } from 'react-icons/gi';

function PitMapPage() {
    const { user } = useContext(AuthContext);
    const toast = useToast();

    const [error, setError] = useState(null);
    const [events, setEvents] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [focusedEvent, setFocusedEvent] = useState(null);
    const hiddenImageInput = useRef(null);
    const [tempImage, setTempImage] = useState(null);
    const [imageRotation, setImageRotation] = useState(0);
    const [uploadingPitMap, setUploadingPitMap] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [readyToDisplay, setReadyToDisplay] = useState(false);

    useEffect(() => {
        fetch('/event/getEventsSimple')
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then((data) => {
                let events = data;
                setEvents(sortEvents(events));
                if (events.length === 0) {
                    setError('No events are registered in the database');
                    return;
                }
                let currentEvent = events.find((event) => event.currentEvent);
                if (currentEvent) {
                    setCurrentEvent({
                        name: currentEvent.name,
                        key: currentEvent.key,
                        pitMap: currentEvent.pitMapImage
                    });
                    setFocusedEvent(currentEvent.name);
                } else {
                    currentEvent = events[events.length - 1];
                    setCurrentEvent({
                        name: currentEvent.name,
                        key: currentEvent.key,
                        pitMap: currentEvent.pitMapImage
                    });
                    setFocusedEvent(currentEvent.name);
                }
            })
            .catch((error) => setError(error.message));
    }, []);

    function updateImage(event) {
        if (event.target.files && event.target.files[0] && event.target.files[0].type.split('/')[0] === 'image') {
            var FR = new FileReader();
            FR.readAsDataURL(event.target.files[0]);
            FR.onload = () => {
                setImageRotation(0);
                setTempImage(FR.result);
            };
        }
    }

    function handleUpdatePitMap() {
        setUploadingPitMap(true);
        fetch('/event/setEventPitMap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', key: currentEvent.key },
            body: JSON.stringify({
                image: tempImage
            })
        })
            .then((response) => {
                if (response.status === 200) {
                    return response.json();
                } else {
                    throw new Error(response.statusText);
                }
            })
            .then((data) => {
                let modifiedEvent = data;
                let modifiedEvents = events.map((event) => {
                    if (event.key === modifiedEvent.key) {
                        return {
                            ...event,
                            pitMapImage: modifiedEvent.pitMapImage
                        };
                    } else {
                        return event;
                    }
                });
                setEvents(modifiedEvents);
                setCurrentEvent({ ...currentEvent, pitMap: modifiedEvent.pitMapImage });
                toast({
                    title: 'Pit map was uploaded',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                setUploadingPitMap(false);
                setTempImage(null);
                setImageRotation(0);
                hiddenImageInput.current.value = '';
            })
            .catch((error) => {
                console.log(error);
                toast({
                    title: 'Error',
                    description: 'Pit map was not able to be uploaded',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
                setUploadingPitMap(false);
                setTempImage(null);
                setImageRotation(0);
                hiddenImageInput.current.value = '';
            });
    }

    useEffect(() => {
        if (localStorage.getItem('PitMapRotation')) {
            setImageRotation(localStorage.getItem('PitMapRotation'));
        }
    }, []);

    useEffect(() => {
        if (imageLoaded) {
            if (document.getElementById('imageContainer')) {
                if (imageRotation % 180 === 0) {
                    document.getElementById('imageContainer').childNodes[0].style.marginTop = 0;
                } else {
                    let imageContainerElement = document.getElementById('imageContainer');
                    let imageElement = imageContainerElement.childNodes[0];
                    let value = imageElement.clientWidth - imageElement.clientHeight;
                    imageElement.style.marginTop = `${value / 2}px`;
                }
                setReadyToDisplay(true);
            }
        }
    }, [imageRotation, imageLoaded]);

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

    if (currentEvent === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box marginBottom={'25px'}>
            <IconButton
                position={'absolute'}
                right={'10px'}
                top={'95px'}
                onClick={() => {
                    let newRotation = (imageRotation + 90) % 360;
                    setImageRotation(newRotation);
                    localStorage.setItem('PitMapRotation', newRotation);
                }}
                icon={<AiOutlineRotateRight />}
                size='sm'
            />
            {user.admin && (
                <HStack
                    flexWrap={'wrap'}
                    maxW={'32px'}
                    rowGap={'10px'}
                    position={'absolute'}
                    left={'10px'}
                    top={'95px'}
                    spacing={'0px'}
                >
                    <input
                        type='file'
                        accept='image/*'
                        style={{ display: 'none' }}
                        ref={hiddenImageInput}
                        onChange={(event) => updateImage(event)}
                    />
                    {!tempImage && (
                        <IconButton
                            isDisabled={uploadingPitMap}
                            onClick={() => hiddenImageInput.current.click()}
                            icon={<FiUpload />}
                            size='sm'
                        />
                    )}
                    {tempImage && (
                        <IconButton
                            isDisabled={uploadingPitMap}
                            onClick={() => {
                                setTempImage(null);
                                setImageRotation(0);
                                hiddenImageInput.current.value = '';
                            }}
                            icon={<GiCancel />}
                            color='red'
                            size='sm'
                        />
                    )}
                    {tempImage && (
                        <IconButton
                            isDisabled={uploadingPitMap}
                            onClick={() => handleUpdatePitMap()}
                            icon={<FiSave />}
                            size='sm'
                            isLoading={uploadingPitMap}
                        />
                    )}
                </HStack>
            )}
            <Box
                margin={'0 auto'}
                marginBottom={'30px'}
                textAlign='center'
                width={{ base: '85%', md: '66%', lg: '50%' }}
            >
                <Menu placement='bottom'>
                    <MenuButton
                        disabled={uploadingPitMap}
                        maxW={'65vw'}
                        onClick={() => setFocusedEvent('')}
                        as={Button}
                        rightIcon={<ChevronDownIcon />}
                    >
                        <Box overflow={'hidden'} textOverflow={'ellipsis'}>
                            {currentEvent.name}
                        </Box>
                    </MenuButton>
                    <MenuList>
                        {sortRegisteredEvents(events).map((eventItem) => (
                            <MenuItem
                                textAlign={'center'}
                                justifyContent={'center'}
                                _focus={{ backgroundColor: 'none' }}
                                onMouseEnter={() => setFocusedEvent(eventItem.name)}
                                backgroundColor={
                                    (currentEvent.name === eventItem.name && focusedEvent === '') ||
                                    focusedEvent === eventItem.name
                                        ? 'gray.100'
                                        : 'none'
                                }
                                maxW={'65vw'}
                                key={eventItem.key}
                                onClick={() => {
                                    if (eventItem.key !== currentEvent.key) {
                                        setCurrentEvent({
                                            name: eventItem.name,
                                            key: eventItem.key,
                                            pitMap: eventItem.pitMapImage
                                        });
                                        setTempImage(null);
                                        setImageRotation(0);
                                        if (hiddenImageInput.current !== null) {
                                            hiddenImageInput.current.value = '';
                                        }
                                    }
                                }}
                            >
                                {eventItem.name}
                            </MenuItem>
                        ))}
                    </MenuList>
                </Menu>
            </Box>
            {currentEvent.pitMap || tempImage ? (
                <Center id='imageContainer' visibility={!readyToDisplay && 'hidden'}>
                    <Image
                        src={tempImage || currentEvent.pitMap}
                        style={{ transform: `rotate(${imageRotation}deg)`, transformOrigin: 'center' }}
                        objectFit={'contain'}
                        maxW={imageRotation % 180 === 0 ? '90vw' : 'calc(90vh - 170px)'}
                        maxH={imageRotation % 180 !== 0 ? '90vw' : 'calc(90vh - 170px)'}
                        onLoad={() => setImageLoaded(true)}
                    ></Image>
                </Center>
            ) : (
                <Box
                    fontSize={'xl'}
                    fontWeight={'semibold'}
                    margin={'0 auto'}
                    textAlign={'center'}
                    width={{ base: '85%', md: '66%', lg: '50%' }}
                >
                    No Pit Map Available
                </Box>
            )}
        </Box>
    );
}

export default PitMapPage;
