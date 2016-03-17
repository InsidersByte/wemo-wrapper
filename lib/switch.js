'use strict'; // eslint-disable-line strict

const Debug = require('debug');
const constants = require('../constants');
const EventEmitter = require('events');

const debug = new Debug(constants.DEBUG_KEY);

class Switch extends EventEmitter {
    constructor(client) {
        super();

        this._client = client;

        this._state = 0;
        this.type = constants.DEVICE_TYPE.SWITCH;

        this.friendlyName = client.device.friendlyName;
        this.ip = client.device.host;
        this.port = client.device.port;

        this.EVENT_TYPE = constants.EVENT_TYPE;

        this._registerBinaryStateChange();
    }

    init(cb) {
        return this
            ._getBinaryState()
            .then(() => {
                if (cb) {
                    cb(null, this);
                }

                return this;
            });
    }

    get turnedOn() {
        return this._state === 1;
    }

    get turnedOff() {
        return this._state === 0;
    }

    get friendlyStateName() {
        return this._friendlyStateName(this._state);
    }

    turnOn(cb) {
        return this._setBinaryState(1, cb);
    }

    turnOff(cb) {
        return this._setBinaryState(0, cb);
    }

    toggle(cb) {
        return this._setBinaryState(+!this._state, cb);
    }

    _registerBinaryStateChange() {
        this._client.on(constants.EVENT_TYPE.STATE_CHANGED, (value) => {
            const newState = +value;

            // This could be from and to the same state as the state changes when setting
            debug(`state changed for '${this.friendlyName}' from '${this.friendlyStateName}' to '${this._friendlyStateName(newState)}'`);

            this._state = newState;

            this.emit(constants.EVENT_TYPE.STATE_CHANGED, this._state);
        });
    }

    _friendlyStateName(state) {
        if (state === 0) {
            return 'off';
        } else if (state === 1) {
            return 'on';
        } else if (state === 8) {
            return 'standby';
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

                this._state = +response;

                debug(`loaded state '${response}' for '${this.friendlyName}', it is currently '${this.friendlyStateName}'`);

                return resolve(response);
            });
        });
    }

    _setBinaryState(value, cb) {
        debug(`setting state to '${this._friendlyStateName(value)}' for '${this.friendlyName}'`);

        return new Promise((resolve, reject) => {
            const newState = +value;

            if (this._state === newState) {
                const error = `device is already turned '${this.friendlyStateName}'`;

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
                    // It is possible that the state held has drifted due to not being notified of the change
                    return this._getBinaryState()
                        .then(() => {
                            if (newState !== this._state) {
                                const error = new Error(`There was an error setting the binary state for ${this.friendlyName}`);

                                if (cb) {
                                    cb(error);
                                }

                                return reject(error);
                            }

                            if (cb) {
                                cb(null, response);
                            }

                            return resolve(response);
                        });
                }

                if (cb) {
                    cb(null, response);
                }

                this._state = +response.BinaryState;

                return resolve(response);
            });
        });
    }
}

module.exports = Switch;
