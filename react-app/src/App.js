import React from 'react';
import Menu from './modules/Menu'
import Mymap from './modules/Mymap'

class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
        mode: 'finder',
        building: 'WALC',
        floor: '0',
        findRoomId: '',
        sourceRoomId: '',
        marker: {position: [], floor: '0'},
        routeLine:  {},
        mapBounds: [[0, 1651], [976, 0]]
    }

    this.handleChangeFloor = this.handleChangeFloor.bind(this)
    this.validateId = this.validateId.bind(this)
    this.handleChangeFinder = this.handleChangeFinder.bind(this)
    this.handleSubmitFinder = this.handleSubmitFinder.bind(this)
    this.handleChangeRouterSource = this.handleChangeRouterSource.bind(this)
    this.handleEndModeRouter = this.handleEndModeRouter.bind(this)
    this.handleSubmitRouter = this.handleSubmitRouter.bind(this)
  }

  handleChangeFloor(x) {
    this.setState({floor: x})
  }

  validateId(id) {

    let allNodes = require('./json/' + this.state.building + '.json')[1]
    return (typeof id === 'string' && id in allNodes)
  }

  handleChangeFinder(event) {
    this.setState({
      findRoomId: event.target.value.split('').map(x => typeof x == 'string' ? x.toUpperCase() : x).join(''),
      marker: {position: [], floor: '0'},
      mode: (this.state.mode === 'router' ? 'router' : 'finder')
    })
  }

  handleSubmitFinder(event) {
    if(this.state.mode === 'found') 
      this.setState({mode: 'router'})
    else if(this.state.mode === 'router')
      this.handleSubmitRouter(event)
    else if(!this.validateId(this.state.findRoomId))
      alert('Please input valid room number')
    else{
      let allNodes = require('./json/' + this.state.building + '.json')[1]
      this.setState({
        marker: {
          position: [allNodes[this.state.findRoomId].lat, allNodes[this.state.findRoomId].lon],
          floor: allNodes[this.state.findRoomId].floor
        },
        floor: allNodes[this.state.findRoomId].floor,
        mode: 'found'
      })
    }
    event.preventDefault()
  }

  handleChangeRouterSource(event) {
    this.setState({sourceRoomId: event.target.value.split('').map(x => typeof x == 'string' ? x.toUpperCase() : x).join('')})
  }

  handleEndModeRouter(event) {
    this.setState({mode: 'finder', sourceRoomId: '', routeLine: {}})
    event.preventDefault()
  }

  handleSubmitRouter(event) {
    if(!this.validateId(this.state.sourceRoomId))
      alert('Please input valid source room number')
    else if(!this.validateId(this.state.findRoomId))
      alert('Please input valid destination room number')
    else {
      let allNodes = require('./json/' + this.state.building + '.json')[1]

      for(let i in allNodes) {
        allNodes[i].isVisited = false
        allNodes[i].from = ''
      }

      for(let i in allNodes)
        for(let j in allNodes[i].adj)
          if(!allNodes[allNodes[i].adj[j]].adj.includes(i))
            allNodes[allNodes[i].adj[j]].adj.push(i)

      let consideringNodes = [this.state.sourceRoomId]

      while(consideringNodes.length > 0) {
        let currentNode = consideringNodes.shift()
        if(allNodes[currentNode].isVisited)
          continue
        allNodes[currentNode].isVisited = true

        if(currentNode === this.state.findRoomId) {
          let routeLine = {}
          let allFloors = (require('./json/' + this.state.building + '.json')[0]).floors

          for(let i in allFloors)
            routeLine[allFloors[i]] = []

          while(true) {
            routeLine[allNodes[currentNode].floor].push([allNodes[currentNode].lat, allNodes[currentNode].lon]) 
            if(currentNode === this.state.sourceRoomId)
              break 
            currentNode = allNodes[currentNode].from
          }
          this.setState({
            routeLine: routeLine, 
            floor: allNodes[currentNode].floor,
            marker: {position: [allNodes[this.state.findRoomId].lat, allNodes[this.state.findRoomId].lon], 
              floor: allNodes[this.state.findRoomId].floor}
          })
          break
        }

        for(let i in allNodes[currentNode].adj)
          if(!allNodes[allNodes[currentNode].adj[i]].isVisited) {
            allNodes[allNodes[currentNode].adj[i]].from = currentNode
            consideringNodes.push(allNodes[currentNode].adj[i])
          }
      }
    }
    event.preventDefault()
  }

  render() {
    return (
      <div className='App'>
        <Menu 
          mode={this.state.mode}

          building={this.state.building}
          floor={this.state.floor}
          allFloors={(require('./json/' + this.state.building + '.json')[0]).floors}
          handleChangeFloor={this.handleChangeFloor}

          sourceRoomId={this.state.sourceRoomId}
          handleChangeRouterSource={this.handleChangeRouterSource}
          handleEndModeRouter={this.handleEndModeRouter}

          findRoomId={this.state.findRoomId}
          handleChangeFinder={this.handleChangeFinder}
          handleSubmitFinder={this.handleSubmitFinder}
        />
        <Mymap 
          mapBounds={this.state.mapBounds} 
          imageUrl={require('./img/' + this.state.building + '/' + this.state.floor + '.jpg')} 
          imageBounds={[[this.state.mapBounds[1][0],0], [0, this.state.mapBounds[0][1]]]}
          marker={this.state.marker.floor === this.state.floor ? this.state.marker : {position: [], floor: this.state.marker.floor}}
          routeLine={typeof this.state.routeLine[this.state.floor] == 'undefined' ? [] : this.state.routeLine[this.state.floor]}
        />
      </div>
    );
  }
}

export default App;
