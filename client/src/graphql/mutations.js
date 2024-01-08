import { gql } from '@apollo/client';

export const UPDATE_PITFORM = gql`
    mutation ($pitFormInput: PitFormInput!) {
        updatePitForm(pitFormInput: $pitFormInput) {
            eventName
            teamNumber
        }
    }
`;

export const CREATE_EVENT = gql`
    mutation ($eventInput: EventInput!) {
        createEvent(eventInput: $eventInput) {
            name
            key
            week
            eventType
            startDate
            endDate
            currentEvent
        }
    }
`;

export const REMOVE_EVENT = gql`
    mutation ($key: String!) {
        removeEvent(key: $key) {
            name
            key
            week
            eventType
            startDate
            endDate
            year
            custom
        }
    }
`;

export const SET_CURRENT_EVENT = gql`
    mutation ($key: String!) {
        setCurrentEvent(key: $key) {
            name
            key
        }
    }
`;

export const UPDATE_STANDFORM = gql`
    mutation ($matchFormInput: MatchFormInput!) {
        updateStandForm(matchFormInput: $matchFormInput) {
            eventName
            teamNumber
        }
    }
`;

export const UPDATE_SUPERFORMS = gql`
    mutation ($matchFormInputs: [MatchFormInput!]!) {
        updateSuperForms(matchFormInputs: $matchFormInputs) {
            eventName
            teamNumber
        }
    }
`;

export const UPDATE_PITMAP = gql`
    mutation ($key: String!, $image: String!) {
        setEventPitMap(key: $key, image: $image) {
            key
            pitMapImage
        }
    }
`;

export const CREATE_RTESS_ISSUE = gql`
    mutation ($rtessIssueInput: RTESSIssueInput!) {
        createRTESSIssue(rtessIssueInput: $rtessIssueInput) {
            eventKey
            matchNumber
            teamNumber
        }
    }
`;

export const UPDATE_RTESS_ISSUE = gql`
    mutation ($rtessIssueInput: RTESSIssueInput!) {
        updateRTESSIssue(rtessIssueInput: $rtessIssueInput) {
            eventKey
            matchNumber
            teamNumber
        }
    }
`;

export const SAVE_PICK_LIST = gql`
    mutation ($key: String!) {
        savePickList(key: $key) {
            key
            name
        }
    }
`;
