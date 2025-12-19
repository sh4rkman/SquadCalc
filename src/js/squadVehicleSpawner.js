import { Rectangle, ImageOverlay } from "leaflet";


export class SquadVehicleSpawner {

    /**
     * * @param {Object} layerData - The layer data object containing the factions and units
     * * @param {layer} layer - The SquadLayer object containing the main icons
     * */
    constructor(latlng, data, layer) {
        this.latlng = latlng;
        this.layer = layer;
        this.data = data;

        this.vehicleConfig = {
            MBT: { halfWidth: 2.3, halfHeight: 1.7, key: "vehicles" },
            APC: { halfWidth: 3, halfHeight: 1.7, key: "vehicles" },
            Car: { halfWidth: 2, halfHeight: 1.5, key: "vehicles" },
            QuadBike: { halfWidth: 1, halfHeight: 0.8, key: "bikes" },
            Helicopter: { halfWidth: 12, halfHeight: 12, key: "helicopters" },
            Boat: { halfWidth: 2, halfHeight: 1.5, key: "boats" },
        };

        if (this.data.typePriorities.length == 0) {
            this.rectangleOptions = {
                fillOpacity: 0.05,
                opacity: 0.75,
                weight: 1,
                dashArray: "4 4" 
            };
        } else {
            this.rectangleOptions = {
                fillOpacity: 0.25,
                opacity: 1,
                weight: 1,
            };
        }

        this.init();
    }


    /*
     *  Reset the factions button to its default state
     */
    init() {

        let color = "white";
        let halfWidth = 1;
        let halfHeight = 1;

        const config = this.vehicleConfig[this.data.size];

        if (config) {
            ({ halfWidth, halfHeight } = config);
            const teamKey = this.data.type === "Team One" ? this.layer.team1VehicleSpawners : this.layer.team2VehicleSpawners;
            teamKey[config.key].push(this.data);
        }

        const bounds = [
            [this.latlng[0] - halfHeight * this.layer.map.gameToMapScale, this.latlng[1] - halfWidth * this.layer.map.gameToMapScale],
            [this.latlng[0] + halfHeight * this.layer.map.gameToMapScale, this.latlng[1] + halfWidth * this.layer.map.gameToMapScale]
        ];




        if (this.data.typePriorities.length > 0) {

            // Make sure text is never uʍop-ǝpᴉsdn
            let txtRotation = this.data.rotation_z;
            if (txtRotation > 90) txtRotation += 180;
            else if (txtRotation < -90) txtRotation -= 180;

            // Rotate the bounds
            const rotated = this.rotateBounds(bounds, txtRotation);
            const topLeft = rotated[0];
            const topRight = rotated[1];
            const bottomLeft = rotated[3];

            // Create txt with rotation
            this.txt = new ImageOverlay.Rotated(
                `/api/img/vehicleSpawners/${this.data.typePriorities[0].name}.webp`,
                topLeft,
                topRight,
                bottomLeft)
                .addTo(this.layer.activeLayerMarkers);

            // Attach a custom class after creation to custom its z-index with css
            if (this.txt.getElement()) this.txt.getElement().classList.add("vehSpawnerTxt");
            
        }

        // Create the rectangle & rotate it
        this.rectangle = new Rectangle(bounds, { color: color, ...this.rectangleOptions }).addTo(this.layer.activeLayerMarkers);
        this.layer.rotateRectangle(this.rectangle, this.data.rotation_z);
        this.hide();
    }

    show() {
        this.rectangle.setStyle({ opacity: this.rectangleOptions.opacity, fillOpacity: this.rectangleOptions.fillOpacity });
        if (this.txt) this.txt.setOpacity(1);
    }


    hide() {
        this.rectangle.setStyle({ opacity: 0, fillOpacity: 0 });
        if (this.txt) this.txt.setOpacity(0);
    }


    /**
     * Rotate bounds around their center and return 4 rotated corners
     * @param {Array} bounds - The bounds as [[minLat, minLng], [maxLat, maxLng]]
     * @param {number} angle - The angle in degrees
     * @returns {Array} Array of 4 corners: [topLeft, topRight, bottomRight, bottomLeft]
     */
    rotateBounds(bounds, angle) {
        const minLat = bounds[0][0];
        const minLng = bounds[0][1];
        const maxLat = bounds[1][0];
        const maxLng = bounds[1][1];

        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;

        const radians = (Math.PI / 180) * (angle);

        const corners = [
            [maxLat, minLng], // top-left
            [maxLat, maxLng], // top-right
            [minLat, maxLng], // bottom-right
            [minLat, minLng]  // bottom-left
        ];

        function rotatePoint(lat, lng) {
            const latDiff = lat - centerLat;
            const lngDiff = lng - centerLng;
            const newLat = centerLat + (latDiff * Math.cos(radians) - lngDiff * Math.sin(radians));
            const newLng = centerLng + (latDiff * Math.sin(radians) + lngDiff * Math.cos(radians));
            return [newLat, newLng];
        }

        return corners.map(c => rotatePoint(c[0], c[1]));
    }



}