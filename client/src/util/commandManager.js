const createAutoPieceCommand = (setData, piece) => {
    return {
        execute(data) {
            let newData = { ...data };
            newData.autoTimeline.push({ piece: piece, scored: null });
            setData(newData);
        },
        undo(data) {
            let newData = { ...data };
            newData.autoTimeline.pop();
            setData(newData);
        }
    };
};

const createAutoScoreCommand = (setData, location) => {
    return {
        execute(data) {
            let newData = { ...data };
            newData.autoTimeline[newData.autoTimeline.length - 1].scored = location;
            setData(newData);
        },
        undo(data) {
            let newData = { ...data };
            newData.autoTimeline[newData.autoTimeline.length - 1].scored = null;
            setData(newData);
        }
    };
};

const createTeleopIncrementCommand = (setData, field) => {
    return {
        execute(data) {
            let newData = { ...data };
            newData['teleopGP'][field] += 1;
            setData(newData);
        },
        undo(data) {
            let newData = { ...data };
            newData['teleopGP'][field] -= 1;
            setData(newData);
        }
    };
};

export const AUTO_PIECE = 'AUTO PIECE';
export const AUTO_SCORE = 'AUTO SCORE';
export const TELEOP_INCREMENT = 'INCREMENT';

const commands = {
    [AUTO_PIECE]: createAutoPieceCommand,
    [AUTO_SCORE]: createAutoScoreCommand,
    [TELEOP_INCREMENT]: createTeleopIncrementCommand
};

export const createCommandManager = () => {
    let history = [null];
    let position = 0;

    return {
        getPosition() {
            return position;
        },

        getHistoryLength() {
            return history.length;
        },

        getUndoNote() {
            return history[position].note;
        },

        getRedoNote() {
            return history[position + 1].note;
        },

        doCommand(commandType, data, setData, value, optionalNote = null) {
            if (position < history.length - 1) {
                history = history.slice(0, position + 1);
            }

            const concreteCommand = commands[commandType](setData, value);
            let note = null;
            switch (commandType) {
                case AUTO_PIECE:
                    note = `Note ${value}`;
                    break;
                case AUTO_SCORE:
                    note = optionalNote;
                    break;
                case TELEOP_INCREMENT:
                    note = optionalNote;
                    break;
                default:
                    note = '';
            }
            history.push({ command: concreteCommand, note: note });
            position += 1;
            concreteCommand.execute(data);
        },

        undo(data) {
            if (position > 0) {
                history[position].command.undo(data);
                position -= 1;
            }
        },

        redo(data) {
            if (position < history.length - 1) {
                position += 1;
                history[position].command.execute(data);
            }
        }
    };
};
