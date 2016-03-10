'use strict'; // eslint-disable-line strict

const Wemo = require('wemo-client');
const Switch = require('./switch');
const Insight = require('./insight');
const Debug = require('debug');
const constants = require('../constants');

const wemo = new Wemo();
const debug = new Debug(constants.DEBUG_KEY);

class WemoWapper {
    constructor() {
        this.DEVICE_TYPE = constants.DEVICE_TYPE;
    }

    discover(cb) {
        debug('discovering devices');

        const devicePromises = [];

        wemo.discover((deviceInfo) => {
            debug(`found a '${deviceInfo.modelName}' called '${deviceInfo.friendlyName}'`);

            devicePromises.push(this._client(deviceInfo));
        });

        return new Promise((resolve) => {
            setTimeout(() => {
                Promise
                    .all(devicePromises)
                    .then((devices) => {
                        if (cb) {
                            cb(null, devices);
                        }

                        resolve(devices);
                    });
            }, constants.DISCOVERY_TIMEOUT);
        });
    }

    load(ip, port, cb) {
        debug(`loading ${ip}:${port}`);

        const setupUrl = `http://${ip}:${port}/setup.xml`;

        return new Promise((resolve) => {
            wemo.load(setupUrl, (deviceInfo) => {
                debug(`found a '${deviceInfo.modelName}' called '${deviceInfo.friendlyName}'`);

                this
                    ._client(deviceInfo)
                    .then((device) => {
                        if (cb) {
                            cb(null, device);
                        }

                        resolve(device);
                    });
            });
        });
    }

    _client(deviceInfo) {
        const client = wemo.client(deviceInfo);
        let device = {};

        if (deviceInfo.modelName === constants.DEVICE_TYPE.SWITCH) {
            device = new Switch(client);
        } else if (deviceInfo.modelName === constants.DEVICE_TYPE.INSIGHT) {
            device = new Insight(client);
        } else {
            return Promise.resolve(client);
        }

        return device.init();
    }
}

module.exports = new WemoWapper();
