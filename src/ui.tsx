/**
 * Main App component initialization
 *
 * Connects business logic and state with the UI
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import CapturerManager from './CapturerManager';
import Minimalizing from './Minimalizing';
import State from './State';

import App from './App';

const store = new State().getStore();
const cp = new CapturerManager(store);
const min = new Minimalizing(store);

ReactDOM.render(
    <Provider store={ store }>
        <App
            onPoison={ cp.poisonCurrentDevice.bind(cp) }
            onPlanPoisoning={ cp.planPoinsoningOnCurrentDevice.bind(cp) }
        />
    </Provider>,
    document.getElementById('ui')
);
