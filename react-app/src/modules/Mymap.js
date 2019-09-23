import React from 'react';
import { Map, Marker, Popup, ImageOverlay, Polyline} from 'react-leaflet'
import '../styles/myMap.css';
import '../styles/leaflet.css'
import icon from '../img/marker-icon.png';
import iconShadow from '../img/marker-shadow.png';
import L from 'leaflet'

class Mymap extends React.Component {

    constructor(props) {
        super(props)
        const DefaultIcon = L.icon({
            iconUrl: icon,
            shadowUrl: iconShadow,
            iconSize: [25, 41],
            iconAnchor: [12.5, 41],
            popupAnchor: [0, -41]
        });
        L.Marker.prototype.options.icon = DefaultIcon;
    }
    
    render() {
        return (
            <Map 
                animate={true}
                crs={L.CRS.Simple} 
                bounds={this.props.mapBounds}
                minZoom={-1}
            >
                <ImageOverlay 
                    url={this.props.imageUrl} 
                    bounds={this.props.imageBounds}
                />
                {this.props.marker.position.length === 0 ? '':
                    (<Marker position={this.props.marker.position}>
                        <Popup>...</Popup>
                    </Marker>)
                }
                <Polyline
                    positions={this.props.routeLine}
                    color={'red'}
                    weight={5}
                />
                
          </Map>)
    }
}

export default Mymap