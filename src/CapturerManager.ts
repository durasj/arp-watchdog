import notifier = require('node-notifier');
import path = require('path');
import { Store } from 'redux';

import Capturer from './Capturer';
import Debug from './Debug';
import { IState } from './State';

/**
 * Capturer manager
 *
 * Opens and closes Capturer from the info in state
 * Triggers poisoning simulation on the currently used capturer
 * Does sideeffects using it's "own state" (currently opened Capturer)
 *
 * @export
 * @class CapturerManager
 */
export default class CapturerManager {

    /**
     * Currently opened capturer
     */
    private capturer: Capturer;

    /**
     * Creates new manager
     */
    constructor(store: Store<IState>) {
        store.subscribe(() => {
            const state = store.getState();

            // New one without any running
            if (this.capturer === undefined && state.currentDevice !== undefined) {
                this.createCapturer(state.currentDevice);
                return;
            } else if (this.capturer === undefined) {
                // Nothing to do, we don't have any started capturer and any to start
                return;
            }

            // Opened currently, should be destroyed if it changed
            // (otherwise something else changed in state)
            if (this.capturer.getDeviceId() !== state.currentDevice) {
                this.destroyCapturer();

                // If also new is defined (device changed), we will start it
                // (otherwise current was just stopped)
                if (state.currentDevice !== undefined) {
                    this.createCapturer(state.currentDevice);
                    return;
                }
            }
        });
    }

    /**
     * Triggers poisoning simulation in the 10s from now
     */
    public planPoinsoningOnCurrentDevice() {
        setTimeout(this.poisonCurrentDevice.bind(this), 10000);
    }

    /**
     * Triggers poisonigng simulation on the current device
     */
    public poisonCurrentDevice() {
        if (this.capturer !== undefined) {
            this.capturer.poison([0xa7, 0xd3]);
            setTimeout(
                () => {
                    this.capturer.poison([0x3f, 0x00]);
                },
                500
            );
        } else {
            Debug.log('No device to poison.');
        }
    }

    /**
     * Creates current capturer
     */
    private createCapturer(deviceId: string) {
        Debug.log('Creating capturer for device ' + deviceId);

        const reportProblem = (ipAddress: string) => {
            const basePath = (process.env.NODE_ENV === 'production') ? '../../app.asar.unpacked' : '..';
            notifier.notify({
                title: 'Wrrr! Problem detected!',
                message: 'Different MAC addresses for ' + ipAddress + '.',
                icon: path.join(__dirname, basePath + '/res/icon_angry.png')
            });
        };

        this.capturer = new Capturer(reportProblem);
        this.capturer.startOnDevice(deviceId).catch((err) => {
            alert('Error: ' + err);
        });
    }

    /**
     * Destroys current capturer
     */
    private destroyCapturer() {
        Debug.log('Stopping capturer for device ' + this.capturer.getDeviceId());

        this.capturer.stop();
        this.capturer = undefined;
    }
}
