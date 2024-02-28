import React, { useEffect, useState } from 'react';
import { Box, Center, Flex, Spinner, Table, Tbody, Td, Text, Tr } from '@chakra-ui/react';
import '../stylesheets/playoffbracket.css';

function PlayoffBracket({ event }) {
    const [error, setError] = useState(null);
    const [matches, setMatches] = useState(null);

    useEffect(() => {
        fetch(`/blueAlliance/event/${event.key}/matches/simple`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.Error) {
                    setMatches(data);
                } else {
                    setError(data.Error);
                }
            })
            .catch((error) => {
                setError(error.message);
            });
    }, [event]);

    function getMatchInfo(matchNumber) {
        return matches.filter((match) => match.key === matchNumber);
    }

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

    if (matches === null) {
        return (
            <Center>
                <Spinner />
            </Center>
        );
    }

    return (
        <div class='col-sm-12'>
            <h3>Playoff Bracket</h3>
            <div id='double-elim-bracket-wrapper'>
                <table id='double-elim-bracket-table'>
                    <tbody>
                        <tr class='gap-row'></tr>
                        <tr>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 1</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class='winner'> 1</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/1690'>1690</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/3339'>3339</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5135'>5135</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore winner'>1</td>
                                                </tr>

                                                <tr>
                                                    <td class=''> 8</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/3065'>3065</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/3316'>3316</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/6230'>6230</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/3083'>3083</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore '>0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td rowspan='4' class=''>
                                <div class='merger inner'></div>
                            </td>
                        </tr>

                        <tr>
                            <td></td>
                            <td class='dash'></td>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 7</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class='winner'> 1</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/1690'>1690</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/3339'>3339</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5135'>5135</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore winner'>1</td>
                                                </tr>

                                                <tr>
                                                    <td class=''> 4</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/5715'>5715</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/6738'>6738</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/9738'>9738</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore '>0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td colspan='3'></td>
                            <td rowspan='8' colspan='3'>
                                <div class='merger inner'></div>
                            </td>
                        </tr>

                        <tr>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 2</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class='winner'> 4</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/5715'>5715</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/6738'>6738</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/9738'>9738</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore winner'>1</td>
                                                </tr>

                                                <tr>
                                                    <td class=''> 5</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/4320'>4320</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5990'>5990</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/4338'>4338</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore '>0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td colspan='16'></td>
                        </tr>

                        <tr>
                            <td colspan='4'></td>
                            <td class='dash' colspan='2'></td>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 11</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class='winner'> 1</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/1690'>1690</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/3339'>3339</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5135'>5135</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore winner'>1</td>
                                                </tr>
                                                <tr>
                                                    <td class=''> 3</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/1942'>1942</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5951'>5951</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/2679'>2679</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore '>0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td colspan='9'></td>
                            <td class='' colspan='3'>
                                <div class='top inner'></div>
                            </td>
                            <td class='' rowspan='9'>
                                <div class='merger inner'></div>
                            </td>
                        </tr>

                        <tr>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 3</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class='winner'> 2</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/1574'>1574</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/1577'>1577</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/1576'>1576</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/8175'>8175</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore winner'>1</td>
                                                </tr>

                                                <tr>
                                                    <td class=''> 7</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/3211'>3211</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/2630'>2630</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/2230'>2230</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore '>0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td rowspan='4'>
                                <div class='merger inner'></div>
                            </td>
                        </tr>

                        <tr>
                            <td></td>
                            <td class='dash'></td>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 8</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class=''> 2</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/1574'>1574</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/1577'>1577</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/1576'>1576</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/8175'>8175</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore '>0</td>
                                                </tr>

                                                <tr>
                                                    <td class='winner'> 3</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/1942'>1942</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5951'>5951</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/2679'>2679</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore winner'>1</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td colspan='3'></td>
                            <td colspan='10'></td>
                            <td class='dash' colspan='1'></td>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Finals</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class='winner'> 1</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/1690'>1690</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/3339'>3339</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5135'>5135</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore winner'>2</td>
                                                </tr>

                                                <tr>
                                                    <td class=''> 3</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/1942'>1942</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5951'>5951</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/2679'>2679</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore '>0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 4</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class='winner'> 3</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/1942'>1942</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5951'>5951</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/2679'>2679</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore winner'>1</td>
                                                </tr>

                                                <tr>
                                                    <td class=''> 6</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/6740'>6740</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5654'>5654</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/7067'>7067</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore '>0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td></td>
                        </tr>
                        <tr>
                            <td colspan='16'></td>
                        </tr>

                        <tr>
                            <td colspan='11'></td>
                            <td class='dash'></td>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 13</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class='winner'> 3</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/1942'>1942</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5951'>5951</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/2679'>2679</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore winner'>1</td>
                                                </tr>

                                                <tr>
                                                    <td class=''> 2</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/1574'>1574</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/1577'>1577</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/1576'>1576</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/8175'>8175</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore '>0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td colspan='5'></td>
                            <td class='dash' colspan='1'></td>

                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 10</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class='winner'> 2</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/1574'>1574</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/1577'>1577</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/1576'>1576</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/8175'>8175</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore winner'>1</td>
                                                </tr>

                                                <tr>
                                                    <td class=''> 5</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/4320'>4320</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5990'>5990</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/4338'>4338</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore '>0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                            <td colspan='3'></td>
                            <td rowspan='3'>
                                <div class='snake inner'></div>
                            </td>
                        </tr>

                        <tr>
                            <td colspan='4'></td>
                            <td rowspan='2'>
                                <div class='snake inner'></div>
                            </td>
                            <td colspan='1'></td>
                            <td rowspan='4' class=''>
                                <div class='merger inner'></div>
                            </td>
                        </tr>

                        <tr>
                            <td colspan='3'></td>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 5</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class=''> 8</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/3065'>3065</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/3316'>3316</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/6230'>6230</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/3083'>3083</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore '>0</td>
                                                </tr>

                                                <tr>
                                                    <td class='winner'> 5</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/4320'>4320</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5990'>5990</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/4338'>4338</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore winner'>1</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                            <td colspan='3'></td>
                            <td class='dash'></td>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 12</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class=''> 2</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/1574'>1574</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/1577'>1577</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/1576'>1576</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/8175'>8175</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore '>0</td>
                                                </tr>

                                                <tr>
                                                    <td class=''> 6</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/6740'>6740</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5654'>5654</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/7067'>7067</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore '>0</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td colspan='1'></td>
                        </tr>

                        <tr>
                            <td colspan='5'></td>
                            <td class='dash' colspan='1'></td>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 9</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class=''> 4</td>

                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/5715'>5715</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/6738'>6738</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/9738'>9738</a>
                                                        </span>
                                                    </td>

                                                    <td class='redScore '>0</td>
                                                </tr>

                                                <tr>
                                                    <td class='winner'> 6</td>

                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/6740'>6740</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5654'>5654</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/7067'>7067</a>
                                                        </span>
                                                    </td>

                                                    <td class='blueScore winner'>1</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td colspan='4'></td>
                            <td rowspan='2' class='path'>
                                <div class='snake inner'></div>
                            </td>
                        </tr>

                        <tr>
                            <td colspan='3'></td>
                            <td rowspan='2' class='match'>
                                <div class='match-table-wrapper'>
                                    <div style={{ position: 'relative' }}>
                                        <span class='match-label'>Match 6</span>
                                        <table class='match-table'>
                                            <tbody>
                                                <tr>
                                                    <td class=''> 7</td>
                                                    <td>
                                                        <span class='alliance-name '>
                                                            <a href='https://www.thebluealliance.com/team/3211'>3211</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/2630'>2630</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/2230'>2230</a>
                                                        </span>
                                                    </td>
                                                    <td class='redScore '>0</td>
                                                </tr>
                                                <tr>
                                                    <td class='winner'> 6</td>
                                                    <td>
                                                        <span class='alliance-name winner'>
                                                            <a href='https://www.thebluealliance.com/team/6740'>6740</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/5654'>5654</a>
                                                            -
                                                            <a href='https://www.thebluealliance.com/team/7067'>7067</a>
                                                        </span>
                                                    </td>
                                                    <td class='blueScore winner'>1</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan='1'></td>
                        </tr>
                        <tr class='gap-row'></tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PlayoffBracket;
