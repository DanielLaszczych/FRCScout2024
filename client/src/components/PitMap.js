import {
    Box,
    Button,
    Center,
    Image as ChakraImage,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    useDisclosure
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { GrMapLocation } from 'react-icons/gr';
import { containsSubsequence } from '../util/helperFunctions';

function PitMap({ event, iconTop, iconLeft, searchBar = false, redTeams = [], blueTeams = [] }) {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [pitImageVariables, setPitImageVariables] = useState(null);
    const [pitTeamNumber, setPitTeamNumber] = useState('');

    const getPitImageVariables = useCallback(() => {
        if (event?.pitMapImage) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let maxWidth = viewportWidth * 0.9;
            let maxHeight = viewportHeight * 0.9;

            let img = new Image();
            img.src = event.pitMapImage;

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
    }, [event]);

    useEffect(() => {
        getPitImageVariables();

        window.addEventListener('resize', getPitImageVariables);

        return () => window.removeEventListener('resize', getPitImageVariables);
    }, [getPitImageVariables]);

    return (
        event.pitMapImage && (
            <React.Fragment>
                <IconButton
                    position={'absolute'}
                    left={`${iconLeft}px`}
                    top={`${iconTop}px`}
                    onClick={onOpen}
                    size={'sm'}
                    icon={<GrMapLocation />}
                />
                <Modal
                    isOpen={isOpen}
                    onClose={() => {
                        onClose();
                        setPitTeamNumber('');
                    }}
                    allowPinchZoom={true}
                    blockScrollOnMount={false}
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
                            {searchBar && (
                                <ModalHeader position={'sticky'} top={'5px'}>
                                    {/* So we can use esacpe to close modal */}
                                    <Button
                                        disabled={true}
                                        position={'absolute'}
                                        background={'transparent'}
                                        top={'0px'}
                                        left={'0px'}
                                        _focus={{ boxShadow: 'none' }}
                                        _hover={{ background: 'transparent' }}
                                        cursor={'default'}
                                    />
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
                            )}
                            <ModalBody
                                border={'1px solid red'}
                                onClick={() => {
                                    onClose();
                                    setPitTeamNumber('');
                                }}
                                padding={'0px'}
                                position={'relative'}
                            >
                                <ChakraImage width={'90vw'} height={'90dvh'} fit={'contain'} src={event.pitMapImage} />
                                {pitImageVariables !== null &&
                                    event.pitImageOCRInfo &&
                                    event.pitImageOCRInfo
                                        .filter(
                                            (ocrInfo) =>
                                                (searchBar &&
                                                    containsSubsequence(ocrInfo.teamNumber, parseInt(pitTeamNumber))) ||
                                                [...redTeams, ...blueTeams].some(
                                                    (teamNumber) => ocrInfo.teamNumber === parseInt(teamNumber)
                                                )
                                        )
                                        .map((ocrInfo) => (
                                            <Box
                                                key={ocrInfo.teamNumber.toString() + ocrInfo.left.toString()}
                                                position={'absolute'}
                                                border={'3px solid'}
                                                borderColor={
                                                    blueTeams.includes(ocrInfo.teamNumber.toString()) ? 'blue' : 'red'
                                                }
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
        )
    );
}

export default PitMap;
