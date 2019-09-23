import React from 'react';
import Header from './Header'
import Building from './Building'
import Floor from './Floor'
import Finder from './Finder'
import Emergency from './Emergency'
import Footer from './Footer'
import '../styles/menu.css';

class Menu extends React.Component {

    render() {
        return (
            <div id='menu'>
                <Header />
                <div id='controller'>
                    <Building
                        building={this.props.building}
                    />
                    <Floor
                        floor={this.props.floor}
                        allFloors={this.props.allFloors}
                        handleChangeFloor={this.props.handleChangeFloor}
                    />
                    <Finder 

                        handleChangeFloor={this.props.handleChangeFloor}
                        mode={this.props.mode}
                        floor={this.props.floor}

                        sourceRoomId={this.props.sourceRoomId}
                        handleChangeRouterSource={this.props.handleChangeRouterSource}
                        handleEndModeRouter={this.props.handleEndModeRouter}

                        findRoomId={this.props.findRoomId}
                        handleChangeFinder={this.props.handleChangeFinder}
                        handleSubmitFinder={this.props.handleSubmitFinder}
                    />
                    <Emergency />
                </div>
                <Footer />
            </div>)
    }
}

export default Menu