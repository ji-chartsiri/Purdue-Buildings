var fileInput = document.getElementById("file_input");
var mapImg = document.getElementById("mapImg");

var node_id = document.getElementById("node_id");
var node_lat = document.getElementById("node_lat");
var node_lon = document.getElementById("node_lon");
var node_floor = document.getElementById("node_floor");
var node_adj = document.getElementById("node_adj");
var node_parent = document.getElementById("node_parent");

document.addEventListener('keydown', logKey);
var child =true;
var file;

var parent = null;
var nodeList = [];

var selectedNode;

fileInput.addEventListener('change', handleFileChange);
document.getElementById("show_nodes").addEventListener("click", handleShowNodes)
document.getElementById("delete_node_button").addEventListener("click", deleteEverything());

function logKey(e){
    if(e.code == 'KeyE'){
        child=!child;
    }
}

function handleShowNodes() {
    nodeList.forEach(node=>node.getJson());
}

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

    map.on('click',
        function (e) {
            var coord = e.latlng.toString().split(',');
            var lat = coord[0].split('(');
            var lng = coord[1].split(')');
            

            if (parent != null) {
                var coords = [
                    [parent.lat, parent.lon],
                    [lat[1], lng[0]]
                ]
        
                var lines = L.polyline(coords, { color: 'red' }).addTo(map);
            }
            var circleOptions = {
                color: 'red',
                fillColor: 'f03',
                fillOpacity: 0,
            }
            if(child){
                createChildNode(lat[1], lng[0]);
            }else{
                createSiblingNode(lat[1],lng[0]);
            }
            

            //TODO add onclick listener to circles to DELETE, EDIT, OR MAKE NEW CHILDREN NODES
            var circles = L.circle(e.latlng, 2, circleOptions).addTo(map);
            // .on('hover', function(e){
            //     //BECAUSE PARENT points to it after createChildNode
            //     //e.preventDefault();

            //     // console.log("hello");
            //     // selectedNode = parent;
            //     // deleteSelfAndChildren(parent);
            //     // map.removeLayer(marker);
            //     // map.removeLayer(lines);

            //     // lines.deleteLastVertex;
            //     // circles.
            //     //event.stopPropagation();
                
            //     // node_id.innerHTML = selectedNode.id;
            //     // node_lat.innerHTML = selectedNode.lat;
            //     // node_lon.innerHTML = selectedNode.lon;
            //     // node_floor.innerHTML = selectedNode.floor;
            //     // node_adj.innerHTML = selectedNode.adj;
            //     // node_parent.innerHTML = selectedNode.parent;
            // });

            selectedNode = parent;
                node_id.innerHTML = selectedNode.id;
                node_lat.innerHTML = selectedNode.lat;
                node_lon.innerHTML = selectedNode.lon;
                node_floor.innerHTML = selectedNode.floor;
                node_adj.innerHTML = selectedNode.adj;
                node_parent.innerHTML = selectedNode.parent;


            

        })

    //map.setMaxBounds(new L.LatLngBounds([0, 1500], [1500, 0]));

    var imageUrl = URL.createObjectURL(file);
    var imageBounds = [[500, 0], [0, 750]];

    L.imageOverlay(imageUrl, imageBounds).addTo(map);
}


function deleteEverything(node){
    nodeList=[];
    for(let i =0 ; i<nodeList.length; i++){
        if(nodeList[i]==node){
            
            node.adj.forEach(childNode => {
                deleteEverything(childNode)
            });
            nodeList.splice(i,1);
        }
    }
}

//NOT IN USE, TODO ////////////
function createSiblingNode(lat, lon, floor, adj, id) {
    if(floor==null){
        floor = 0;
    }
    if(id==null){
        id="test"+lat.toString()+lon.toString();
    }
    var nextNode = new Node(lat, lon, parent, floor, [], id);
    if (parent != null) {
        parent.adj.push(nextNode);
    }
    nodeList.push(nextNode);
}

function createChildNode(lat, lon, floor, adj, id) {

    if(floor==null){
        floor = 0;
    }
    if(id==null){
        id="test"+lat.toString()+lon.toString();
    }

    var nextNode = new Node(lat, lon, parent, floor, [], id);
    if (parent != null) {
        parent.adj.push(nextNode);
    }
    nodeList.push(nextNode);
    parent = nextNode;
}
class Node {
    constructor(lat, lon, parent, floor, adj, id) {
        this.lat = lat;
        this.lon = lon;
        this.parent = parent;
        this.floor = floor;
        this.adj = adj;
        this.id = id;
    }

    toString(){
        return '"'+this.id+'"';
    }

    //TODO make this actually spit out json 
    getJson() {
        console.log("\t" + '"' + this.id + '"' + ": {")
        console.log('\t"lat":' + this.lat + ',')
        console.log('\t"lon": ' + this.lon + ',')
        console.log('\t"floor": ' + this.floor + ',')
        console.log('\t"adj": ' + this.adj)
        console.log("}, ")
    }
}
