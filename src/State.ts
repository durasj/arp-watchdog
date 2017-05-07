import { Action, createStore, Store } from 'redux';
import Capturer from './Capturer';

export interface IState {
    /**
     * Current app state
     *
     * Can be: WAITING, WATCHING
     */
    status: string;

    /**
     * Device id we are currently watching on
     */
    currentDevice: string;
}

/**
 * State management using Redux
 */
export default class State {
    /**
     * Redux store
     */
    private store: Store<IState>;

    /**
     * Create new store for the app state
     */
    public constructor() {
        // Create a Redux store holding the state of the app.
        this.store = createStore(this.reducer);
    }

    /**
     * Created redux store
     */
    public getStore() {
        return this.store;
    }

    /**
     * Reducer, a pure function with (state, action) => state signature.
     * It describes how an action transforms the state into the next state.
     *
     * @private
     * @param {IState} state
     * @param {Action} action
     * @returns
     *
     * @memberOf State
     */
    private reducer(state: IState, action: any) {
        state = state || {
            status: 'WAITING',
            currentDevice: undefined
        };

        switch (action.type) {
            case 'TOGGLE':
                const currentStatus = state.status;

                // Simple case, we are starting some watching
                if (currentStatus === 'WAITING') {
                    return {
                        ...state,
                        status: 'WATCHING',
                        currentDevice: action.id
                    };
                }

                // We are stopping or changing watched device
                if (currentStatus === 'WATCHING') {
                    if (state.currentDevice !== action.id) {
                        // Changing
                        return {
                            ...state,
                            status: 'WATCHING',
                            currentDevice: action.id
                        };
                    } else {

                        // Stopping
                        return {
                            ...state,
                            status: 'WAITING',
                            currentDevice: undefined
                        };
                    }
                }

                return state;
            default:
                return state;
        }
    }
}
