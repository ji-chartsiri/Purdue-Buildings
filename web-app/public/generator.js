/*
TODO
fix map start pos and drag issues
change image scale slider/resolution selector

error message/page if js not loaded

edit data
delete node

snap nodes to form loops?
ctrl-z

*/



//Map Screen
var mapImg = document.getElementById("mapImg");

//Node Info Column
var fileInput = document.getElementById("file_input");
var node_id = document.getElementById("node_id");
var node_lat = document.getElementById("node_lat");
var node_lon = document.getElementById("node_lon");
var node_floor = document.getElementById("node_floor");
var node_adj = document.getElementById("node_adj");
var node_parent = document.getElementById("node_parent");


var nodesMap = new Map();

var currentNode = null;
var currentCircle;

//Map layers
var map;
var circlesLayer;
var linesLayer;

//Map layer colors
const mapColors = {
    CIRCLE: 'red',
    LINE: 'red',
    CURRENT_CIRCLE: 'blue',
    HOVER_CIRCLE: 'green'
}


fileInput.addEventListener('change', handleFileChange);
document.getElementById("show_nodes").addEventListener("click", handleShowNodes)
document.getElementById("delete_node_button").addEventListener("click", deleteEverything());

function handleFileChange() {
    const file = this.files[0];
    loadMap(file);
}

function loadMap(file) {

    //bounds are weird and not user friendly at all
    // var southWest = L.latLng(0, 750);
    // var northEast = L.latLng(750, 0);
    var bounds = L.latLngBounds(0, 0);
    map = L.map('map', {
        maxBounds: bounds,
        maxZoom: 5,
        minZoom: -1,
        crs: L.CRS.Simple
    }).setView([0, 0], 1);

    //Set up map image
    var imageUrl = URL.createObjectURL(file);
    var imageBounds = [[500, 0], [0, 750]];
    L.imageOverlay(imageUrl, imageBounds).addTo(map);

    //Setup interactable layers
    circlesLayer = L.featureGroup().addTo(map);
    linesLayer = L.featureGroup().addTo(map);
    setUpCircleListeners();

    map.on('contextmenu',
        function (e) {
            console.log("map click");

            var coord = convertLatLng(e);

            if (currentNode != null) {
                var coords = [
                    [currentNode.lat, currentNode.lon],
                    [coord[0], coord[1]]
                ]

                var line = L.polyline(coords, { color: mapColors.LINE }).addTo(linesLayer);
                currentNode.startLine = line;
            }
            var circleOptions = {
                color: mapColors.CURRENT_CIRCLE,
                fillColor: 'f03',
                fillOpacity: 0,
                bubblingMouseEvents: false,

            }

            //Reset color of previous node
            if (currentCircle != null) {
                currentCircle.setStyle({ color: mapColors.CIRCLE });
            }

            //Update current circle/node reference

            currentCircle = L.circle(e.latlng, 2, circleOptions).addTo(circlesLayer);

            //If previous node exists, draw line, else defaults to null
            if(currentNode!=null){
                currentNode = createChildNode(coord[0], coord[1], null, null, null, line);
            }else{
                currentNode = createChildNode(coord[0], coord[1]);
            }


            nodesMap.set(currentCircle, currentNode);

            updateNodeInfoColumn(currentNode);

        })

    //map.setMaxBounds(new L.LatLngBounds([0, 1500], [1500, 0]))

}

function convertLatLng(e){
    var coordArray = e.latlng.toString().split(',');
    var lat = coordArray[0].split('(')[1];
    var lng = coordArray[1].split(')')[0];
    return [lat,lng];
}

function setUpCircleListeners() {
    circlesLayer.on({
        //Handle node selection highlighting
        mouseover:function (event) {
            var selection = event.layer;
            selection.setStyle({ color: mapColors.HOVER_CIRCLE });
        },
        mouseout:function (event) {
            var selection = event.layer;
            let nodeColor = selection == currentCircle ? mapColors.CURRENT_CIRCLE : mapColors.CIRCLE;
            selection.setStyle({ color: nodeColor })
        },

        //Handle node selection
        click:function (event) {
            var selection = event.layer;
    
            if (currentCircle != null) {
                currentCircle.setStyle({ color: mapColors.CIRCLE });
            }
            currentCircle = selection;
            currentNode = nodesMap.get(currentCircle);
            updateNodeInfoColumn(currentNode);
            //console.log(selection);
        },

        //Handle node dragging
        mousedown: function (event) {
            var selection = event.layer;
            map.on("mousemove", function (e) {
                selection.setLatLng(e.latlng);

                node = nodesMap.get(selection);
                let coord = convertLatLng(e);
                node.lat = coord[0];
                node.lon = coord[1];
            });
            map.dragging.disable();
        },

        ///TODOD ODSFI AFASDF
        mouseup: function(event){
            console.log("mouseup");
            map.removeEventListener("mousemove");
            map.dragging.enable();

            //Redraw lines
            var selection = event.layer;
            var node = nodesMap.get(selection);

            if(node.startLine!=null){
                var coordsArray = node.startLine.getLatLngs();
                var startCoords = L.latLng(node.lat, node.lon);
                var endCoords = coordsArray[1];

                node.startLine.setLatLngs([startCoords, endCoords]);
            }
            if(node.endLine!=null){
                var coordsArray = node.endLine.getLatLngs();
                var startCoords = coordsArray[0];
                var endCoords = L.latLng(node.lat, node.lon);

                node.endLine.setLatLngs([startCoords, endCoords]);
            }
        },
    });
}

function deleteEverything() {
    //TODO
}



function createChildNode(lat, lon, floor, adj, id, endLine) {
    if (floor == null) {
        floor = 0;
    }
    if (id == null) {
        id = "test" + lat.toString() + lon.toString();
    }
    var newNode = new Node(lat, lon, currentNode, floor, [], id, null, endLine);

    if (currentNode != null) {
        currentNode.adj.push(newNode);
    }
    return newNode;
}

function updateNodeInfoColumn(node) {
    node_id.innerHTML = node.id;
    node_lat.innerHTML = node.lat;
    node_lon.innerHTML = node.lon;
    node_floor.innerHTML = node.floor;
    node_adj.innerHTML = node.adj;
    node_parent.innerHTML = node.parentNode;
}

function handleShowNodes() {
    nodesMap.forEach(node => node.getJson());
}

class Node {
    constructor(lat, lon, parentNode, floor, adj, id, startLine, endLine) {
        this.lat = lat;
        this.lon = lon;
        this.parentNode = parentNode;
        this.floor = floor;
        this.adj = adj;
        this.id = id;
        this.startLine = startLine;
        this.endLine = endLine;
    }

    toString() {
        return '"' + this.id + '"';
    }
    getJson() {
        console.log("\t" + '"' + this.id + '"' + ": {")
        console.log('\t"lat":' + this.lat + ',')
        console.log('\t"lon": ' + this.lon + ',')
        console.log('\t"floor": ' + this.floor + ',')
        console.log('\t"adj": ' + this.adj)
        console.log("}, ")
    }
}
