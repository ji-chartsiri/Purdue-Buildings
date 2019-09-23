import React from 'react'

class Floor extends React.Component {

    render() {
        return (
            <form id='floor'>
                <ul>
                    {this.props.allFloors.map(x => (
                    <li key={x}>
                        <span 
                            className={'floorButton ' + (String(x) === String(this.props.floor) ? 'checkedFloor' : 'uncheckedFloor')}
                            onClick={() => { this.props.handleChangeFloor(x)}}
                        >
                            {x}
                        </span>
                    </li>))}
                </ul>
            </form>)
    }
}

export default Floor