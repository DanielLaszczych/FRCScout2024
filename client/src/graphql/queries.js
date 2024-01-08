import { gql } from '@apollo/client';

export const GET_PITFORM = gql`
    query ($eventKey: String!, $teamNumber: Int!) {
        getPitForm(eventKey: $eventKey, teamNumber: $teamNumber) {
            eventKey
            eventName
            teamNumber
            teamName
            weight
            height
            frameSize {
                width
                length
            }
            driveTrain
            motors {
                label
                value
            }
            wheels {
                label
                size
                value
            }
            driveStats {
                drivingGear
                drivenGear
                freeSpeed
                preferRatio
            }
            driveTrainComment
            programmingLanguage
            startingPosition {
                x
                y
            }
            autoAbilities {
                label
                type
                abilities {
                    label
                    subType
                    subField
                }
            }
            autoComment
            teleAbilities {
                label
                type
                abilities {
                    label
                    subType
                    subField
                }
            }
            batteryCount
            chargingBatteryCount
            workingComment
            closingComment
            image
            followUp
            followUpComment
        }
    }
`;

export const GET_PITFORMS_BY_EVENT = gql`
    query ($eventKey: String!) {
        getPitForms(eventKey: $eventKey) {
            eventKey
            eventName
            teamNumber
            teamName
            followUp
            followUpComment
            scouter
        }
    }
`;

export const GET_MATCHFORMS_BY_EVENT = gql`
    query ($eventKey: String!) {
        getMatchForms(eventKey: $eventKey) {
            _id
            eventKey
            eventName
            matchNumber
            teamNumber
            teamName
            station
            standScouter
            standStatus
            standStatusComment
            superScouter
            allianceNumbers
            superStatus
            superStatusComment
        }
    }
`;

export const GET_EVENTS = gql`
    {
        getEvents {
            name
            year
            teams {
                name
                number
                key
            }
            key
            custom
        }
    }
`;

export const GET_EVENT = gql`
    query ($key: String!) {
        getEvent(key: $key) {
            name
            year
            teams {
                name
                number
                key
            }
            key
        }
    }
`;

export const GET_EVENTS_KEYS_NAMES = gql`
    {
        getEvents {
            key
            name
            currentEvent
            startDate
            endDate
            pitMapImage
            custom
        }
    }
`;

export const GET_CURRENT_EVENT = gql`
    {
        getCurrentEvent {
            key
            name
            pitMapImage
            custom
        }
    }
`;

export const GET_TEAMS_EVENTS = gql`
    query ($teamNumber: Int!) {
        getTeamsEvents(teamNumber: $teamNumber) {
            key
            name
            currentEvent
            startDate
            endDate
            custom
        }
    }
`;

export const GET_STANDFORM = gql`
    query ($eventKey: String!, $matchNumber: String!, $station: [String!]!, $standStatus: [String!]!) {
        getMatchForm(eventKey: $eventKey, matchNumber: $matchNumber, station: $station, standStatus: $standStatus) {
            eventKey
            eventName
            station
            teamNumber
            teamName
            startingPosition {
                x
                y
            }
            preLoadedPiece
            bottomAuto {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            middleAuto {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            topAuto {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            crossCommunity
            chargeAuto
            autoChargeComment
            standAutoComment
            bottomTele {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            middleTele {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            topTele {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            chargeTele
            chargeComment
            chargeRobotCount
            impairedCharge
            impairedComment
            defendedBy
            loseCommunication
            robotBreak
            yellowCard
            redCard
            standEndComment
            standStatus
            standStatusComment
        }
    }
`;

export const GET_SUPERFORMS = gql`
    query ($eventKey: String!, $matchNumber: String!, $station: [String!]!, $superStatus: [String!]!) {
        getMatchForms(eventKey: $eventKey, matchNumber: $matchNumber, station: $station, superStatus: $superStatus) {
            eventKey
            eventName
            station
            teamNumber
            teamName
            defenseRating
            defenseAllocation
            quickness
            driverAwareness
            superEndComment
            superStatus
            superStatusComment
        }
    }
`;

export const GET_PITFORMS_BY_TEAM = gql`
    query ($teamNumber: Int!, $followUp: Boolean!) {
        getPitForms(teamNumber: $teamNumber, followUp: $followUp) {
            _id
            eventKey
            eventName
            teamNumber
            teamName
            weight
            height
            frameSize {
                width
                length
            }
            driveTrain
            motors {
                _id
                label
                value
            }
            wheels {
                _id
                label
                size
                value
            }
            driveStats {
                _id
                drivingGear
                drivenGear
                freeSpeed
                pushingPower
            }
            driveTrainComment
            programmingLanguage
            startingPosition {
                x
                y
            }
            autoAbilities {
                label
                type
                abilities {
                    label
                    subType
                    subField
                }
            }
            autoComment
            teleAbilities {
                label
                type
                abilities {
                    label
                    subType
                    subField
                }
            }
            batteryCount
            chargingBatteryCount
            workingComment
            closingComment
            image
            followUp
        }
    }
`;

export const GET_STANDFORMS_BY_TEAM = gql`
    query ($teamNumber: Int!, $standStatus: [String!]!) {
        getMatchForms(teamNumber: $teamNumber, standStatus: $standStatus) {
            _id
            eventKey
            eventName
            station
            matchNumber
            teamNumber
            teamName
            standScouter
            startingPosition {
                x
                y
            }
            preLoadedPiece
            bottomAuto {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            middleAuto {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            topAuto {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            crossCommunity
            chargeAuto
            autoChargeComment
            standAutoComment
            bottomTele {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            middleTele {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            topTele {
                coneScored
                coneMissed
                cubeScored
                cubeMissed
            }
            chargeTele
            chargeComment
            chargeRobotCount
            impairedCharge
            impairedComment
            defendedBy
            loseCommunication
            robotBreak
            yellowCard
            redCard
            standEndComment
            standStatus
            standStatusComment
        }
    }
`;

export const GET_SUPERFORMS_BY_TEAM = gql`
    query ($teamNumber: Int!, $superStatus: [String!]!) {
        getMatchForms(teamNumber: $teamNumber, superStatus: $superStatus) {
            _id
            eventKey
            eventName
            station
            matchNumber
            teamNumber
            teamName
            superScouter
            allianceNumbers
            defenseRating
            defenseAllocation
            quickness
            driverAwareness
            superEndComment
            superStatus
            superStatusComment
        }
    }
`;

export const GET_RTESS_ISSUES_ALL = gql`
    {
        getRTESSIssues {
            _id
            eventKey
            matchNumber
            teamNumber
            teamName
            submitter
            rtessMember
            issue
            problemComment
            solutionComment
            status
            updatedAt
        }
    }
`;

export const GET_RTESS_ISSUE = gql`
    query ($_id: String!) {
        getRTESSIssue(_id: $_id) {
            _id
            eventKey
            matchNumber
            teamNumber
            teamName
            submitter
            rtessMember
            issue
            problemComment
            solutionComment
            status
        }
    }
`;
