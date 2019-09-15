
async function main() {
  //begin initialize value
  var allRooms = (await $.getJSON('json/allRooms.json'))[0];

  var lowerLevelImage = L.imageOverlay('img/lowerLevel.jpg', [[450,0], [0,600]]);
  var lowerLevelLayer = L.layerGroup([lowerLevelImage]);
  var firstFloorImage = L.imageOverlay('img/firstFloor.jpg', [[450,0], [0,600]]);
  var firstFloorLayer = L.layerGroup([firstFloorImage]);
  var secondFloorImage = L.imageOverlay('img/secondFloor.jpg', [[450,0], [0,600]]);
  var secondFloorLayer = L.layerGroup([secondFloorImage]);
  var thirdFloorImage = L.imageOverlay('img/thirdFloor.jpg', [[450,0], [0,600]]);
  var thirdFloorLayer = L.layerGroup([thirdFloorImage]);

  var allLayers = [lowerLevelLayer, firstFloorLayer, secondFloorLayer, thirdFloorLayer];
  var currentLayer = 3;

  var emergencyIsToggled = false;
  //end initialize value
  
  //begin setup map
  var mymap = L.map('mapid', {
    maxZoom: 24,
    minZoom: 1,
    crs: L.CRS.Simple,
    layers: [thirdFloorLayer]
  }).setView([0, 0], 1);
  mymap.setMaxBounds(new L.LatLngBounds([0,1000], [500,0]));

  var currentMarkerLocation = [-100, -100];
  var currentMarker = L.marker(currentMarkerLocation).addTo(mymap);
  var currentMarkerFloor = 3;
  var allPoints = [[], [], [], []]
  var routeLine = L.polyline([[-100, -100], [-99, -99]], {color: 'red'}).addTo(mymap);
  //end setup map

  //begin debugger
  /*
  var marker = L.marker([-100, -100]).addTo(mymap);
  mymap.on('click', function(e) {
    alert('You clicked the map at ' + e.latlng);
    mymap.removeLayer(marker);
    marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(mymap);
  });
  
  for(let i in allRooms) {
    console.log('Test');
    if(allRooms[i].floor == 1) {
      for(let j in allRooms[i].adj)
        L.polyline([[allRooms[allRooms[i].adj[j]].lat, allRooms[allRooms[i].adj[j]].lon], [allRooms[i].lat, allRooms[i].lon]], {color: 'red'}).addTo(mymap)
      mymap.openTooltip(i, [allRooms[i].lat, allRooms[i].lon]);
    }
  }
  */
  //end debugger

  //begin floor change handler
  function floorChangeHandler() {
    let nowFloor = parseInt($(this).val());
    mymap.removeLayer(allLayers[currentLayer]);
    currentLayer = nowFloor;
    mymap.addLayer(allLayers[currentLayer]);
    
    if(currentMarkerFloor!=nowFloor)
      mymap.removeLayer(currentMarker);
    else
      currentMarker = L.marker(currentMarkerLocation).addTo(mymap);

    mymap.removeLayer(routeLine);
    if(allPoints[currentLayer].length == 1)
      routeLine = L.circle(allPoints[currentLayer][0], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 1,
        radius: 2
      }).addTo(mymap);
    else
      routeLine = L.polyline(allPoints[currentLayer], {color: 'red', weight: 5}).addTo(mymap);
  }
  $(document).on('change', '[name="floor"]', floorChangeHandler);
  //end floor change handler

  //begin emergency check
  function emergencyButtonToggle(event) {
    emergencyIsToggled = !emergencyIsToggled;
    if(emergencyIsToggled) {
      $('#menu').css('background-color', '#bf0000');
      $('#menu').css('color', 'white');
      $('#menuHeader').css('background-color', '#800000');
      $('#mainForm').css('display', 'none');
      $('#destinationId').css('display', 'none');
      $('#currentId').css('width', '100%');
      $('#currentId').attr("placeholder", 'Type Your Room Number!');
      $('#routeSubmit').val('Generate the Escape Route!');
      $('#routeSubmit').css('width', '100%');
      $('#routeSubmit').css('margin-left', '0');
      $('#routeSubmit').css('margin-right', '0');
      $('#mobileHeader').css('background-color', '#800000');
      $('#emergencyButton').html('End Emergency Mode');
      $('#footer').css('display', 'none');
    }
    else {
      $('#menu').css('background-color', '');
      $('#menu').css('color', 'black');
      $('#menuHeader').css('background-color', '');
      $('#mainForm').css('display', '');
      $('#destinationId').css('display', '');
      $('#currentId').css('width', '');
      $("#currentId").attr("placeholder", "Current Room#");
      $('#routeSubmit').val('Navigate');
      $('#routeSubmit').css('width', '');
      $('#routeSubmit').css('margin-left', '');
      $('#routeSubmit').css('margin-right', '');
      $('#mobileHeader').css('background-color', '');
      $('#emergencyButton').html('<h3><b>Emergency Mode</b></h3> In Case of Fire, Click Here!');
      $('#footer').css('display', '');
    }
  }
  $('#emergencyButton').click(emergencyButtonToggle);
  //end emergency check

  //begin query string check
  let params = (new URL(document.location)).searchParams;
  let queryFloor = params.get('floor');
  let queryEmergency = params.get('isEmergency');

  if(typeof queryFloor == 'string' && queryFloor != '') {
    $('input:radio[value='+queryFloor+']')[0].checked = true;
    floorChangeHandler.apply($('input:radio[value='+queryFloor+']')[0])
  }

  if(typeof queryEmergency == 'string' && queryEmergency == 'true')
    emergencyButtonToggle();
  //end query string check

  //begin mainSubmit
  $('#mainSubmit').click(function(event) {
    let roomId = $('#roomId').val();

    if(typeof roomId[0] == 'undefined') {
      alert('Please input valid room id');
      return false;
    }
    if(roomId[0] == 'b')
      roomId = roomId.replace('b', 'B');
    if((typeof allRooms[roomId] == 'undefined')) { //|| (roomId[0] == '_')) {
      alert('Please input valid room id');
      return false;
    }

    let room = allRooms[roomId];
    room.floor = parseInt(room.floor);
    currentMarkerFloor = room.floor;
    currentMarkerLocation = [room.lat, room.lon];

    if(room.floor != currentLayer)
    {
      $('input:radio[value='+room.floor+']')[0].checked = true;
      floorChangeHandler.apply($('input:radio[value='+room.floor+']')[0])
    }
    mymap.removeLayer(currentMarker);
    currentMarker = L.marker([room.lat, room.lon]).addTo(mymap)
    
      event.preventDefault();
  })
  //end mainSubmit

  //begin routeSubmit
  $('#routeSubmit').click(function(event) {
    
    let source = $('#currentId').val();

    if(typeof source == 'undefined' || source == '' ) {
      alert('Please input valid current room number');
      event.preventDefault();
      return false;
    }
    if(source[0] == 'b')
      source = source.replace('b', 'B');
    if(typeof allRooms[source] == 'undefined') {
      alert('Please input valid current room number*');
      event.preventDefault();
      return false;
    }

    let destination
    if(!emergencyIsToggled) {
      destination = $('#destinationId').val();
      if(typeof destination == 'undefined' || destination == '') {
        alert('Please input valid destination room number');
        event.preventDefault();
        return false;
      }
      if(destination[0] == 'b')
        destination = destination.replace('b', 'B');
      if(typeof allRooms[destination] == 'undefined') {
        alert('Please input valid destination room number');
        event.preventDefault();
        return false;
      }
    }
    else
      destination = -1;
    
    let sourceRoom = allRooms[source];

    if(sourceRoom.floor != currentLayer)
    {
      $('input:radio[value='+sourceRoom.floor+']')[0].checked = true;
      floorChangeHandler.apply($('input:radio[value='+sourceRoom.floor+']')[0])
    }

    let allNodes = {};
    let allPath = [];
    let consideringNode = [];

    for(let i in allRooms)
    {
      allNodes[i] = Object.assign({isVisited: false, from: ''}, allRooms[i]);
        
      for(let j in allRooms[i].adj)
        allPath.push([i, allRooms[i].adj[j]]); 
    }
    
    for(let i in allPath)
      allNodes[allPath[parseInt(i)][1]].adj.push(allPath[parseInt(i)][0]);

    consideringNode.push(source);

    while(true) {
      let thisNode = consideringNode.shift();

      if((destination == -1 && (thisNode == 'ex1' || thisNode == 'ex2' || thisNode == 'ex3' || thisNode == 'ex4')) || thisNode == destination) {
        allPoints = [[], [], [], []];
        mymap.removeLayer(routeLine);

        let currentPoint = thisNode;
        while(currentPoint != source) {
          allPoints[allNodes[currentPoint].floor].push([allNodes[currentPoint].lat, allNodes[currentPoint].lon]);
          currentPoint = allNodes[currentPoint].from;
        }
        allPoints[allNodes[source].floor].push([allNodes[source].lat, allNodes[source].lon]);

        if(allPoints[currentLayer].length == 1)
          routeLine = L.circle(allPoints[currentLayer][0], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 1,
            radius: 2
          }).addTo(mymap);
        else
          routeLine = L.polyline(allPoints[currentLayer], {color: 'red', weight: 5}).addTo(mymap);

        event.preventDefault();
        return false;
      }
      
      if(allNodes[thisNode].isVisited)
        continue;
        allNodes[thisNode].isVisited = true;
      
      for(let i in allNodes[thisNode].adj) {
        if(allNodes[allNodes[thisNode].adj[i]].isVisited)
          continue;
        allNodes[allNodes[thisNode].adj[i]].from = thisNode;
        consideringNode.push(allNodes[thisNode].adj[i]);
      }
    }
  })
  //end routeSubmit
}
document.addEventListener('DOMContentLoaded', main);
