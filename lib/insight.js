'use strict'; // eslint-disable-line

const constants = require('../constants');
const Switch = require('./switch');

class Insight extends Switch {
    constructor(device) {
        super(device);

        this.type = constants.DEVICE_TYPE.INSIGHT;
    }
}

module.exports = Insight;
