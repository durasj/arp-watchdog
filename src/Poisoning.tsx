/**
 * Poisoning stateless UI component
 */

import React = require('react');

interface IProps {
    onPoison(): void;
    onPlanPoisoning(): void;
}

const Poisoning: React.SFC<IProps> = ({ onPoison, onPlanPoisoning } : IProps): React.ReactElement<IProps> => {
  return (
    <div className='mdc-card'>
        <section className='mdc-card__primary'>
            <h1 className='mdc-card__title mdc-card__title--large'>Poisoning simulator</h1>
        </section>

        <section className='mdc-card__supporting-text'>
            Helps with testing whether the app is configured and working properly.
            Sends 2 gratuitous ARP replies from and to a current device.
            Target and sender IP is the IPv4 of the current device.
            Target MAC is 0a:00:00:NN:NN:00 where NN will be different on each reply.
        </section>

        <section className='mdc-card__actions'>
            <button
                className='mdc-button mdc-button--compact mdc-card__action'
                onClick={onPoison}
            >Poison now</button>
            <button
                className='mdc-button mdc-button--compact mdc-card__action'
                onClick={onPlanPoisoning}
            >Plan poisoning in 10 seconds</button>
        </section>
    </div>
  );
};

export default Poisoning;
