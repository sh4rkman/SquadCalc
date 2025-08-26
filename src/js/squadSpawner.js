import { Marker, Icon } from "leaflet";
import "./libs/leaflet-rotatedMarker.js";

export const squadVehicleMarker = Marker.extend({

    options: {
        draggable: false,
        riseOnHover: false,
        keyboard: false,
        animate: true,
        zIndexOffset: -1000
    },

    // Constructor
    initialize: function (latlng, spawner, vehicle, options) {
        
        Marker.prototype.initialize.call(this, latlng, options);

        this.spawner = spawner;
        this.vehicle = vehicle;

        this.setIcon(
            new Icon({
                iconUrl: `${process.env.API_URL}/img/icons/ally/vehicles/${vehicle.icon}.webp`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            }));

        this.setRotationAngle(spawner.rotation_z + 90);

        //this.on("click", this._handleClick, this);
    },


    /**
     * dqsdqsdqsdqsdqd
     * @param {event} [event] - event
     * @returns {event} - sfsdfsdfsdfsd
     */
    _handleClick: function(){
        console.log(this.spawner);
        console.log("vehicle", this.vehicle);
    },

});