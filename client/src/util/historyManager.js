import { scoutedField } from './helperConstants';

const createAutoCommand = (setData) => {
    return {
        // Can overwrite is used to prevent a redo from being able to alter the preloaded piece info
        execute(data, value, canOverWrite = false) {
            let newData = { ...data };
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
            setData(newData);
        },
        undo(data, value) {
            let newData = { ...data };
            if (isNaN(value)) {
                newData.autoTimeline[newData.autoTimeline.length - 1].scored = null;
            } else {
                newData.autoTimeline.pop();
            }
            setData(newData);
        }
    };
};

const createTeleopCommand = (setData) => {
    return {
        execute(data, value) {
            let newData = { ...data };
            newData['teleopGP'][value] += 1;
            setData(newData);
        },
        undo(data, value) {
            let newData = { ...data };
            newData['teleopGP'][value] -= 1;
            setData(newData);
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

export const createHistoryManager = (type, setData, prevHistory = []) => {
    let history = prevHistory;
    let position = history.length ? history.length - 1 : -1;
    let command = commands[type](setData);

    function getNote(note) {
        if (type === AUTO && !isNaN(note)) {
            return 'Note ' + note;
        } else if (type === AUTO && position <= 0 && history[0] === note && isNaN(note)) {
            return scoutedField[note].label + ' (Preloaded)';
        } else {
            return scoutedField[note].label;
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
            command.execute(data, value, true);
            let newData = { ...data };
            newData.history[type] = history;
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
                let newData = { ...data };
                newData.history[type] = history;
                setData(newData);
            }
        },

        undo(data) {
            if (position > -1) {
                command.undo(data, history[position]);
                position -= 1;
            }
        },

        redo(data) {
            if (position < history.length - 1) {
                position += 1;
                command.execute(data, history[position]);
            }
        }
    };
};
