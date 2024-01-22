import { Box, Button, Flex, Grid, Spinner, Text } from '@chakra-ui/react';
import React from 'react';
import { TransitionGroup } from 'react-transition-group';
import CSSTransition from './CSSTransition';

function TBAEventsMemo({ eventType, mutatingEventKey, handleAddEvent }) {
    return (
        <Box margin='0 auto' marginBottom={'25px'}>
            <Box marginBottom={'10px'}>
                <Text ref={eventType.ref} fontSize={'3xl'} fontWeight={'semibold'} lineHeight={'1.1'}>
                    {eventType.name} <small style={{ fontSize: '65%', color: '#777', lineHeight: '1' }}>{eventType.count} Events</small>
                </Text>
            </Box>
            <TransitionGroup>
                {eventType.events.map((event, index) => (
                    <CSSTransition key={event.key} timeout={500} classNames='shrink'>
                        <Grid minHeight={'60px'} borderTop={'1px solid black'} backgroundColor={index % 2 === 0 ? '#d7d7d761' : 'white'} templateColumns='2fr 1fr' gap={'15px'}>
                            <Flex justifyContent={'center'} paddingLeft={'5px'} alignItems={'center'}>
                                <Text textAlign={'center'}>{event.name}</Text>
                            </Flex>
                            <Flex justifyContent={'center'} alignItems={'center'}>
                                {mutatingEventKey === event.key ? (
                                    <Box marginTop={'8px'} minW={'110px'}>
                                        <Spinner></Spinner>
                                    </Box>
                                ) : (
                                    <Button
                                        _focus={{ outline: 'none' }}
                                        isDisabled={mutatingEventKey !== null}
                                        onClick={() => handleAddEvent(event.name, event.year, event.week, eventType.name, event.key, event.start_date, event.end_date)}
                                    >
                                        Add
                                    </Button>
                                )}
                            </Flex>
                        </Grid>
                    </CSSTransition>
                ))}
            </TransitionGroup>
        </Box>
    );
}

function areEqual(prevProps, nextProps) {
    return prevProps.version === nextProps.version && prevProps.mutatingEventKey === nextProps.mutatingEventKey;
}

export default React.memo(TBAEventsMemo, areEqual);
