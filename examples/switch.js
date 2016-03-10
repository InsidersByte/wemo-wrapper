'use strict'; // eslint-disable-line strict

const wemo = require('../');

wemo
    .discover()
    .then((devices) => {
        console.log(`finished finding devices, found ${devices.length} in total`);

        for (let device of devices) { // eslint-disable-line prefer-const
            if (device.type !== wemo.DEVICE_TYPE.SWITCH) {
                continue;
            }

            console.log(`switch found: ${device.friendlyName}`);

            setInterval(() => {
                console.log(`toggling switch '${device.friendlyName}'`);

                device.toggle();
            }, 2000);
        }
    });
