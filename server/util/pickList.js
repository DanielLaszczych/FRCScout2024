const Event = require('../models/Event');

class PickList {
    static pickList = null;
    static eventName = null;
    static eventKey = null;
    static teams = null;

    static async initialize() {
        try {
            const event = await Event.findOne({ currentEvent: true }).exec();
            if (event) {
                this.pickList = JSON.parse(JSON.stringify(event.pickList));
                delete this.pickList['_id'];
                this.eventName = event.name;
                this.eventKey = event.key;
                this.teams = event.teams.map((team) => team.number.toString());
            } else {
                this.pickList = null;
                this.eventName = null;
                this.eventKey = null;
                this.teams = null;
            }
        } catch (err) {
            console.log(err);
        }
    }

    static setPickList(event) {
        this.pickList = JSON.parse(JSON.stringify(event.pickList));
        delete this.pickList['_id'];
        this.eventName = event.name;
        this.eventKey = event.key;
        this.teams = event.teams.map((team) => team.number.toString());
    }

    static noEvent() {
        this.pickList = null;
        this.eventName = null;
        this.eventKey = null;
        this.teams = null;
    }

    static queue = (fn) => {
        let q = Promise.resolve();
        return (...args) => {
            q = q
                .then(() => fn(...args))
                .catch(() => {
                    // noop
                });
        };
    };

    static moveTeam = (team, container, index, socketId, io) => {
        return new Promise((resolve) => {
            let tempList = { ...this.pickList };
            for (let containerParam in tempList) {
                if (containerParam === 'picked') {
                    continue;
                }
                tempList[containerParam] = tempList[containerParam].filter((teamParam) => teamParam !== team);
                if (containerParam === container) {
                    tempList[containerParam] = [...tempList[containerParam].slice(0, index), team, ...tempList[containerParam].slice(index)];
                }
            }
            this.pickList = { ...tempList };
            io.sockets.emit('pickListUpdate', socketId);
            resolve();
        });
    };

    static selectTeam = (team, socketId, io) => {
        return new Promise((resolve) => {
            let tempList = { ...this.pickList };
            if (tempList['picked'].includes(team)) {
                tempList['picked'] = tempList['picked'].filter((teamParam) => teamParam !== team);
            } else {
                tempList['picked'] = [...tempList['picked'], team];
            }

            this.pickList = { ...tempList };
            io.sockets.emit('pickListUpdate', socketId);
            resolve();
        });
    };

    static moveQueue = this.queue(this.moveTeam);
    static selectQueue = this.queue(this.selectTeam);
}

module.exports = PickList;
