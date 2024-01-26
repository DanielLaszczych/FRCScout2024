import { gamePieceFields } from './helperConstants';

const createAutoCommand = () => {
    return {
        // Can overwrite is used to prevent a redo from being able to alter the preloaded piece info
        execute(data, value, canOverWrite = false) {
            let newData = JSON.parse(JSON.stringify(data));
            // Since pieces are all numbers if the value is NaN we know its a scoring location
            if (isNaN(value)) {
                if (canOverWrite && newData.autoTimeline.length > 0 && newData.autoTimeline[0].piece === '0' && newData.autoTimeline[0].scored === null) {
                    newData.autoTimeline[0].scored = value;
                } else {
                    newData.autoTimeline[newData.autoTimeline.length - 1].scored = value;
                }
            } else {
                newData.autoTimeline.push({ piece: value, scored: null });
            }
            return newData;
        },
        undo(data, value) {
            let newData = JSON.parse(JSON.stringify(data));
            if (isNaN(value)) {
                newData.autoTimeline[newData.autoTimeline.length - 1].scored = null;
            } else {
                newData.autoTimeline.pop();
            }
            return newData;
        }
    };
};

const createTeleopCommand = () => {
    return {
        execute(data, value) {
            let newData = JSON.parse(JSON.stringify(data));
            newData['teleopGP'][value] += 1;
            return newData;
        },
        undo(data, value) {
            let newData = JSON.parse(JSON.stringify(data));
            newData['teleopGP'][value] -= 1;
            return newData;
        }
    };
};

// These have to match the fields in the standFormData
export const AUTO = 'auto';
export const TELEOP = 'teleop';
export const ENDGAME = 'endGame';

const commands = {
    [AUTO]: createAutoCommand,
    [TELEOP]: createTeleopCommand,
    [ENDGAME]: createTeleopCommand
};

export const createHistoryManager = (type, setData, prevHistoryData = { data: [], position: -1 }) => {
    let history = prevHistoryData.data;
    let position = prevHistoryData.position;
    let command = commands[type]();

    function getNote(note) {
        if (type === AUTO && !isNaN(note)) {
            return 'Note ' + note;
        } else if (type === AUTO && position <= 0 && history[0] === note && isNaN(note)) {
            return gamePieceFields[note].label + ' (Preloaded)';
        } else {
            return gamePieceFields[note].label;
        }
    }

    return {
        getHistory() {
            return history;
        },

        getPosition() {
            return position;
        },

        getHistoryLength() {
            return history.length;
        },

        getUndoNote() {
            return getNote(history[position]);
        },

        getRedoNote() {
            return getNote(history[position + 1]);
        },

        doCommand(data, value) {
            if (position < history.length - 1) {
                // This ensures that when we are scoring the preloaded piece we do not delete any history
                if (!(type === AUTO && data.autoTimeline.length > 0 && data.autoTimeline[0].piece === '0' && data.autoTimeline[0].scored === null)) {
                    history = history.slice(0, position + 1);
                }
            }

            // When we are scoring the preloaded piece we want to put the data at the beginning of the history
            if (type === AUTO && data.autoTimeline.length > 0 && data.autoTimeline[0].piece === '0' && data.autoTimeline[0].scored === null) {
                // This means we already have an existing value for the preloaded piece
                // so we dont want to shift the history only replace the first element
                if (history.length > 0 && isNaN(history[0])) {
                    history[0] = value;
                } else {
                    history.unshift(value);
                }
            } else {
                history.push(value);
            }

            position += 1;
            let newData = command.execute(data, value, true);
            newData.history[type] = { data: history, position: position };
            setData(newData);
        },

        // Only needed in case we need to remove the preloaded piece but we have to make sure that if
        // our position is at the beginning we do not set it back even more
        removePreloadedEntry(data) {
            if (history.length > 0 && isNaN(history[0])) {
                history.splice(0, 1);
                if (position > -1) {
                    position -= 1;
                }
                let newData = JSON.parse(JSON.stringify(data));
                newData.history[type] = { data: history, position: position };
                setData(newData);
            }
        },

        undo(data) {
            if (position > -1) {
                let newData = command.undo(data, history[position]);
                position -= 1;
                newData.history[type] = { data: history, position: position };
                setData(newData);
            }
        },

        redo(data) {
            if (position < history.length - 1) {
                position += 1;
                let newData = command.execute(data, history[position]);
                newData.history[type] = { data: history, position: position };
                setData(newData);
            }
        }
    };
};
