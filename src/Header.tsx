/**
 * Header stateless UI component
 */

import React = require('react');

interface IProps {
  status: string;
}

const Header: React.SFC<IProps> = ({ status } : IProps): React.ReactElement<IProps> => {
  const icon = (status === 'WAITING') ? 'sleeping' : 'normal';
  const iconSrc = '../res/dog_' + icon + '.svg';
  const iconAlt = 'Dog ' + icon;
  const title = (status === 'WAITING') ? 'Chrr...' : 'Wuf wuf';
  const helpText =
    (status === 'WAITING') ? 'Choose a device to start monitoring.' :
    'Watching the network for you.';

  return (
    <div className='header'>
      <img src={ iconSrc } alt={ iconAlt } />
      <div>
        <h1 className='mdc-typography--display1'>{ title }</h1>
        <p className='mdc-typography--body1'>{ helpText }</p>
      </div>
    </div>
  );
};

export default Header;
