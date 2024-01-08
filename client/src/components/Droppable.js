import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from './SortableItem';
import { Box, Grid, GridItem, Text } from '@chakra-ui/react';

const Droppable = ({ id, items, label, picked, teamData, admin, dataMedian, dnp, index, isDesktop, editable }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
            <Box marginTop={index > 0 ? '15px' : '0px'}>
                <Text fontSize={'25px'} textDecoration={'underline'} marginBottom={'15px'} fontWeight={'bold'} textAlign={!dnp ? 'left' : 'center'}>
                    {label}
                </Text>
                {!dnp && (
                    <Grid
                        margin={'0 auto'}
                        paddingRight={'10px'}
                        border={'1px solid black'}
                        borderBottom={'none'}
                        backgroundColor={'gray.300'}
                        templateColumns={`1fr 0.5fr 0.5fr${isDesktop ? ' 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr' : ''}`}
                        gap={'5px'}
                        borderRadius={'10px 10px 0px 0px'}
                        minH={'48px'}
                    >
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                            <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                Team #
                            </Text>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                            <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                Auto Points
                            </Text>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                            <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                Tele Points
                            </Text>
                        </GridItem>
                        {isDesktop && (
                            <React.Fragment>
                                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                    <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                        Bottom (Auto)
                                    </Text>
                                </GridItem>
                                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                    <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                        Middle (Auto)
                                    </Text>
                                </GridItem>
                                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                    <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                        Top (Auto)
                                    </Text>
                                </GridItem>
                                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                    <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                        Charge (Auto)
                                    </Text>
                                </GridItem>
                                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                    <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                        Bottom (Tele)
                                    </Text>
                                </GridItem>
                                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                    <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                        Middle (Tele)
                                    </Text>
                                </GridItem>
                                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                    <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                        Top (Tele)
                                    </Text>
                                </GridItem>
                                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                    <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                        Charge (Tele)
                                    </Text>
                                </GridItem>
                                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'}>
                                    <Text fontSize={'16px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                        Defense Rating
                                    </Text>
                                </GridItem>
                            </React.Fragment>
                        )}
                    </Grid>
                )}
                <Box
                    ref={setNodeRef}
                    maxHeight={dnp ? '250px' : 'none'}
                    minHeight={dnp ? '100px' : '40px'}
                    borderRadius={'0px 0px 10px 10px'}
                    border={dnp ? 'none' : '1px solid black'}
                    borderTop={'none'}
                    overflowY={dnp ? 'overlay' : 'unset'}
                >
                    {items.map((item, index) => (
                        <SortableItem
                            key={item}
                            index={index}
                            teamData={!dnp ? teamData[item] : null}
                            picked={picked.includes(item)}
                            id={item}
                            admin={admin}
                            dataMedian={dataMedian}
                            dnp={dnp}
                            isDesktop={isDesktop}
                            editable={editable}
                        />
                    ))}
                </Box>
            </Box>
        </SortableContext>
    );
};

export default Droppable;
