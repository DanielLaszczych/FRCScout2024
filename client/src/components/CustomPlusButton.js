import React from 'react';
import { Box } from '@chakra-ui/react';

import '../stylesheets/custombuttonstyle.css';

function CustomPlusButton({ onClick, fontSize, height, width, disabled }) {
    return (
        <Box
            className='plus-button'
            _hover={{ backgroundColor: disabled && '#38a169' }}
            opacity={disabled ? 0.6 : 1.0}
            onClick={disabled ? null : () => onClick()}
            fontSize={fontSize}
            width={width}
            height={height}
            cursor={!disabled && 'pointer'}
        ></Box>
    );
}

export default CustomPlusButton;
