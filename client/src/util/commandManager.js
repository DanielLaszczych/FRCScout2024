const createIncrementCommand = (target, setTarget, field, max) => {
    const previousCount = target[`${field.row}${field.phase}`][field.field];

    return {
        execute(target) {
            let newTarget = { ...target };
            let value = newTarget[`${field.row}${field.phase}`][field.field];
            newTarget[`${field.row}${field.phase}`][field.field] = Math.min(value + 1, max);
            setTarget(newTarget);
        },
        undo(target) {
            let newTarget = { ...target };
            newTarget[`${field.row}${field.phase}`][field.field] = previousCount;
            setTarget(newTarget);
        },
    };
};

const createZeroCommand = (target, setTarget, field) => {
    const previousCount = target[`${field.row}${field.phase}`][field.field];

    return {
        execute(target) {
            let newTarget = { ...target };
            newTarget[`${field.row}${field.phase}`][field.field] = 0;
            setTarget(newTarget);
        },
        undo(target) {
            let newTarget = { ...target };
            newTarget[`${field.row}${field.phase}`][field.field] = previousCount;
            setTarget(newTarget);
        },
    };
};

export const INCREMENT = 'INCREMENT';
export const ZERO = 'ZERO';

const commands = {
    [INCREMENT]: createIncrementCommand,
    [ZERO]: createZeroCommand,
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

        doCommand(commandType, target, setTarget, field, max = null) {
            if (position < history.length - 1) {
                history = history.slice(0, position + 1);
            }

            if (commandType === INCREMENT) {
                if (target[`${field.row}${field.phase}`][field.field] < max) {
                    const concreteCommand = commands[INCREMENT](target, setTarget, field, max);
                    history.push(concreteCommand);
                    position += 1;
                    concreteCommand.execute(target);
                }
            } else if (commandType === ZERO) {
                const concreteCommand = commands[ZERO](target, setTarget, field);
                history.push(concreteCommand);
                position += 1;
                concreteCommand.execute(target);
            }
        },

        undo(target) {
            if (position > 0) {
                history[position].undo(target);
                position -= 1;
            }
        },

        redo(target) {
            if (position < history.length - 1) {
                position += 1;
                history[position].execute(target);
            }
        },
    };
};
