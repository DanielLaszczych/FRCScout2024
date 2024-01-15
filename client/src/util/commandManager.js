// const createIncrementCommand = (target, setTarget, field, max) => {
//     const previousCount = target[`${field.row}${field.phase}`][field.field];
//     return {
//         execute(target) {
//             let newTarget = { ...target };
//             let value = newTarget[`${field.row}${field.phase}`][field.field];
//             newTarget[`${field.row}${field.phase}`][field.field] = Math.min(value + 1, max);
//             setTarget(newTarget);
//         },
//         undo(target) {
//             let newTarget = { ...target };
//             newTarget[`${field.row}${field.phase}`][field.field] = previousCount;
//             setTarget(newTarget);
//         },
//     };
// };

// const createZeroCommand = (target, setTarget, field) => {
//     const previousCount = target[`${field.row}${field.phase}`][field.field];

//     return {
//         execute(target) {
//             let newTarget = { ...target };
//             newTarget[`${field.row}${field.phase}`][field.field] = 0;
//             setTarget(newTarget);
//         },
//         undo(target) {
//             let newTarget = { ...target };
//             newTarget[`${field.row}${field.phase}`][field.field] = previousCount;
//             setTarget(newTarget);
//         },
//     };
// };

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

export const AUTO_PIECE = 'AUTO PIECE';
export const AUTO_SCORE = 'AUTO SCORE';

const commands = {
    [AUTO_PIECE]: createAutoPieceCommand,
    [AUTO_SCORE]: createAutoScoreCommand
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

        getUndoNode() {
            return history[position].note;
        },

        getRedoNote() {
            return history[position + 1].note;
        },

        doCommand(commandType, data, setData, value) {
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
                    note = '123';
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
