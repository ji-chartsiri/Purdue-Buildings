import React from 'react';
import logo from '../img/logo.png'

class Header extends React.Component {

    render() {
        return (
            <header>
                <img src={logo} alt='logo'/>
                <div id='name'>
                    Purdue Building
                </div>
            </header>)
    }
}

export default Header