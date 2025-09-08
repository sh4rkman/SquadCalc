
/*
 * 🍂class ImageOverlay.Rotated
 * 🍂inherits ImageOverlay
 *
 * Like `ImageOverlay`, but rotates and skews the image. This is done by using
 * *three* control points instead of *two*.
 *
 * @example
 *
 * ```
 * var topleft    = L.latLng(40.52256691873593, -3.7743186950683594),
 * 	topright   = L.latLng(40.5210255066156, -3.7734764814376835),
 * 	bottomleft = L.latLng(40.52180437272552, -3.7768453359603886);
 *
 * var overlay = L.imageOverlay.rotated("./palacio.jpg", topleft, topright, bottomleft, {
 * 	opacity: 0.4,
 * 	interactive: true,
 * 	attribution: "&copy; <a href='http://www.ign.es'>Instituto Geográfico Nacional de España</a>"
 * });
 * ```
 *
 */

import { DomUtil, ImageOverlay, LatLng, Util, Bounds, LatLngBounds } from "leaflet";


ImageOverlay.Rotated = ImageOverlay.extend({

    initialize: function (image, topleft, topright, bottomleft, options) {

        if (typeof (image) === "string") {
            this._url = image;
        } else {
            // Assume that the first parameter is an instance of HTMLImage or HTMLCanvas
            this._rawImage = image;
        }

        this._topLeft    = new LatLng(topleft);
        this._topRight   = new LatLng(topright);
        this._bottomLeft = new LatLng(bottomleft);

        Util.setOptions(this, options);
    },


    onAdd: function (map) {
        if (!this._image) {
            this._initImage();

            if (this.options.opacity < 1) {
                this._updateOpacity();
            }
        }

        if (this.options.interactive) {
            this._rawImage.classList.add("leaflet-interactive");
            this.addInteractiveTarget(this._rawImage);
        }

        map.on("zoomend resetview", this._reset, this);

        this.getPane().appendChild(this._image);
        this._reset();
    },


    onRemove: function(map) {
        map.off("zoomend resetview", this._reset, this);
        ImageOverlay.prototype.onRemove.call(this, map);
    },


    _initImage: function () {
        var img = this._rawImage;
        if (this._url) {
            img = DomUtil.create("img");
            img.style.display = "none";	// Hide while the first transform (zero or one frames) is being done

            if (this.options.crossOrigin) {
                img.crossOrigin = "";
            }

            img.src = this._url;
            this._rawImage = img;
        }
        img.classList.add("leaflet-image-layer");

        // this._image is reused by some of the methods of the parent class and
        // must keep the name, even if it is counter-intuitive.
        let div = this._image = DomUtil.create("div",
            "leaflet-image-layer " + (this._zoomAnimated ? "leaflet-zoom-animated" : ""));

        this._updateZIndex(); // apply z-index style setting to the div (if defined)
		
        div.appendChild(img);

        div.onselectstart = Util.falseFn;
        div.onmousemove = Util.falseFn;

        img.onload = function(){
            this._reset();
            img.style.display = "block";
            this.fire("load");
        }.bind(this);

        img.alt = this.options.alt;
    },


    _reset: function () {
        var div = this._image;

        if (!this._map) {
            return;
        }

        // Project control points to container-pixel coordinates
        let pxTopLeft    = this._map.latLngToLayerPoint(this._topLeft);
        let pxTopRight   = this._map.latLngToLayerPoint(this._topRight);
        let pxBottomLeft = this._map.latLngToLayerPoint(this._bottomLeft);

        // Infer coordinate of bottom right
        let pxBottomRight = pxTopRight.subtract(pxTopLeft).add(pxBottomLeft);

        // pxBounds is mostly for positioning the <div> container
        let pxBounds = new Bounds([pxTopLeft, pxTopRight, pxBottomLeft, pxBottomRight]);
        let size = pxBounds.getSize();
        let pxTopLeftInDiv = pxTopLeft.subtract(pxBounds.min);

        // LatLngBounds are needed for (zoom) animations
        this._bounds = new LatLngBounds( this._map.layerPointToLatLng(pxBounds.min),
		                               this._map.layerPointToLatLng(pxBounds.max) );

        DomUtil.setPosition(div, pxBounds.min);

        div.style.width  = size.x + "px";
        div.style.height = size.y + "px";

        let imgW = this._rawImage.width;
        let imgH = this._rawImage.height;
        if (!imgW || !imgH) {
            return;	// Probably because the image hasn't loaded yet.
        }

        // Sides of the control-point box, in pixels
        // These are the main ingredient for the transformation matrix.
        let vectorX = pxTopRight.subtract(pxTopLeft);
        let vectorY = pxBottomLeft.subtract(pxTopLeft);

        this._rawImage.style.transformOrigin = "0 0";

        // The transformation is an affine matrix that switches
        // coordinates around in just the right way. This is the result
        // of calculating the skew/rotation/scale matrices and simplyfing
        // everything.
        this._rawImage.style.transform = "matrix(" +
			(vectorX.x/imgW) + ", " + (vectorX.y/imgW) + ", " +
			(vectorY.x/imgH) + ", " + (vectorY.y/imgH) + ", " +
			pxTopLeftInDiv.x + ", " + pxTopLeftInDiv.y + ")";

    },


    reposition: function(topleft, topright, bottomleft) {
        this._topLeft    = new LatLng(topleft);
        this._topRight   = new LatLng(topright);
        this._bottomLeft = new LatLng(bottomleft);
        this._reset();
    },


    setUrl: function (url) {
        this._url = url;

        if (this._rawImage) {
            this._rawImage.src = url;
        }
        return this;
    }
});

/* 🍂factory imageOverlay.rotated(imageUrl: String|HTMLImageElement|HTMLCanvasElement, topleft: LatLng, topright: LatLng, bottomleft: LatLng, options?: ImageOverlay options)
 * Instantiates a rotated/skewed image overlay, given the image URL and
 * the `LatLng`s of three of its corners.
 *
 * Alternatively to specifying the URL of the image, an existing instance of `HTMLImageElement`
 * or `HTMLCanvasElement` can be used.
 */
ImageOverlay.rotated = function(imgSrc, topleft, topright, bottomleft, options) {
    return new ImageOverlay.Rotated(imgSrc, topleft, topright, bottomleft, options);
};
