/**
 * Devices list stateless UI component
 */
import React = require('react');

import Capturer from './Capturer';
import Checkbox from './Checkbox';
import { IState } from './State';

interface IProps {
    currentDevice: string;
    onToggle(id: string): void;
}

const Devices: React.SFC<IProps> = ({ currentDevice, onToggle }: IProps): React.ReactElement<IProps> => {
    const devices = Capturer.getDevices();
    const devicesList = devices.map((inf) => {
        const onToggleCallback = () => {
            onToggle(inf.id);
        };
        const isChecked = inf.id === currentDevice;

        return (
            <li className='mdc-list-item' key={ inf.id }>
                <span className='mdc-list-item__text'>
                  { inf.name }
                  <span className='mdc-list-item__text__secondary'>{ inf.id }</span>
                  <span className='mdc-list-item__text__secondary'>Addresses: { inf.addresses.join(', ') }</span>
                </span>
                <span className='mdc-list-item__end-detail grey-bg'>
                    <Checkbox checked={ isChecked } onToggle={ onToggleCallback } />
                </span>
            </li>
        );
    });

    return (
        <div className='mdc-card devices-card'>
            <section className='mdc-card__primary'>
                <h1 className='mdc-card__title mdc-card__title--large'>Devices</h1>

                <ul className='mdc-list'>
                    { devicesList }
                </ul>
            </section>
        </div>
    );
};

export default Devices;
