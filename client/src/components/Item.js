import { DragHandleIcon } from '@chakra-ui/icons';
import { Box, Center, Flex, Grid, GridItem, Tag, TagLeftIcon, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { BsCone } from 'react-icons/bs';
import { IoCube } from 'react-icons/io5';
import { Link } from 'react-router-dom';

const Item = ({ id, dragOverlay, listeners, picked, admin, teamData, dataMedian, index, dnp, isDesktop, editable }) => {
    return !dnp ? (
        <Box borderTop={!dragOverlay && '1px solid black'}>
            <Grid
                margin={'0 auto'}
                border={dragOverlay ? '1px solid black' : 'none'}
                paddingRight={'10px'}
                backgroundColor={dragOverlay ? 'gray.300' : index % 2 === 0 ? '#d7d7d761' : 'white'}
                templateColumns={`1fr 0.5fr 0.5fr${isDesktop ? ' 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr' : ''}`}
                gap={'5px'}
                cursor={'default'}
                borderRadius={dragOverlay ? '0px' : index % 2 === 0 ? 'none' : '0px 0px 10px 10px'}
                opacity={picked && 0.45}
            >
                <GridItem padding={'25px 0px 25px 0px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'} textAlign={'center'} userSelect={'none'}>
                    <Flex justifyContent={'center'} alignItems={'center'} position={'relative'}>
                        {admin && editable && (
                            <DragHandleIcon
                                {...listeners}
                                position={'absolute'}
                                left={'5px'}
                                cursor={dragOverlay ? 'grabbing' : 'grab'}
                                _hover={{ backgroundColor: 'gray.300' }}
                                _focus={{ backgroundColor: 'gray.300' }}
                                padding={'3px'}
                                borderRadius={'5px'}
                                boxSizing={'content-box'}
                            />
                        )}
                        <Box>
                            <Text
                                as={Link}
                                to={`/team/${id}/overview`}
                                _hover={{ backgroundColor: 'gray.300' }}
                                _active={{ backgroundColor: 'gray.400' }}
                                padding={'8px'}
                                borderRadius={'10px'}
                                fontSize={'15px'}
                                textDecoration={picked ? '2px red solid line-through' : 'none'}
                            >
                                {id}
                            </Text>
                        </Box>
                    </Flex>
                </GridItem>
                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} userSelect={'none'}>
                    <Text fontSize={'15px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                        {teamData[`${dataMedian}AutoContribution`]}
                    </Text>
                </GridItem>
                <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} userSelect={'none'}>
                    <Text fontSize={'15px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                        {teamData[`${dataMedian}TeleContribution`]}
                    </Text>
                </GridItem>
                {isDesktop && (
                    <React.Fragment>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} userSelect={'none'}>
                            <VStack margin={'0px 0px 0px 0px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'yellow.300'} minWidth={'77.19px'}>
                                    <BsCone />
                                    &nbsp;
                                    {teamData[`${dataMedian}BottomAutoConeScored`]} {teamData[`${dataMedian}BottomAutoConeScored`] === 'N/A' ? '(-)' : `(${teamData[`bottomAutoConeAccuracy`]})`}
                                </Tag>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'purple.300'} minWidth={'77.19px'}>
                                    <IoCube />
                                    &nbsp;
                                    {teamData[`${dataMedian}BottomAutoCubeScored`]} {teamData[`${dataMedian}BottomAutoCubeScored`] === 'N/A' ? '(-)' : `(${teamData[`bottomAutoCubeAccuracy`]})`}
                                </Tag>
                            </VStack>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} userSelect={'none'}>
                            <VStack margin={'0px 0px 0px 0px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'yellow.300'} minWidth={'77.19px'}>
                                    <BsCone />
                                    &nbsp;
                                    {teamData[`${dataMedian}MiddleAutoConeScored`]} {teamData[`${dataMedian}MiddleAutoConeScored`] === 'N/A' ? '(-)' : `(${teamData[`middleAutoConeAccuracy`]})`}
                                </Tag>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'purple.300'} minWidth={'77.19px'}>
                                    <IoCube />
                                    &nbsp;
                                    {teamData[`${dataMedian}MiddleAutoCubeScored`]} {teamData[`${dataMedian}MiddleAutoCubeScored`] === 'N/A' ? '(-)' : `(${teamData[`middleAutoCubeAccuracy`]})`}
                                </Tag>
                            </VStack>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} userSelect={'none'}>
                            <VStack margin={'0px 0px 0px 0px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'yellow.300'} minWidth={'77.19px'}>
                                    <BsCone />
                                    &nbsp;
                                    {teamData[`${dataMedian}TopAutoConeScored`]} {teamData[`${dataMedian}TopAutoConeScored`] === 'N/A' ? '(-)' : `(${teamData[`topAutoConeAccuracy`]})`}
                                </Tag>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'purple.300'} minWidth={'77.19px'}>
                                    <IoCube />
                                    &nbsp;
                                    {teamData[`${dataMedian}TopAutoCubeScored`]} {teamData[`${dataMedian}TopAutoCubeScored`] === 'N/A' ? '(-)' : `(${teamData[`topAutoCubeAccuracy`]})`}
                                </Tag>
                            </VStack>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} userSelect={'none'}>
                            <VStack margin={'0px 0px 0px 0px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'blue.300'} minWidth={'90.47'}>
                                    <Text margin={'0 auto'}>Dock: {teamData['chargeDockAuto']}</Text>
                                </Tag>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'green.300'} minWidth={'90.47'}>
                                    <Text margin={'0 auto'}>Engage: {teamData['chargeEngageAuto']}</Text>
                                </Tag>
                            </VStack>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} userSelect={'none'}>
                            <VStack margin={'0px 0px 0px 0px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'yellow.300'} minWidth={'77.19px'}>
                                    <BsCone />
                                    &nbsp;
                                    {teamData[`${dataMedian}BottomTeleConeScored`]} {teamData[`${dataMedian}BottomTeleConeScored`] === 'N/A' ? '(-)' : `(${teamData[`bottomTeleConeAccuracy`]})`}
                                </Tag>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'purple.300'} minWidth={'77.19px'}>
                                    <IoCube />
                                    &nbsp;
                                    {teamData[`${dataMedian}BottomTeleCubeScored`]} {teamData[`${dataMedian}BottomTeleCubeScored`] === 'N/A' ? '(-)' : `(${teamData[`bottomTeleCubeAccuracy`]})`}
                                </Tag>
                            </VStack>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} userSelect={'none'}>
                            <VStack margin={'0px 0px 0px 0px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'yellow.300'} minWidth={'77.19px'}>
                                    <BsCone />
                                    &nbsp;
                                    {teamData[`${dataMedian}MiddleTeleConeScored`]} {teamData[`${dataMedian}MiddleTeleConeScored`] === 'N/A' ? '(-)' : `(${teamData[`middleTeleConeAccuracy`]})`}
                                </Tag>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'purple.300'} minWidth={'77.19px'}>
                                    <IoCube />
                                    &nbsp;
                                    {teamData[`${dataMedian}MiddleTeleCubeScored`]} {teamData[`${dataMedian}MiddleTeleCubeScored`] === 'N/A' ? '(-)' : `(${teamData[`middleTeleCubeAccuracy`]})`}
                                </Tag>
                            </VStack>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} userSelect={'none'}>
                            <VStack margin={'0px 0px 0px 0px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'yellow.300'} minWidth={'77.19px'}>
                                    <BsCone />
                                    &nbsp;
                                    {teamData[`${dataMedian}TopTeleConeScored`]} {teamData[`${dataMedian}TopTeleConeScored`] === 'N/A' ? '(-)' : `(${teamData[`topTeleConeAccuracy`]})`}
                                </Tag>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'purple.300'} minWidth={'77.19px'}>
                                    <IoCube />
                                    &nbsp;
                                    {teamData[`${dataMedian}TopTeleCubeScored`]} {teamData[`${dataMedian}TopTeleCubeScored`] === 'N/A' ? '(-)' : `(${teamData[`topTeleCubeAccuracy`]})`}
                                </Tag>
                            </VStack>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} userSelect={'none'}>
                            <VStack margin={'0px 0px 0px 0px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'blue.300'} minWidth={'90.47'}>
                                    <Text margin={'0 auto'}>Dock: {teamData['chargeDockTele']}</Text>
                                </Tag>
                                <Tag fontSize={'13px'} color={'black'} backgroundColor={'green.300'} minWidth={'90.47'}>
                                    <Text margin={'0 auto'}>Engage: {teamData['chargeEngageTele']}</Text>
                                </Tag>
                            </VStack>
                        </GridItem>
                        <GridItem padding={'0px 0px 0px 0px'} textAlign={'center'} userSelect={'none'}>
                            <Text fontSize={'15px'} pos={'relative'} top={'50%'} transform={'translateY(-50%)'}>
                                {teamData[`${dataMedian}DefenseRating`]}
                            </Text>
                        </GridItem>
                    </React.Fragment>
                )}
            </Grid>
        </Box>
    ) : (
        <Center marginBottom={'10px'}>
            <Box width={'100px'} cursor={'default'} userSelect={'none'}>
                {admin && editable ? (
                    <Tag width={'100%'} position={'relative'} size={'lg'} variant={'outline'} colorScheme={'yellow'}>
                        <Box
                            as={Link}
                            to={`/team/${id}/overview`}
                            _hover={{ backgroundColor: 'yellow.300' }}
                            _active={{ backgroundColor: 'yellow.400' }}
                            borderRadius={'10px'}
                            padding={'2px 6px 2px 6px'}
                            margin={'0 auto'}
                            textAlign={'center'}
                            textDecoration={picked ? '2px red solid line-through' : 'none'}
                        >
                            {id}
                        </Box>
                        <TagLeftIcon
                            position={'absolute'}
                            left={'3px'}
                            as={DragHandleIcon}
                            {...listeners}
                            cursor={dragOverlay ? 'grabbing' : 'grab'}
                            _hover={{ backgroundColor: 'yellow.200' }}
                            _focus={{ backgroundColor: 'yellow.200' }}
                            padding={'3px'}
                            borderRadius={'5px'}
                            boxSizing={'content-box'}
                        />
                    </Tag>
                ) : (
                    <Tag width={'100%'} position={'relative'} size={'lg'} variant={'outline'} colorScheme={'yellow'}>
                        <Box width={'100%'} textAlign={'center'}>
                            <Box
                                as={Link}
                                to={`/team/${id}/overview`}
                                _hover={{ backgroundColor: 'yellow.300' }}
                                _active={{ backgroundColor: 'yellow.400' }}
                                borderRadius={'10px'}
                                padding={'2px 6px 2px 6px'}
                                textDecoration={picked ? '2px red solid line-through' : 'none'}
                            >
                                {id}
                            </Box>
                        </Box>
                    </Tag>
                )}
            </Box>
        </Center>
    );
};

function areEqual(prevProps, nextProps) {
    let fieldsToCheck = ['id', 'picked', 'dataMedian', 'dragOverlay', 'dnp', 'isDesktop', 'editable'];
    for (let field of fieldsToCheck) {
        if (prevProps[field] !== nextProps[field]) {
            return false;
        }
    }
    let prevIndex = prevProps.index % 2; //index % 2 determines the background color (i.e every other is a different color)
    let nextIndex = nextProps.index % 2;
    if (prevIndex !== nextIndex) {
        return false;
    }
    return true;
}

export default React.memo(Item, areEqual);
