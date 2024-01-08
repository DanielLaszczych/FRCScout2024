import React, { useCallback, useContext, useEffect, useState } from 'react';
import { closestCenter, DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import Droppable from '../components/Droppable';
import Item from '../components/Item';
import { arrayMove } from '../util/array';
import { Box, Button, Center, Flex, HStack, IconButton, Input, Spinner, Tag, TagRightIcon, Text, useToast } from '@chakra-ui/react';
import { Icon, SmallAddIcon, SmallCloseIcon } from '@chakra-ui/icons';
import { SocketContext } from '../context/socket';
import { AuthContext } from '../context/auth';
import { useMutation } from '@apollo/client';
import { SAVE_PICK_LIST } from '../graphql/mutations';
import { FiSave } from 'react-icons/fi';
import { HiPencilSquare } from 'react-icons/hi2';
import { Link } from 'react-router-dom';

function PickList() {
    const socket = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const toast = useToast();

    const [error, setError] = useState(null);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1380);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 650);
    const [currentEvent, setCurrentEvent] = useState({ name: '', key: '' });
    const [teams, setTeams] = useState(null);
    const [itemGroups, setItemGroups] = useState(null);
    const [itemLabels] = useState({
        firstPick: 'First Pick',
        secondPick: 'Second Pick',
        thirdPick: 'Third Pick',
        doNotPick: 'DNP',
    });
    const [picked, setPicked] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [pickedText, setPickedText] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [saving, setSaving] = useState(false);
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));
    const [dataMedian, setDataMedian] = useState(true);
    const [editable, setEditable] = useState(false);

    const fetchPickList = useCallback(() => {
        fetch(`/pickList/getPickList`)
            .then((response) => response.json())
            .then((data) => {
                if (data.key) {
                    setTeams(data.teams);
                    setPicked(data.pickList.picked);
                    delete data.pickList['picked'];
                    setItemGroups(data.pickList);
                    setCurrentEvent({ name: data.name, key: data.key });
                    if (teamData === null) {
                        fetchTeamData(data.key);
                    }
                } else {
                    setError('No Current Event');
                }
            })
            .catch((error) => {
                console.log(error);
                setError(error);
            });
    }, [teamData]);

    const fetchTeamData = (eventKey) => {
        fetch(`/matchData/getEventData/${eventKey}`)
            .then((response) => response.json())
            .then((data) => {
                setTeamData(data);
            })
            .catch((error) => {
                console.log(error);
                setError(error);
            });
    };

    useEffect(() => {
        fetchPickList();
    }, [fetchPickList]);

    useEffect(() => {
        socket.on('connect', () => {
            fetchPickList();
        });
        socket.on('pickListUpdate', (socketId) => {
            if (socket.id !== socketId) {
                fetchPickList();
            }
        });
        // clean up
        return () => {
            socket.off('connect');
            socket.off('pickListUpdate');
        };
    }, [socket, fetchPickList]);

    useEffect(() => {
        if (localStorage.getItem('DataMedian')) {
            setDataMedian(localStorage.getItem('DataMedian') === 'true');
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('DataMedian', dataMedian);
    }, [dataMedian]);

    const updateSizes = () => {
        setIsDesktop(window.innerWidth > 1380);
        setIsMobile(window.innerWidth < 650);
    };

    useEffect(() => {
        window.addEventListener('resize', updateSizes);

        return () => window.removeEventListener('resize', updateSizes);
    }, []);

    const [savePickList] = useMutation(SAVE_PICK_LIST, {
        onError(err) {
            console.log(JSON.stringify(err, null, 2));
            toast({
                title: 'Apollo Error',
                description: 'Could not save pick list',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            setSaving(false);
        },
        onCompleted() {
            toast({
                title: 'Pick list saved',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            setSaving(false);
        },
    });

    function handleSavePickList() {
        setSaving(true);
        savePickList({
            variables: {
                key: currentEvent.key,
            },
        });
    }

    const handleDragStart = ({ active }) => setActiveId(active.id);

    const handleDragCancel = () => setActiveId(null);

    const handleDragOver = ({ active, over }) => {
        const overId = over?.id;

        if (!overId) {
            return;
        }

        const activeContainer = active.data.current.sortable.containerId;
        const overContainer = over.data.current?.sortable.containerId || over.id;

        if (activeContainer !== overContainer) {
            setItemGroups((itemGroups) => {
                const activeIndex = active.data.current.sortable.index;
                const overIndex = over.id in itemGroups ? itemGroups[overContainer].length + 1 : over.data.current.sortable.index;

                return moveBetweenContainers(itemGroups, activeContainer, activeIndex, overContainer, overIndex, active.id);
            });
        }
    };

    const handleDragEnd = ({ active, over }) => {
        if (!over) {
            setActiveId(null);
            return;
        }
        const activeContainer = active.data.current.sortable.containerId;
        const overContainer = over.data.current?.sortable.containerId || over.id;
        const activeIndex = active.data.current.sortable.index;
        const overIndex = over.id in itemGroups ? itemGroups[overContainer].length + 1 : over.data.current.sortable.index;

        if (active.id !== over.id) {
            setItemGroups((itemGroups) => {
                let newItems;
                if (activeContainer === overContainer) {
                    newItems = {
                        ...itemGroups,
                        [overContainer]: arrayMove(itemGroups[overContainer], activeIndex, overIndex),
                    };
                } else {
                    newItems = moveBetweenContainers(itemGroups, activeContainer, activeIndex, overContainer, overIndex, active.id);
                }

                return newItems;
            });
        }
        setActiveId(null);
        fetch(`/pickList/moveTeam/${active.id}/${activeContainer}/${overIndex}/${socket.id}`);
    };

    const moveBetweenContainers = (items, activeContainer, activeIndex, overContainer, overIndex, item) => {
        let newItems = { ...items };
        for (let containerParam in newItems) {
            newItems[containerParam] = newItems[containerParam].filter((teamParam) => teamParam !== item);
            if (containerParam === overContainer) {
                newItems[containerParam] = [...newItems[containerParam].slice(0, overIndex), item, ...newItems[containerParam].slice(overIndex)];
            }
        }
        return newItems;
    };

    if (error) {
        return (
            <Box textAlign={'center'} fontSize={'25px'} fontWeight={'medium'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                {error}
            </Box>
        );
    }

    if (currentEvent.key === '' || itemGroups === null || picked === null || teams === null || teamData === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Box marginBottom={'25px'} position={'relative'}>
            {user.admin && (
                <IconButton
                    position={'absolute'}
                    maxWidth={'32px'}
                    left={'10px'}
                    top={'0px'}
                    onClick={() => setEditable(!editable)}
                    icon={<HiPencilSquare />}
                    colorScheme={editable ? 'green' : 'white'}
                    variant={editable ? 'solid' : 'outline'}
                    _focus={{ outline: 'none' }}
                    size='sm'
                />
            )}
            <Flex position={'absolute'} flexWrap={'wrap'} maxWidth={'32px'} right={'10px'} top={'0px'} rowGap={'10px'}>
                {user.admin && <IconButton isDisabled={saving} onClick={() => handleSavePickList()} icon={<FiSave />} _focus={{ outline: 'none' }} size='sm' />}
                <Button maxWidth={'32px'} onClick={() => setDataMedian(!dataMedian)} _focus={{ outline: 'none' }} size='sm'>
                    {dataMedian ? 'M' : 'A'}
                </Button>
            </Flex>
            <Center marginBottom={'25px'}>
                <h2 style={{ fontWeight: '500', fontSize: '20px', lineHeight: '1.1', textAlign: 'center', maxWidth: '75%' }}>Current Event: {currentEvent.name}</h2>
            </Center>
            {isMobile && user.admin && (
                <Center marginBottom={'10px'}>
                    <HStack spacing={0}>
                        <Input
                            onFocus={(e) =>
                                e.target.addEventListener(
                                    'wheel',
                                    function (e) {
                                        e.preventDefault();
                                    },
                                    { passive: false }
                                )
                            }
                            enterKeyHint={'send'}
                            onChange={(event) => setPickedText(event.target.value)}
                            h='45px'
                            placeholder={'Enter team'}
                            type={'number'}
                            value={pickedText}
                            maxWidth={'150px'}
                            borderRadius={'5px 0px 0px 5px'}
                            _focus={{ outline: 'none', boxShadow: 'none', borderColor: 'gray.300' }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    if (teams.includes(pickedText)) {
                                        if (picked.includes(pickedText)) {
                                            setPicked(() => picked.filter((team) => team !== pickedText));
                                        } else {
                                            setPicked([...picked, pickedText]);
                                        }
                                    }
                                    fetch(`/pickList/selectTeam/${pickedText}/${socket.id}`);
                                    setPickedText('');
                                }
                            }}
                        ></Input>
                        <Button
                            h='45px'
                            _hover={{ bgColor: 'gray.200' }}
                            borderRadius='0px 5px 5px 0px'
                            bgColor={'transparent'}
                            border={'1px solid'}
                            borderLeft={'transparent'}
                            borderColor={'gray.200'}
                            _focus={{ boxShadow: 'none' }}
                            onClick={() => {
                                if (teams.includes(pickedText)) {
                                    if (picked.includes(pickedText)) {
                                        setPicked(() => picked.filter((team) => team !== pickedText));
                                    } else {
                                        setPicked([...picked, pickedText]);
                                    }
                                }
                                fetch(`/pickList/selectTeam/${pickedText}/${socket.id}`);
                                setPickedText('');
                            }}
                        >
                            <Icon as={SmallAddIcon} boxSize='5' />
                        </Button>
                    </HStack>
                </Center>
            )}
            <DndContext
                sensors={sensors}
                autoScroll={true}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragCancel={handleDragCancel}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <Box display={isMobile ? 'block' : 'flex'}>
                    <Box width={isDesktop ? '78%' : isMobile ? '80%' : '60%'} margin={isMobile ? '0 auto' : '0px 0px 0px 25px'} display={isMobile ? 'block' : 'inline-block'}>
                        {Object.keys(itemGroups)
                            .slice(0, 3)
                            .map((group, index) => (
                                <Droppable
                                    key={group}
                                    id={group}
                                    label={itemLabels[group]}
                                    picked={picked}
                                    admin={user.admin}
                                    items={itemGroups[group]}
                                    teamData={teamData}
                                    activeId={activeId}
                                    dataMedian={dataMedian ? 'median' : 'average'}
                                    index={index}
                                    isDesktop={isDesktop}
                                    editable={editable}
                                />
                            ))}
                    </Box>
                    <Box
                        pos={isMobile ? 'relative' : 'sticky'}
                        width={isMobile ? '80%' : 'none'}
                        top={isMobile ? '0px' : '100px'}
                        flexGrow={1}
                        height={'100%'}
                        margin={isMobile ? '0 auto' : 'none'}
                        marginTop={isMobile ? '25px' : '25px'}
                    >
                        {user.admin && !isMobile && (
                            <Center marginBottom={'10px'}>
                                <HStack spacing={0}>
                                    <Input
                                        onFocus={(e) =>
                                            e.target.addEventListener(
                                                'wheel',
                                                function (e) {
                                                    e.preventDefault();
                                                },
                                                { passive: false }
                                            )
                                        }
                                        enterKeyHint={'send'}
                                        onChange={(event) => setPickedText(event.target.value)}
                                        h='45px'
                                        placeholder={'Enter team'}
                                        type={'number'}
                                        value={pickedText}
                                        maxWidth={'150px'}
                                        borderRadius={'5px 0px 0px 5px'}
                                        _focus={{ outline: 'none', boxShadow: 'none', borderColor: 'gray.300' }}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                if (teams.includes(pickedText)) {
                                                    if (picked.includes(pickedText)) {
                                                        setPicked(() => picked.filter((team) => team !== pickedText));
                                                    } else {
                                                        setPicked([...picked, pickedText]);
                                                    }
                                                }
                                                fetch(`/pickList/selectTeam/${pickedText}/${socket.id}`);
                                                setPickedText('');
                                            }
                                        }}
                                    ></Input>
                                    <Button
                                        h='45px'
                                        _hover={{ bgColor: 'gray.200' }}
                                        borderRadius='0px 5px 5px 0px'
                                        bgColor={'transparent'}
                                        border={'1px solid'}
                                        borderLeft={'transparent'}
                                        borderColor={'gray.200'}
                                        _focus={{ boxShadow: 'none' }}
                                        onClick={() => {
                                            if (teams.includes(pickedText)) {
                                                if (picked.includes(pickedText)) {
                                                    setPicked(() => picked.filter((team) => team !== pickedText));
                                                } else {
                                                    setPicked([...picked, pickedText]);
                                                }
                                            }
                                            fetch(`/pickList/selectTeam/${pickedText}/${socket.id}`);
                                            setPickedText('');
                                        }}
                                    >
                                        <Icon as={SmallAddIcon} boxSize='5' />
                                    </Button>
                                </HStack>
                            </Center>
                        )}
                        <Box margin={'40px 25px 0px 25px'} paddingBottom={'15px'} paddingTop={'10px'} maxHeight={'650px'} borderRadius={'10px'} boxShadow={'rgba(0, 0, 0, 0.98) 0px 0px 7px 1px'}>
                            {Object.keys(itemGroups)
                                .slice(3)
                                .map((group) => (
                                    <Droppable
                                        id={group}
                                        label={itemLabels[group]}
                                        picked={picked}
                                        dnp={true}
                                        admin={user.admin}
                                        items={itemGroups[group]}
                                        activeId={activeId}
                                        key={group}
                                        dataMedian={null}
                                        editable={editable}
                                    />
                                ))}
                            <Text fontSize={'25px'} textDecoration={'underline'} marginTop={'10px'} marginBottom={'15px'} fontWeight={'bold'} textAlign={'center'}>
                                Picked
                            </Text>
                            <Box overflowY={'overlay'} minHeight={'125px'} maxHeight={'250px'}>
                                {picked.map((item) => (
                                    <Center key={item} marginBottom={'10px'}>
                                        <Box width={'100px'} userSelect={'none'} cursor={'default'}>
                                            {user.admin && editable ? (
                                                <Tag width={'100%'} position={'relative'} size={'lg'} variant={'outline'} colorScheme={'red'}>
                                                    <Box
                                                        as={Link}
                                                        to={`/team/${item}/overview`}
                                                        _hover={{ backgroundColor: 'red.300' }}
                                                        _active={{ backgroundColor: 'red.400' }}
                                                        borderRadius={'10px'}
                                                        padding={'2px 6px 2px 6px'}
                                                        position={'absolute'}
                                                        left={'25%'}
                                                    >
                                                        {item}
                                                    </Box>
                                                    <TagRightIcon
                                                        position={'absolute'}
                                                        right={'5px'}
                                                        as={SmallCloseIcon}
                                                        onClick={() => {
                                                            setPicked(picked.filter((e) => e !== item));
                                                            fetch(`/pickList/selectTeam/${item}/${socket.id}`);
                                                        }}
                                                        _hover={{ backgroundColor: 'red.200' }}
                                                        _focus={{ backgroundColor: 'red.200' }}
                                                        padding={'3px'}
                                                        borderRadius={'5px'}
                                                        boxSizing={'content-box'}
                                                    />
                                                </Tag>
                                            ) : (
                                                <Tag width={'100%'} position={'relative'} size={'lg'} variant={'outline'} colorScheme={'red'}>
                                                    <Box width={'100%'} textAlign={'center'}>
                                                        <Box
                                                            as={Link}
                                                            to={`/team/${item}/overview`}
                                                            _hover={{ backgroundColor: 'red.300' }}
                                                            _active={{ backgroundColor: 'red.400' }}
                                                            borderRadius={'10px'}
                                                            padding={'2px 6px 2px 6px'}
                                                            textDecoration={picked ? '2px red solid line-through' : 'none'}
                                                        >
                                                            {item}
                                                        </Box>
                                                    </Box>
                                                </Tag>
                                            )}
                                        </Box>
                                    </Center>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <DragOverlay>
                    {activeId ? (
                        <Item
                            picked={picked.includes(activeId)}
                            listeners={null}
                            id={activeId}
                            dragOverlay
                            admin={user.admin}
                            teamData={teamData[activeId]}
                            dataMedian={dataMedian ? 'median' : 'average'}
                            dnp={itemGroups['doNotPick'].includes(activeId)}
                            isDesktop={isDesktop}
                            editable={editable}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </Box>
    );
}

export default PickList;
