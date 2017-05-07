/**
 * Main App component
 *
 * Connects all of the UI and state
 */

import React = require('react');
import { connect } from 'react-redux';
import Redux from 'redux';

import Devices from './Devices';
import Header from './Header';
import Poisoning from './Poisoning';
import { IState } from './State';

interface IStateProps {
  status: string;
  currentDevice: string;
}

interface ICustomProps {
  onPoison(): void;
  onPlanPoisoning(): void;
}

interface IProps extends IStateProps, ICustomProps {
  onToggle(): { type: string; id: string };
}

const mapStateToProps = (state: IState) => ({
  status: state.status,
  currentDevice: state.currentDevice
});

const mapDispatchToProps = (dispatch: Redux.Dispatch<IState>) => ({
  onToggle: (id: string) => dispatch({ type: 'TOGGLE', id: id })
});

/**
 * App layout
 */
const AppPresentational: React.SFC<IProps> = ({
  status,
  currentDevice,
  onToggle,
  onPoison,
  onPlanPoisoning
 }: IProps) => (
  <main className='main'>
    <Header status={ status } />

    <Devices
      currentDevice={ currentDevice }
      onToggle={ onToggle }
    />

    <Poisoning
      onPoison={ onPoison }
      onPlanPoisoning={ onPlanPoisoning }
    />
  </main>
);

const App = connect<IStateProps, IProps, ICustomProps>(
  mapStateToProps,
  mapDispatchToProps
)(AppPresentational);

export default App;
