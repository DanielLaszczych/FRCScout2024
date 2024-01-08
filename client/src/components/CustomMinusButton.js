import React from 'react';
import { Box } from '@chakra-ui/react';

import '../stylesheets/custombuttonstyle.css';

function CustomMinusButton({ onClick, fontSize, height, width, disabled }) {
    return (
        <Box
            className='minus-button'
            _hover={{ backgroundColor: disabled && '#e53e3e' }}
            opacity={disabled ? 0.6 : 1.0}
            onClick={disabled ? null : () => onClick()}
            fontSize={fontSize}
            width={width}
            height={height}
            cursor={!disabled && 'pointer'}
        ></Box>
    );
}

export default CustomMinusButton;
