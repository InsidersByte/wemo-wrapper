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

            device.on(device.EVENT_TYPE.STATE_CHANGED, () => {
                console.log(`switch '${device.friendlyName}' is now turned '${device.friendlyStateName}'`);
            });

            setInterval(() => {
                console.log(`toggling switch '${device.friendlyName}'`);

                device
                    .toggle()
                    .then(() => {
                        console.log(`finished toggling switch '${device.friendlyName}'`);
                    });
            }, 2000);
        }
    });
