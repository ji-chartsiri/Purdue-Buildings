/*
TODO
fix map start pos and drag issues
current node marker
change image scale slider/resolution selector

error message/page if js not loaded

select mode
    changes current node
    edit data
    delete node

draw mode
    drag nodes -change pos
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
    var map = L.map('map', {
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
            var coord = e.latlng.toString().split(',');
            var lat = coord[0].split('(');
            var lng = coord[1].split(')');


            if (currentNode != null) {
                var coords = [
                    [currentNode.lat, currentNode.lon],
                    [lat[1], lng[0]]
                ]

                var lines = L.polyline(coords, { color: mapColors.LINE }).addTo(linesLayer);
            }
            var circleOptions = {
                color: mapColors.CURRENT_CIRCLE,
                fillColor: 'f03',
                fillOpacity: 0,
                bubblingMouseEvents: false
            }




            //Reset color of previous node
            if (currentCircle != null) {
                currentCircle.setStyle({ color: mapColors.CIRCLE });
            }

            //Update current circle/node reference
            currentCircle = L.circle(e.latlng, 2, circleOptions).addTo(circlesLayer);
            currentNode = createChildNode(lat[1], lng[0]);

            nodesMap.set(currentCircle, currentNode);

            updateNodeInfoColumn(currentNode);

        })

    //map.setMaxBounds(new L.LatLngBounds([0, 1500], [1500, 0]))

}

function setUpCircleListeners() {
    circlesLayer.on("click", function (event) {
        var selection = event.layer;

        if (currentCircle != null) {
            currentCircle.setStyle({ color: mapColors.CIRCLE });
        }

        currentCircle = selection;
        currentNode = nodesMap.get(currentCircle);

        console.log(selection);
    });

    circlesLayer.on("mouseover", function (event) {
        var selection = event.layer;
        selection.setStyle({ color: mapColors.HOVER_CIRCLE });
    });

    circlesLayer.on("mouseout", function (event) {
        var selection = event.layer;
        let nodeColor = selection == currentCircle ? mapColors.CURRENT_CIRCLE : mapColors.CIRCLE;
        selection.setStyle({ color: nodeColor })
    });
}

function deleteEverything() {

}



function createChildNode(lat, lon, floor, adj, id) {

    if (floor == null) {
        floor = 0;
    }
    if (id == null) {
        id = "test" + lat.toString() + lon.toString();
    }

    var newNode = new Node(lat, lon, currentNode, floor, [], id);

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
    constructor(lat, lon, parentNode, floor, adj, id) {
        this.lat = lat;
        this.lon = lon;
        this.parentNode = parentNode;
        this.floor = floor;
        this.adj = adj;
        this.id = id;
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
