'use strict'; // eslint-disable-line

const Debug = require('debug');
const constants = require('../constants');

const debug = new Debug(constants.DEBUG_KEY);

class Switch {
    constructor(client) {
        this._client = client;

        this.state = 0;
        this.type = constants.DEVICE_TYPE.SWITCH;

        this.friendlyName = client.device.friendlyName;
        this.ip = client.device.host;
        this.port = client.device.port;
    }

    init(cb) {
        return this
            ._getBinaryState()
            .then(() => {
                if (cb) {
                    cb(null, this);
                }

                this.onStateChange();

                return this;
            });
    }

    get turnedOn() {
        return this.state === 1;
    }

    get turnedOff() {
        return this.state === 0;
    }

    get stateFriendlyName() {
        return this._stateFriendlyName(this.state);
    }

    turnOn(cb) {
        return this._setBinaryState(1, cb);
    }

    turnOff(cb) {
        return this._setBinaryState(0, cb);
    }

    toggle(cb) {
        return this._setBinaryState(+!this.state, cb);
    }

    onStateChange(cb) {
        this._client.on(constants.EVENTS.BINARY_STATE_EVENT_NAME, (value) => {
            const newState = +value;

            if (this.state === newState) {
                return;
            }

            debug(`state changed for '${this.friendlyName}' from '${this.stateFriendlyName}' to '${this._stateFriendlyName(newState)}'`);

            this.state = newState;

            if (cb) {
                cb(newState);
            }
        });
    }

    _stateFriendlyName(state) {
        if (state === 0) {
            return 'off';
        } else if (state === 1) {
            return 'on';
        }

        throw new Error(`unknown state ${state}`);
    }

    _getBinaryState(cb) {
        debug(`loading state for '${this.friendlyName}'`);

        return new Promise((resolve, reject) => {
            this._client.getBinaryState((err, response) => {
                if (err) {
                    if (cb) {
                        cb(err);
                    }

                    return reject(err);
                }

                if (cb) {
                    cb(null, response);
                }

                this.state = +response;

                debug(`loaded state '${response}' for '${this.friendlyName}', it is currently '${this.stateFriendlyName}'`);

                return resolve(response);
            });
        });
    }

    _setBinaryState(value, cb) {
        debug(`setting state to '${this._stateFriendlyName(value)}' for '${this.friendlyName}'`);

        return new Promise((resolve, reject) => {
            if (this.state === +value) {
                const error = `device is already turned '${this.stateFriendlyName}'`;

                if (cb) {
                    cb(error);
                }

                return reject(error);
            }

            return this._client.setBinaryState(value, (err, response) => {
                if (err) {
                    if (cb) {
                        cb(err);
                    }

                    return reject(err);
                }

                if (response.BinaryState === 'Error') {
                    if (cb) {
                        cb(`There was an error setting the binary state for ${this.friendlyName}`);
                    }

                    return reject(`There was an error setting the binary state for ${this.friendlyName}`);
                }

                if (cb) {
                    cb(null, response);
                }

                this.state = +response.BinaryState;

                return resolve(response);
            });
        });
    }
}

module.exports = Switch;