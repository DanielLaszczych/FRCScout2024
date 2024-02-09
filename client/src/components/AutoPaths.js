import React, { useCallback, useLayoutEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Box, Center, Flex, IconButton, Spinner, Text } from '@chakra-ui/react';
import AutoBlueField from '../images/AutoBlueField.png';
import { capitalizeFirstLetter, perc2color, roundToTenth } from '../util/helperFunctions';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

let startingPositions = [
    [20, 36, uuidv4()],
    [55, 115, uuidv4()],
    [20, 189, uuidv4()],
    [20, 285, uuidv4()]
];
let notePositions = [
    [125, 36, uuidv4()],
    [125, 115, uuidv4()],
    [125, 189, uuidv4()],
    [413, 9, uuidv4()],
    [413, 99, uuidv4()],
    [413, 189, uuidv4()],
    [413, 279, uuidv4()],
    [413, 369, uuidv4()]
];
let imageWidth = 503;
let imageHeight = 436;

function AutoPaths({ teamNumbers, autoPaths }) {
    const [imagesLoaded, setImagesLoaded] = useState(
        Object.fromEntries(teamNumbers.map((teamNumber) => [teamNumber, false]))
    );
    const [dimensionRatios, setDimensionRatios] = useState(null);
    const [pathsVisible, setPathsVisible] = useState(
        Object.fromEntries(teamNumbers.map((teamNumber) => [teamNumber, 0]))
    );

    const getImageVariables = useCallback(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const breakPointWidth = window.innerWidth;
        // const viewportHeight = window.innerHeight;

        // Calculate image dimensions based on screen size
        const maxWidth =
            breakPointWidth >= 992 ? (viewportWidth * 0.9) / Math.min(teamNumbers.length, 3) : viewportWidth * 0.9; // Adjust the multiplier as needed
        const maxHeight = imageHeight;

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
    }, [teamNumbers.length]);

    useLayoutEffect(() => {
        getImageVariables();
        window.addEventListener('resize', getImageVariables);

        return () => {
            window.removeEventListener('resize', getImageVariables);
        };
    }, [getImageVariables]);

    function getPathPieceValue(pathPiece, index) {
        if (pathPiece.score + pathPiece.miss === 0) {
            return 'Hold';
        } else {
            let label = pathPiece.label.length > 5 ? `${pathPiece.label.slice(0, 4)}.` : pathPiece.label;
            return `(${index}) ${pathPiece.score}/${pathPiece.score + pathPiece.miss}\n${capitalizeFirstLetter(label)}`;
        }
    }

    function convertPathToArray(path) {
        return Object.keys(path)
            .map((key) => {
                if (path[key].piece === '0') {
                    return null;
                }
                return { ...path[key], piece: parseInt(path[key].piece) };
            })
            .filter((piece) => piece !== null);
    }

    if (dimensionRatios === null) {
        return (
            <Center>
                <Spinner></Spinner>
            </Center>
        );
    }

    return (
        <Flex
            margin={'0 auto'}
            width={'100%'}
            flexWrap={'wrap'}
            columnGap={'50px'}
            rowGap={'20px'}
            justifyContent={'center'}
        >
            {teamNumbers.map((teamNumber) => (
                <Flex
                    key={teamNumber}
                    justifyContent={'center'}
                    width={{ base: '90%', lg: `calc(90% / ${Math.min(teamNumbers.length, 3)})` }}
                >
                    {autoPaths[teamNumber] && autoPaths[teamNumber].length > 0 ? (
                        <Box>
                            <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                {teamNumber}
                            </Text>
                            <Text fontSize={'md'} fontWeight={'semibold'} textAlign={'start'}>
                                Ran {autoPaths[teamNumber][pathsVisible[teamNumber]].runs} time(s)
                            </Text>
                            <Flex>
                                <Text flex={1 / 2} fontSize={'md'} fontWeight={'semibold'} textAlign={'start'}>
                                    Left Start: {autoPaths[teamNumber][pathsVisible[teamNumber]].leftStart} /{' '}
                                    {autoPaths[teamNumber][pathsVisible[teamNumber]].runs}
                                </Text>
                                <Text flex={1 / 2} fontSize={'md'} fontWeight={'semibold'} textAlign={'end'}>
                                    {roundToTenth(
                                        autoPaths[teamNumber][pathsVisible[teamNumber]].totalPoints /
                                            autoPaths[teamNumber][pathsVisible[teamNumber]].runs
                                    )}
                                    : Avg Points
                                </Text>
                            </Flex>
                            <Center
                                margin={'0 auto'}
                                marginBottom={'10px'}
                                width={`${imageWidth * dimensionRatios.width}px`}
                                height={`${imageHeight * dimensionRatios.height}px`}
                                position={'relative'}
                            >
                                <Spinner
                                    position={'absolute'}
                                    visibility={!imagesLoaded[teamNumber] ? 'visible' : 'hidden'}
                                />
                                <img
                                    src={AutoBlueField}
                                    alt={'Field Map'}
                                    style={{ visibility: imagesLoaded[teamNumber] ? 'visible' : 'hidden' }}
                                    onLoad={() =>
                                        setImagesLoaded((prevValue) => ({ ...prevValue, [teamNumber]: true }))
                                    }
                                />
                                {autoPaths[teamNumber]
                                    .slice(pathsVisible[teamNumber], pathsVisible[teamNumber] + 1)
                                    .map((autoPath, index) => (
                                        <React.Fragment key={index}>
                                            <Flex
                                                position={'absolute'}
                                                visibility={imagesLoaded[teamNumber] ? 'visible' : 'hidden'}
                                                left={`${
                                                    startingPositions[autoPath.startingPosition - 1][0] *
                                                    dimensionRatios.width
                                                }px`}
                                                top={`${
                                                    startingPositions[autoPath.startingPosition - 1][1] *
                                                    dimensionRatios.height
                                                }px`}
                                                width={`${55 * dimensionRatios.width}px`}
                                                height={`${55 * dimensionRatios.height}px`}
                                                backgroundColor={
                                                    Object.keys(autoPath.path).length > 0
                                                        ? perc2color(0)
                                                        : perc2color(1)
                                                }
                                                textColor={'black'}
                                                fontWeight={'bold'}
                                                textAlign={'center'}
                                                justifyContent={'center'}
                                                alignItems={'center'}
                                                borderRadius={'5px'}
                                                whiteSpace={'pre-line'}
                                                fontSize={{ base: 'xs', md: 'sm' }}
                                            >
                                                {autoPath.path[1]?.piece !== '0'
                                                    ? '(1)\nNoPre'
                                                    : getPathPieceValue(autoPath.path[1], 1)}
                                            </Flex>
                                            {convertPathToArray(autoPath.path).map((pathPiece, pathPieceIndex) => (
                                                <Flex
                                                    key={pathPiece.piece}
                                                    position={'absolute'}
                                                    visibility={imagesLoaded[teamNumber] ? 'visible' : 'hidden'}
                                                    left={`${
                                                        notePositions[pathPiece.piece - 1][0] * dimensionRatios.width
                                                    }px`}
                                                    top={`${
                                                        notePositions[pathPiece.piece - 1][1] * dimensionRatios.height
                                                    }px`}
                                                    width={`${55 * dimensionRatios.width}px`}
                                                    height={`${55 * dimensionRatios.height}px`}
                                                    backgroundColor={perc2color(
                                                        (pathPieceIndex + 1) / convertPathToArray(autoPath.path).length
                                                    )}
                                                    textColor={'black'}
                                                    fontWeight={'bold'}
                                                    textAlign={'center'}
                                                    justifyContent={'center'}
                                                    alignItems={'center'}
                                                    borderRadius={'5px'}
                                                    whiteSpace={'pre-line'}
                                                    fontSize={{ base: 'xs', md: 'sm' }}
                                                >
                                                    {getPathPieceValue(pathPiece, pathPieceIndex + 2)}
                                                </Flex>
                                            ))}
                                        </React.Fragment>
                                    ))}
                            </Center>
                            <Flex justifyContent={'center'} alignItems={'center'} columnGap={'20px'}>
                                <IconButton
                                    icon={<IoChevronBack />}
                                    isDisabled={pathsVisible[teamNumber] === 0}
                                    onClick={() =>
                                        setPathsVisible({
                                            ...pathsVisible,
                                            [teamNumber]: pathsVisible[teamNumber] - 1
                                        })
                                    }
                                />
                                <Text fontSize={'lg'} fontWeight={'semibold'} textAlign={'center'}>
                                    Path {pathsVisible[teamNumber] + 1}
                                </Text>
                                <IconButton
                                    icon={<IoChevronForward />}
                                    isDisabled={pathsVisible[teamNumber] === autoPaths[teamNumber].length - 1}
                                    onClick={() =>
                                        setPathsVisible({
                                            ...pathsVisible,
                                            [teamNumber]: pathsVisible[teamNumber] + 1
                                        })
                                    }
                                />
                            </Flex>
                        </Box>
                    ) : (
                        <Box key={teamNumber} fontSize={'xl'} fontWeight={'semibold'} textAlign={'center'}>
                            No auto data
                        </Box>
                    )}
                </Flex>
            ))}
        </Flex>
    );
}

export default AutoPaths;
