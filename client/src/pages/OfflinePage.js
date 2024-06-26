import { Box } from '@chakra-ui/react';
import React from 'react';

function OfflinePage() {
    return (
        <Box textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
            Go online to access this page
        </Box>
    );
}

export default OfflinePage;
