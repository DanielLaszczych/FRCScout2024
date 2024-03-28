import React, { useEffect, useState } from 'react';
import { Box, Center, Spinner } from '@chakra-ui/react';
import '../stylesheets/playoffbracket.css';

function PlayoffBracket({ event }) {
    const [error, setError] = useState(null);
    const [bracketHTML, setBracketHTML] = useState(null);

    useEffect(() => {
        fetch(`/blueAlliance/playoffBracket/${event.key}`)
            .then((response) => response.text())
            .then((html) => {
                let searchString = /team\/(\d+)/g;
                let replacementString = 'team/$1/overview';
                html = html.replace(searchString, replacementString);

                let htmlElement = document.createElement('div');
                htmlElement.innerHTML = html;

                let matchElements = htmlElement.querySelectorAll('.match-label');
                for (const matchElement of matchElements) {
                    let teamNumbers = [];
                    let trElements = matchElement.parentElement.getElementsByTagName('tr');
                    for (const trElement of trElements) {
                        let teamNumberElements = trElement.querySelectorAll('a');
                        for (let i = 0; i < 3 && i < teamNumberElements.length; i++) {
                            teamNumbers.push(teamNumberElements[i].innerHTML);
                        }
                    }
                    let matchNumber =
                        matchElement.innerHTML === 'Finals' ? '' : `sf${matchElement.innerHTML.split(' ')[1]}m1`;
                    let url = `matchAnalyst/${event.key}/${teamNumbers.join('/')}/${matchNumber}`;
                    matchElement.innerHTML = `<a href=${url}>${matchElement.innerHTML}</a>`;
                    matchElement.style.textDecoration = 'underline';
                }

                let bracketHTML = htmlElement.querySelector('#double-elim-bracket-table');
                setBracketHTML(bracketHTML?.innerHTML);
            })
            .catch((error) => {
                setError(error.message);
            });
    }, [event]);

    if (error) {
        return (
            <Box
                textAlign={'center'}
                fontSize={'lg'}
                fontWeight={'semibold'}
                margin={'0 auto'}
                width={{ base: '85%', md: '66%', lg: '50%' }}
            >
                {error}
            </Box>
        );
    }

    if (bracketHTML === null) {
        return (
            <Center marginTop={'40px'}>
                <Spinner />
            </Center>
        );
    }

    if (!bracketHTML) {
        return (
            <Box
                textAlign={'center'}
                fontSize={'lg'}
                fontWeight={'semibold'}
                margin={'0 auto'}
                width={{ base: '85%', md: '66%', lg: '50%' }}
                marginTop={'25px'}
            >
                Playoff bracket not available
            </Box>
        );
    }

    return (
        <Box position={'relative'}>
            <Box width={'calc(100vw - 17px)'} overflowX={'auto'} marginLeft={'0px'}>
                <table id='double-elim-bracket-table' dangerouslySetInnerHTML={{ __html: bracketHTML }}></table>
            </Box>
        </Box>
    );
}

export default PlayoffBracket;
