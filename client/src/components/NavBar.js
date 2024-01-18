import { React, useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import { Button, Icon, HStack, Box, Image, Text, Avatar, Menu, MenuButton, MenuList, MenuItem, Flex, NumberInputField, NumberInput } from '@chakra-ui/react';
import { BsSearch } from 'react-icons/bs';
import logo from '../images/RTLogoNoClaws.png';
import '../stylesheets/navbarstyle.css';
import { config } from '../util/helperConstants';
import { capitalizeFirstLetter } from '../util/helperFunctions';
import { GlobalContext } from '../context/globalState';

let titleMap = [
    { path: '/', title: 'Home' },
    { path: '/pits', title: 'Pits' },
    { path: '/matches', title: 'Matches' },
    { path: '/rtessIssues', title: 'RTESS Issues' },
    { path: '/pitForm', title: 'Pit Form' },
    { path: '/preStandForm', title: 'Pre Stand Form' },
    { path: '/standForm', title: 'Stand Form' },
    { path: '/team', title: 'Team' },
    { path: '/admin', title: 'Admin' },
    { path: '/tableau', title: 'Tableau' }
];

function NavBar() {
    let curLoc = useLocation();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { offline, switchModes } = useContext(GlobalContext);

    const [teamNumber, setTeamNumber] = useState('');

    useEffect(() => {
        const curTitle = titleMap.find((item) => item.path === `/${curLoc.pathname.split('/')[1]}`);
        if (curTitle && curTitle.title) {
            let title = curTitle.title;
            switch (curTitle.title) {
                case 'Pit Form':
                    title += ' • ' + curLoc.pathname.split('/')[3] + ' • ' + curLoc.pathname.split('/')[2];
                    break;
                case 'Match Form':
                    title += ' • ' + curLoc.pathname.split('/')[3] + ' • ' + curLoc.pathname.split('/')[2];
                    break;
                case 'Team':
                    title += ' • ' + curLoc.pathname.split('/')[2];
                    setTeamNumber(curLoc.pathname.split('/')[2]);
                    break;
                case 'RTESS Issues':
                    title += ' • ' + capitalizeFirstLetter(curLoc.pathname.split('/')[2]);
                    break;
                default:
                    break;
            }
            document.title = title;
        }
    }, [curLoc]);

    return (
        <Flex position={'sticky'} zIndex={999} top={0} w={'100%'} className='navbar' minHeight={'75px'} marginBottom={'25px'} backgroundColor={'#212529'}>
            <Link to={'/'}>
                <Box h='75px'>
                    <Image
                        width={{ base: '70px', sm: '80px', md: '80px', lg: '100px' }}
                        minW={{ base: '70px', sm: '80px', md: '80px', lg: '100px' }}
                        src={logo}
                        _hover={{
                            cursor: 'pointer'
                        }}
                        position={'relative'}
                        top='50%'
                        transform='translateY(-50%)'
                        marginLeft={'15px'}
                    />
                </Box>
            </Link>
            <Box className='search' flex={1} h={'75px'}>
                <HStack width={{ base: '75%', sm: '75%', md: '60%', lg: '50%' }} margin={{ base: 'auto', md: '0 0 0 22%' }} pos={'relative'} top='50%' transform={'translateY(-50%)'} spacing={0}>
                    <NumberInput w={'100%'} value={teamNumber} onChange={(value) => setTeamNumber(value)} precision={0}>
                        <NumberInputField
                            padding={'0px 0px 0px 16px'}
                            h='45px'
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    navigate(`/team/${teamNumber}/overview`, { state: Date.now() });
                                    event.target.blur();
                                }
                            }}
                            enterKeyHint='search'
                            placeholder='Search team'
                            fontSize='17px'
                            borderRadius={'5px 0px 0px 5px'}
                            bgColor={'white'}
                            _focus={{ boxShadow: 'none' }}
                        />
                    </NumberInput>
                    <Button
                        h='45px'
                        onClick={() => navigate(`/team/${teamNumber}/overview`, { state: Date.now() })}
                        _hover={{ bgColor: 'white' }}
                        borderRadius='0px 5px 5px 0px'
                        bgColor={'white'}
                        _focus={{ boxShadow: 'none' }}
                    >
                        <Icon as={BsSearch} boxSize='5' />
                    </Button>
                </HStack>
            </Box>
            {user === 'NoUser' ? null : (
                <Menu>
                    <Box h='75px'>
                        <MenuButton marginRight={'15px'} cursor={'pointer'} position={'relative'} top='50%' transform={'translateY(-50%)'} as={Avatar} src={user.iconImage} border='2px solid white' />
                    </Box>
                    <MenuList
                        backgroundColor={'rgba(33, 37, 41, 0.98)'}
                        border={'1px solid rgba(255, 255, 255, 0.5)'}
                        borderTop={'none'}
                        borderRadius={'5px'}
                        padding={0}
                        maxW={{ base: 'calc(50vw)', sm: '3xs', md: '3xs', lg: '300px' }}
                        minW={{ base: 'calc(50vw)', sm: '3xs', md: '3xs', lg: '300px' }}
                    >
                        <Box borderBottom={'1px solid rgba(255, 255, 255, 0.5)'}>
                            <Text marginLeft={'10px'} fontSize={'20px'} fontWeight={'bold'} color={'white'}>
                                {user.displayName}
                            </Text>
                            <Text marginLeft={'10px'} marginBottom={'5px'} fontSize={'20px'} fontWeight={'bold'} color={'white'}>
                                Role: {user.role}
                            </Text>
                        </Box>
                        <Box borderBottom={'1px solid rgba(255, 255, 255, 0.5)'}>
                            <MenuItem
                                backgroundColor={'rgba(33, 37, 41, 0.98)'}
                                as={Link}
                                to={'/pits'}
                                _focus={{ backgroundColor: 'none' }}
                                _hover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', textColor: 'white' }}
                                fontSize={'15px'}
                                marginBottom={'0px'}
                                color={'white'}
                            >
                                Pits
                            </MenuItem>
                            <MenuItem
                                backgroundColor={'rgba(33, 37, 41, 0.98)'}
                                as={Link}
                                to={'/matches'}
                                _focus={{ backgroundColor: 'none' }}
                                _hover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', textColor: 'white' }}
                                fontSize={'15px'}
                                marginBottom={'0px'}
                                color={'white'}
                            >
                                Matches
                            </MenuItem>
                            <MenuItem
                                backgroundColor={'rgba(33, 37, 41, 0.98)'}
                                as={Link}
                                to={'/rtessIssues/team'}
                                _focus={{ backgroundColor: 'none' }}
                                _hover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', textColor: 'white' }}
                                fontSize={'15px'}
                                marginBottom={'0px'}
                                color={'white'}
                            >
                                RTESS
                            </MenuItem>
                            <MenuItem
                                backgroundColor={'rgba(33, 37, 41, 0.98)'}
                                as={Link}
                                to={'/pickList'}
                                _focus={{ backgroundColor: 'none' }}
                                _hover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', textColor: 'white' }}
                                fontSize={'15px'}
                                marginBottom={'0px'}
                                color={'white'}
                            >
                                Pick List
                            </MenuItem>
                            <MenuItem
                                backgroundColor={'rgba(33, 37, 41, 0.98)'}
                                as={Link}
                                to={'/pitMap'}
                                _focus={{ backgroundColor: 'none' }}
                                _hover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', textColor: 'white' }}
                                fontSize={'15px'}
                                marginBottom={'0px'}
                                color={'white'}
                            >
                                Pit Map
                            </MenuItem>
                            <MenuItem
                                backgroundColor={'rgba(33, 37, 41, 0.98)'}
                                as={Link}
                                to={'/admin'}
                                _focus={{ backgroundColor: 'none' }}
                                _hover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', textColor: 'white' }}
                                fontSize={'15px'}
                                marginBottom={'0px'}
                                color={'white'}
                            >
                                Admin
                            </MenuItem>
                            <MenuItem
                                backgroundColor={'rgba(33, 37, 41, 0.98)'}
                                as={Link}
                                to={'/tableau'}
                                _focus={{ backgroundColor: 'none' }}
                                _hover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', textColor: 'white' }}
                                fontSize={'15px'}
                                marginBottom={'0px'}
                                color={'white'}
                            >
                                Tableau
                            </MenuItem>
                        </Box>
                        <a href={`${config.API_URL}/auth/logout`}>
                            <MenuItem
                                backgroundColor={'rgba(33, 37, 41, 0.98)'}
                                _focus={{ backgroundColor: 'none' }}
                                _hover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                                fontSize={'15px'}
                                marginBottom={'0px'}
                                color={'white'}
                            >
                                Log Out
                            </MenuItem>
                        </a>
                        <MenuItem
                            backgroundColor={'rgba(33, 37, 41, 0.98)'}
                            _focus={{ backgroundColor: 'none' }}
                            _hover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', textColor: 'white' }}
                            fontSize={'15px'}
                            marginBottom={'0px'}
                            color={'white'}
                            onClick={() => switchModes()}
                        >
                            {offline ? 'Go Online' : 'Go Offline'}
                        </MenuItem>
                    </MenuList>
                </Menu>
            )}
        </Flex>
    );
}

export default NavBar;
