import Electron from 'electron';
import Redux from 'redux';
import { IState } from './State';
const electron = require('electron');
const notifier = require('node-notifier');
const path = require('path');

/**
 * Deals with minimalizing to the tray
 *
 * Main window will be hidden on minimize and
 * user will be informed about it for the first time it happens.
 * Creates tray icon always visible in the tray
 */
export default class Minimalizing {
    /**
     * Main app window
     */
    private mainWindow: Electron.BrowserWindow;

    /**
     * Whether we already notified about tray on this app run
     */
    private notified = false;

    /**
     * Tray app icon
     */
    private appIcon: Electron.Tray;

    /**
     * Redux state store
     */
    private store: Redux.Store<IState>;

    /**
     * Creates new minimalizing handling using passed store
     */
    constructor (store: Redux.Store<IState>) {
        this.mainWindow = electron.remote.getCurrentWindow();
        this.store = store;

        this.initHandling();
    }

    /**
     * Binds all events, creates tray icon
     */
    private initHandling() {
        this.mainWindow.on('minimize', (event: Electron.Event) => {
            if (this.shouldHide()) {
                event.preventDefault();
                this.hideWindow();
            }
        });

        this.appIcon = new electron.remote.Tray(
            path.join(__dirname, '../res/icon.' + (process.platform === 'win32' ? 'ico' : 'png'))
        );
        const contextMenu = electron.remote.Menu.buildFromTemplate([
            {
                label: 'Open', click: () => {
                    this.mainWindow.show();
                }
            }, {
                label: 'Quit', click: () => {
                    electron.remote.app.quit();
                }
            }
        ]);
        this.appIcon.setToolTip('ARP Watchdog');
        this.appIcon.setContextMenu(contextMenu);
        this.appIcon.on('click', () => {
            if (!this.mainWindow.isVisible() || this.mainWindow.isMinimized()) {
                this.mainWindow.show();
            }
        });
    }

    /**
     * Hide the main app window and optionally notify
     */
    private hideWindow() {
        if (!this.notified) {
            const basePath = (process.env.NODE_ENV === 'production') ? '../../app.asar.unpacked' : '..';

            notifier.notify({
                title: 'Wuf, I`ll be sitting here',
                message: 'Watching in the background for you',
                icon: path.join(__dirname, basePath + '/res/icon_normal.png')
            });
            this.notified = true;
        }

        this.mainWindow.hide();
    }

    /**
     * Should the window be hidden
     */
    private shouldHide() {
        const state: IState = this.store.getState();

        return state.status === 'WATCHING';
    }
}
