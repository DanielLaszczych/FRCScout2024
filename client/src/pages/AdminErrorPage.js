import { Box } from '@chakra-ui/react';
import React from 'react';

function AdminErrorPage() {
    return (
        <Box textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
            You must be an admin
        </Box>
    );
}

export default AdminErrorPage;
