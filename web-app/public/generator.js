/*
TODO
fix map start pos and drag issues
change image scale slider/resolution selector

delete node

extract styling, colors etc

adding parentNodes with visual ui
*/

/*
Holy father who art in heaven, forgive me for the sin I am about to commit
To the poor individual who must understand this code, may you rest in peace
 - Kyle Zheng, 2019

NODE objects are nodes in a graph/map
CIRCLES are visual representation of NODES
LINES are visual representation of adjacent nodes
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

//CIRCLES are keys, NODES are values
var nodesMap = new Map();

//Global references
var currentNode = null;
var currentCircle;

//Map layers
var map;
var circlesLayer;
var linesLayer;

//Map layer colors
const MAP_COLORS = {
    CIRCLE: 'red',
    LINE: 'red',
    CURRENT_CIRCLE: 'blue',
    HOVER_CIRCLE: 'green'
}

//Styling for circles (nodes)
const CIRCLE_OPTIONS = {
    color: MAP_COLORS.CURRENT_CIRCLE,
    fillColor: 'f03',
    fillOpacity: 1,
    //opacity:0,
    bubblingMouseEvents: false,
}

//TODO put this in HTML file
fileInput.addEventListener('change', handleFileChange);
document.getElementById("show_nodes").addEventListener("click", handleShowNodes)
document.getElementById("delete_node_button").addEventListener("click", deleteEverything());

function handleFileChange() {
    const file = this.files[0];
    loadMap(file);
}

function loadMap(file) {
    map = L.map('map', {
        maxZoom: 5,
        minZoom: -2,
        crs: L.CRS.Simple
    });

    //Leaflet only accepts image URLs
    var imageUrl = URL.createObjectURL(file);

    //Find image dimensions
    var img = new Image();
    img.onload = function () {
        //Make image correct aspect ratio
        let imageBounds = [[0, 0], [this.height, this.width]];
        L.imageOverlay(imageUrl, imageBounds).addTo(map);

        //Centers image
        map.setView([this.height/2, this.width/2],1);
        //Adds equal bounds around image
        map.setMaxBounds([[-this.height/2,-this.width/2],[this.height*1.5,this.width*1.5]]);
    };
    //Compatability with old and new browsers
    if ('srcObject' in img) {
        img.srcObject = file;
    } else {
        img.src = imageUrl;
    }

    //Setup interactable layers
    circlesLayer = L.featureGroup().addTo(map);
    linesLayer = L.featureGroup().addTo(map);

    //Adds all node functionality for EXISTING circles
    setUpCircleListeners();

    //Controls creating NEW nodes and NEW connections
    //Uses 'contextmenu' because only map can detect RIGHT CLICKS
    map.on('contextmenu',
        function (e) {

            var coord = convertLatLng(e);

            //Create connection to previous node if exists
            if (currentNode != null) {
                var coords = [
                    [currentNode.lat, currentNode.lon],
                    [coord[0], coord[1]]
                ]

                var line = L.polyline(coords, { color: MAP_COLORS.LINE, weight: 1 }).addTo(linesLayer);
                currentNode.startLine.push(line);
            }

            //Reset color of previous node
            if (currentCircle != null) {
                currentCircle.setStyle({ color: MAP_COLORS.CIRCLE });
            }

            //Update current circle/node reference

            currentCircle = L.circle(e.latlng, 2, CIRCLE_OPTIONS).addTo(circlesLayer);

            //If previous node exists, draw line, else defaults to null
            if (currentNode != null) {
                currentNode = createChildNode(coord[0], coord[1], null, null, null, line);
            } else {
                currentNode = createChildNode(coord[0], coord[1]);
            }
            nodesMap.set(currentCircle, currentNode);
            updateNodeInfoColumn(currentNode);
        })
}

function convertLatLng(e) {
    var coordArray = e.latlng.toString().split(',');
    var lat = coordArray[0].split('(')[1];
    var lng = coordArray[1].split(')')[0];
    return [lat, lng];
}

//Various onClickListeners for CIRCLES
//CIRCLES can't detect right click events
function setUpCircleListeners() {
    circlesLayer.on({
        //Handle node selection highlighting
        mouseover: function (event) {
            var selection = event.layer;
            selection.setStyle({ color: MAP_COLORS.HOVER_CIRCLE });
        },
        mouseout: function (event) {
            var selection = event.layer;
            let nodeColor = selection == currentCircle ? MAP_COLORS.CURRENT_CIRCLE : MAP_COLORS.CIRCLE;
            selection.setStyle({ color: nodeColor });
        },

        mousedown: function (event) {
            var selection = event.layer;

            //Handles node selection
            if (currentCircle != null) {
                currentCircle.setStyle({ color: MAP_COLORS.CIRCLE });
            }
            currentCircle = selection;
            currentNode = nodesMap.get(currentCircle);
            updateNodeInfoColumn(currentNode);

            //Handle node dragging
            map.on("mousemove", function (e) {
                selection.setLatLng(e.latlng);

                node = nodesMap.get(selection);
                let coord = convertLatLng(e);
                node.lat = coord[0];
                node.lon = coord[1];
            });
            map.dragging.disable();
        },

        mouseup: function (event) {
            map.removeEventListener("mousemove");
            map.dragging.enable();

            //Redraw lines
            var selection = event.layer;
            var node = nodesMap.get(selection);

            if (node.startLine.length > 0) {
                node.startLine.forEach(
                    function (line) {
                        var coordsArray = line.getLatLngs();
                        var startCoords = L.latLng(node.lat, node.lon);
                        var endCoords = coordsArray[1];
                        line.setLatLngs([startCoords, endCoords]);
                    }
                );
            }
            if (node.endLine.length > 0) {
                node.endLine.forEach(
                    function (line) {
                        var coordsArray = line.getLatLngs();
                        var startCoords = coordsArray[0];
                        var endCoords = L.latLng(node.lat, node.lon);

                        line.setLatLngs([startCoords, endCoords]);
                    }
                );
            }
        },
    });
}

function deleteEverything() {
    //TODO
}


//TODO
function createChildNode(lat, lon, floor, adj, id, endLine) {
    if (floor == null) {
        floor = 0;
    }
    if (id == null) {
        id = "test" + lat.toString() + lon.toString();
    }
    var newNode = new Node(lat, lon, [], floor, [], id, [], []);

    if (endLine != null) {
        newNode.endLine.push(endLine)
    }
    if (currentNode != null) {
        newNode.parentNodes.push(currentNode);
        currentNode.adj.push(newNode);
    }
    return newNode;
}

function updateNodeInfo() {
    let oldId = currentNode.id;
    currentNode.id = node_id.value;
    currentNode.lat = node_lat.value;
    currentNode.lon = node_lon.value;
    currentNode.floor = node_floor.value;

    //Rename node in all parent nodes
    currentNode.parentNodes.forEach(
        function (parentNode) {
            let index = parentNode.adj.indexOf(oldId);
            parentNode.adj[index] = currentNode.id;
        }
    );
    ////Update all LINES starting from updated NODE
    currentCircle.setLatLng([currentNode.lat, currentNode.lon]);
    if (currentNode.startLine.length > 0) {
        currentNode.startLine.forEach(
            function (line) {
                var coordsArray = line.getLatLngs();
                var startCoords = L.latLng(currentNode.lat, currentNode.lon);
                var endCoords = coordsArray[1];
                line.setLatLngs([startCoords, endCoords]);
            }
        );
    }
    //Update all LINES ending at updated NODE
    if (currentNode.endLine.length > 0) {
        currentNode.endLine.forEach(
            function (line) {
                var coordsArray = line.getLatLngs();
                var startCoords = coordsArray[0];
                var endCoords = L.latLng(currentNode.lat, currentNode.lon);
                line.setLatLngs([startCoords, endCoords]);
            }
        );
    }
}

function updateNodeInfoColumn(node) {
    node_id.value = node.id;
    node_lat.value = node.lat;
    node_lon.value = node.lon;
    node_floor.value = node.floor;
    node_adj.innerHTML = node.adj;
    node_parent.innerHTML = node.parentNodes;
}

function handleShowNodes() {
    nodesMap.forEach(node => node.getJson());
}

class Node {
    constructor(lat, lon, parentNodes, floor, adj, id, startLine, endLine) {
        this.lat = lat;
        this.lon = lon;
        this.parentNodes = parentNodes;
        this.floor = floor;
        this.adj = adj;
        this.id = id;
        this.startLine = startLine;
        this.endLine = endLine;
    }

    toString() {
        return '"' + this.id + '"';
    }

    //TODO replace with write to file
    getJson() {
        console.log("\t" + '"' + this.id + '"' + ": {")
        console.log('\t"lat":' + this.lat + ',')
        console.log('\t"lon": ' + this.lon + ',')
        console.log('\t"floor": ' + this.floor + ',')
        console.log('\t"adj": ' + this.adj)
        console.log("}, ")
    }
}
