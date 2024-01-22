import { Box, VStack } from '@chakra-ui/react';
import React from 'react';
import { config } from '../util/helperConstants';
import GoogleButton from '../components/GoogleButton';

function FailedLoginPage() {
    return (
        <VStack>
            <Box textAlign={'center'} fontSize={'lg'} fontWeight={'semibold'} margin={'0 auto'} width={{ base: '85%', md: '66%', lg: '50%' }}>
                Please sign in with a RoboTigers account
            </Box>
            <a style={{ marginTop: '25px' }} href={`${config.API_URL}/auth/google`}>
                <GoogleButton />
            </a>
        </VStack>
    );
}

export default FailedLoginPage;
