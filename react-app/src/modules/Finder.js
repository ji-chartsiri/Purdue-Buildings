import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faDirections, faTimes } from '@fortawesome/free-solid-svg-icons'

class Finder extends React.Component {

    render() {
        return (
            <form id='finder'>
                {this.props.mode === 'router' && 
                    <>
                        <input 
                            type='text' 
                            id='routerSourceInput' 
                            placeholder='Input Source Room Number'
                            value={this.props.sourceRoomId} 
                            onChange={this.props.handleChangeRouterSource}
                        />
                        <button 
                            type='button'
                            id='routerCancel' 
                            onClick={this.props.handleEndModeRouter}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </>
                }
                <input 
                    type='text' 
                    id='finderInput' 
                    placeholder='Input Room Number'
                    value={this.props.findRoomId} 
                    onChange={this.props.handleChangeFinder}
                />
                <button
                    type='submit' 
                    id='finderSubmit' 
                    onClick={this.props.handleSubmitFinder}
                >{
                    <FontAwesomeIcon icon={(this.props.mode === 'finder') ? faSearch : faDirections} />
                }
                </button>
            </form>)
    }
}

export default Finder