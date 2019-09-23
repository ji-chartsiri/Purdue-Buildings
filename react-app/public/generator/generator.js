/*
FUTURE GOALS
highlight all nodes to be deleted and use confirm dialog
*/

/*
Map Data Generator v1.0.0

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
var add_parent_input = document.getElementById("add_parent_input");
//CIRCLES are keys, NODES are values
var nodesMap = new Map();

//Global references
var map;
var currentNode = null;
var currentCircle;

//Map layers
var circlesLayer;
var linesLayer;

const NODE_BUTTON_CLASS_NAME = 'nodeListButton'
//Map layer colors
const MAP_COLORS = {
    CIRCLE: 'orange',
    // LINE: 'orange',
    CURRENT_CIRCLE: 'red',
    HOVER_CIRCLE: 'yellow',
    LINE_START: 'navy',
    LINE_END: 'cyan',
}

//Styling for circles (nodes)
const CIRCLE_OPTIONS = {
    //color: 'black',
    //opacity:0,
    fillColor: MAP_COLORS.CURRENT_CIRCLE,
    fillOpacity: 1,
    bubblingMouseEvents: false,
}

const ALERT_MESSAGES={
    ID_DNE : "Please enter a valid node ID",
    PARENT_ID : "This node is already a parent",
    CHILD_ID :"This node's child cannot be its parent",
    SELF_ID: "Node cannot be own parent"
}

fileInput.addEventListener('change', handleFileChange);

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
        map.setView([this.height / 2, this.width / 2], 1);
        //Adds equal bounds around image
        map.setMaxBounds([[-this.height / 2, -this.width / 2], [this.height * 1.5, this.width * 1.5]]);
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
                    L.latLng(currentNode.lat, currentNode.lon, 0),
                    L.latLng(coord[0], coord[1], 1)
                ]
                //Hotline uses z-value in latLng to create gradient using palette
                var line = L.hotline(coords, { palette: { 0.0: MAP_COLORS.LINE_START, 1.0: MAP_COLORS.LINE_END }, weight: 2 }).addTo(linesLayer);

                currentNode.startLine.push(line);
            }

            //Reset color of previous node
            if (currentCircle != null) {
                currentCircle.setStyle({ color: MAP_COLORS.CIRCLE, fillColor: MAP_COLORS.CIRCLE });
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

            selection.setStyle({ fillColor: MAP_COLORS.CURRENT_CIRCLE });

            //Handles node selection
            if (currentCircle != null) {
                currentCircle.setStyle({ color: MAP_COLORS.CIRCLE, fillColor: MAP_COLORS.CIRCLE });
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
                        var startCoords = L.latLng(node.lat, node.lon, 0);
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
                        var endCoords = L.latLng(node.lat, node.lon, 1);

                        line.setLatLngs([startCoords, endCoords]);
                    }
                );
            }
        },
    });
}
//TODO - HOW DOES THIS WORK WITH LOOPS???????????????????????????????
function deleteNodeAndChildren() {
    //Removes node from parent's adj array
    currentNode.parentNodes.forEach(function (parent) {
        for (let i = 0; i < parent.adj.length; i++) {
            if (parent.adj[i] == currentNode) {
                parent.adj.splice(i, 1);
                break;
            }
        }
    });

    deleteNode(currentNode);

    //Selects parent node - defaults to first
    if (currentNode.parentNodes.length > 0) {
        currentNode = currentNode.parentNodes[0];
        currentCircle = currentNode.circle;
        currentCircle.setStyle({ fillColor: MAP_COLORS.CURRENT_CIRCLE, color: MAP_COLORS.CURRENT_CIRCLE });
    } else {
        currentCircle = null;
        currentNode = null;
    }
}
//Recursively deletes node and all children
function deleteNode(node) {
    nodesMap.delete(node.circle);
    circlesLayer.removeLayer(node.circle);
    node.endLine.forEach(function (line) {
        linesLayer.removeLayer(line);
    });
    node.adj.forEach(function (child) {
        deleteNode(child);
    })
}

//TODO make not ugly
function createChildNode(lat, lon, floor, adj, id, endLine) {
    if (currentNode == null) {
        floor = 0;
    } else {
        floor = currentNode.floor;
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

function addParent(){
    let nodeId = add_parent_input.value;
    var alertMessage=ALERT_MESSAGES.ID_DNE;
    let validId = false;
    //TODO make this not horrible
    for(var node of nodesMap.values()){
        if(node.id == nodeId){
            if(node.id==currentNode.id){
                alertMessage=ALERT_MESSAGES.SELF_ID;
                validId=true;
            }
            for(var child of currentNode.adj){
                if(child.id==nodeId){
                    validId=true;
                    alertMessage=ALERT_MESSAGES.CHILD_ID;
                    break;
                }
            }
            for(var parent of currentNode.parentNodes){
                if(parent.id==nodeId){
                    validId=true;
                    alertMessage=ALERT_MESSAGES.PARENT_ID;
                    break;
                }
            }
            //validId serves double purpose, does not mean id is valid
            //actually means doesn't fail any checks - see above
            if(!validId){
                node.adj.push(currentNode);
                currentNode.parentNodes.push(node);
                updateNodeInfoColumn(currentNode);
                validId=true;

                var coords = [
                    [node.lat, node.lon, 0],
                    [currentNode.lat, currentNode.lon, 1]
                ];
                var line = L.hotline(coords, { palette: { 0.0: MAP_COLORS.LINE_START, 1.0: MAP_COLORS.LINE_END }, weight: 2 }).addTo(linesLayer);

                node.startLine.push(line);
                currentNode.endLine.push(line);
            }else{
                validId=false;
            }
            break;
        }
    }

    if(validId){
        add_parent_input.value="";
    }else{
        alert(alertMessage);
    }
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
                var startCoords = L.latLng(currentNode.lat, currentNode.lon, 0);
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
                var endCoords = L.latLng(currentNode.lat, currentNode.lon, 1);
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

    //Gives button the same function as clicking their respective nodes
    var buttonCallback = function (child, htmlElement) {
        var button = document.createElement("button");
        button.innerHTML = child.id;
        button.className += NODE_BUTTON_CLASS_NAME;
        htmlElement.appendChild(button);

        button.addEventListener("mouseover", function () {
            child.circle.setStyle({ color: MAP_COLORS.HOVER_CIRCLE });
        });
        button.addEventListener("mouseout", function () {
            child.circle.setStyle({ color: MAP_COLORS.CIRCLE });
        });
        button.addEventListener("click", function () {
            currentCircle.setStyle({ color: MAP_COLORS.CIRCLE, fillColor: MAP_COLORS.CIRCLE });

            currentNode = child;
            currentCircle = child.circle;

            currentCircle.setStyle({ color: MAP_COLORS.CURRENT_CIRCLE, fillColor: MAP_COLORS.CURRENT_CIRCLE });
            updateNodeInfoColumn(currentNode);
        });
    }

    if(node.adj.length>0){
        node_adj.innerHTML = "";
        node.adj.forEach((child)=>buttonCallback(child, node_adj));
    }else{
        node_adj.innerHTML="No children";
    }
    if(node.parentNodes.length>0){
        node_parent.innerHTML="";
        node.parentNodes.forEach((child)=>buttonCallback(child, node_parent));
    }else{
        node_parent.innerHTML="No parents. This is the ROOT NODE.";
    }
}

function downloadJson() {
    var text ="";
    nodesMap.forEach(node => text+=node.getJson());

    //I have no clue how this works, but this prompts the download popup
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', 'map.json');

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
    //aka don't ask Kyle how this works
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
        this.circle = currentCircle;
    }

    toString() {
        return this.id;
    }

    getJson() {
        var json ="";
        json+='"' + this.id + '"' + ": {\n";
        json+='\t"lat":' + this.lat + ',\n';
        json+='\t"lon": ' + this.lon + ',\n';
        json+='\t"floor": ' + this.floor + ',\n';
        json+='\t"adj": ' + this.adj+'\n';
        json+="},\n";
        return json;
    }
}
