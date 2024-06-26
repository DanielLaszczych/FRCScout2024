import { Box } from '@chakra-ui/react';
import React from 'react';

function NotFoundPage() {
    return (
        <Box textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
            Page Not Found
        </Box>
    );
}

export default NotFoundPage;
