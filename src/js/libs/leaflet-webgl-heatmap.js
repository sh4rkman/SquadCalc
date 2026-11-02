/*
 * MIT Copyright 2016 Ursudio <info@ursudio.com>
 * http://www.ursudio.com/
 * Please attribute Ursudio in any production associated with this JavaScript plugin.
 * edited by Maxime "sharkman" Boussard to work on non-projected map
 */


import {
    DomUtil, Util, Renderer, LatLng, DomEvent 
} from "leaflet";

export default class extends Renderer {

    // tested on Leaflet 1.0.3
    version = "0.2.7";

    static defaultOptions = {
        // @option size: Number
        // corresponds with units below
        size: 30000,
        // @option units: String
        // 'm' for meters or 'px' for pixels
        units: "m",
        opacity: 1,
        gradientTexture: false,
        alphaRange: 1,
        // @option padding:
        // don't add padding (0 helps with zoomanim)
        padding: 0
    };

    // data handling state
    data = [];

    _initContainer() {
        var container = this._container = DomUtil.create("canvas", "leaflet-zoom-animated"),
            options = this.options;

        container.id = "webgl-leaflet-" + Util.stamp(this);
        container.style.opacity = options.opacity;
        container.style.position = "absolute";

        try {
            this.gl = window.createWebGLHeatmap({
                canvas: container,
                gradientTexture: options.gradientTexture,
                alphaRange: [0, options.alphaRange]
            });
        } catch (e) {
            console.error(e);

            // setup for webgl-less unit testing
            this.gl = {
                clear: function () {},
                update: function () {},
                multiply: function () {},
                addPoint: function () {},
                display: function () {},
                adjustSize: function () {},
            };
        }

        this._container = container;
    }

    onAdd() {
        // save this to a shorter method
        this.size = this.options.size;

        super.onAdd();

        this.resize();
    }

    // onRemove-ish
    _destroyContainer() {
        delete this.gl;
        this._container.remove();
        DomEvent.off(this._container);
        delete this._container;
    }

    // events

    getEvents() {
        var events = super.getEvents();

        // Replace Util.extend with Object.assign or spread operator
        Object.assign(events, {
            resize: this.resize,
            //move: Util.throttle(this._update, 49, this)
            move: this._update,
        });

        return events;
    }

    resize() {
        var canvas = this._container,
            size = this._map.getSize();

        canvas.width = size.x;
        canvas.height = size.y;

        this.gl.adjustSize();
        this.draw();
    }

    reposition() {
        // canvas moves opposite to map pane's position
        var pos = this._map
            ._getMapPanePos()
            .multiplyBy(-1);

        DomUtil.setPosition(this._container, pos);
    }

    _update() {
        super._update();
        this.draw();
    }

    // draw function

    draw() {
        var map = this._map,
            heatmap = this.gl,
            data = this.data,
            dataLen = data.length,
            floor = Math.floor,
            scaleFn = this["_scale" + this.options.units].bind( this ),
            multiply = this._multiply;

        if (!map) return;

        heatmap.clear();
        this.reposition();

        if (dataLen) {

            for (let i = 0; i < dataLen; i++) {
                let dataVal = data[i],
                    latlng = new LatLng(dataVal),
                    point = map.latLngToContainerPoint(latlng);

                heatmap.addPoint(
                    floor(point.x),
                    floor(point.y),
                    scaleFn(latlng),
                    dataVal[2]
                );
            }

            heatmap.update();

            if (multiply) {
                heatmap.multiply(multiply);
                heatmap.update();
            }

        }
        heatmap.display();
    }

    // scale methods

    _scalem(latlng) {
        // necessary to maintain accurately sized circles
        // to change scale to miles (for example), you will need to convert 40075017 (equatorial circumference of the Earth in metres) to miles
        var map = this._map,
            // lngRadius = (this.size / 2) * 360 / Math.cos((Math.PI / 180) * latlng.lat),
            lngRadius = (this.size / 2), // Patch for no earth projection
            latlng2 = new LatLng(latlng.lat, latlng.lng - lngRadius),
            point = map.latLngToLayerPoint(latlng),
            point2 = map.latLngToLayerPoint(latlng2);

        return Math.max(Math.round(point.x - point2.x), 1);
    }

    _scalepx() {
        return this.size;
    }

    // data handling methods

    addDataPoint(lat, lon, value) {
        this.data.push([lat, lon, value / 100]);
    }

    setData(dataset) {
        // format: [[lat, lon, intensity],...]
        this.data = dataset;
        this._multiply = null;
        this.draw();
    }

    clear() {
        this.setData([]);
    }

    // affects original points
    multiply(n) {
        this._multiply = n;
        this.draw();
    }

}