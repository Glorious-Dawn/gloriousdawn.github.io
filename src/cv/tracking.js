/* eslint-disable */
/**
 * tracking - A modern approach for Computer Vision on the web.
 * @author Eduardo Lundgren <edu@rdo.io>
 * @version v1.1.2
 * @link http://trackingjs.com
 * @license BSD
 */
let tracking={};

(function() {
  /**
   * EventEmitter utility.
   * @constructor
   */
  tracking.EventEmitter = function() {};

  /**
   * Holds event listeners scoped by event type.
   * @type {object}
   * @private
   */
  tracking.EventEmitter.prototype.events_ = null;

  /**
   * Adds a listener to the end of the listeners array for the specified event.
   * @param {string} event
   * @param {function} listener
   * @return {object} Returns emitter, so calls can be chained.
   */
  tracking.EventEmitter.prototype.addListener = function(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }
    if (!this.events_) {
      this.events_ = {};
    }

    this.emit('newListener', event, listener);

    if (!this.events_[event]) {
      this.events_[event] = [];
    }

    this.events_[event].push(listener);

    return this;
  };

  /**
   * Returns an array of listeners for the specified event.
   * @param {string} event
   * @return {array} Array of listeners.
   */
  tracking.EventEmitter.prototype.listeners = function(event) {
    return this.events_ && this.events_[event];
  };

  /**
   * Execute each of the listeners in order with the supplied arguments.
   * @param {string} event
   * @param {*} opt_args [arg1], [arg2], [...]
   * @return {boolean} Returns true if event had listeners, false otherwise.
   */
  tracking.EventEmitter.prototype.emit = function(event) {
    var listeners = this.listeners(event);
    if (listeners) {
      var args = Array.prototype.slice.call(arguments, 1);
      for (var i = 0; i < listeners.length; i++) {
        if (listeners[i]) {
          listeners[i].apply(this, args);
        }
      }
      return true;
    }
    return false;
  };

  /**
   * Adds a listener to the end of the listeners array for the specified event.
   * @param {string} event
   * @param {function} listener
   * @return {object} Returns emitter, so calls can be chained.
   */
  tracking.EventEmitter.prototype.on = tracking.EventEmitter.prototype.addListener;

  /**
   * Adds a one time listener for the event. This listener is invoked only the
   * next time the event is fired, after which it is removed.
   * @param {string} event
   * @param {function} listener
   * @return {object} Returns emitter, so calls can be chained.
   */
  tracking.EventEmitter.prototype.once = function(event, listener) {
    var self = this;
    self.on(event, function handlerInternal() {
      self.removeListener(event, handlerInternal);
      listener.apply(this, arguments);
    });
  };

  /**
   * Removes all listeners, or those of the specified event. It's not a good
   * idea to remove listeners that were added elsewhere in the code,
   * especially when it's on an emitter that you didn't create.
   * @param {string} event
   * @return {object} Returns emitter, so calls can be chained.
   */
  tracking.EventEmitter.prototype.removeAllListeners = function(opt_event) {
    if (!this.events_) {
      return this;
    }
    if (opt_event) {
      delete this.events_[opt_event];
    } else {
      delete this.events_;
    }
    return this;
  };

  /**
   * Remove a listener from the listener array for the specified event.
   * Caution: changes array indices in the listener array behind the listener.
   * @param {string} event
   * @param {function} listener
   * @return {object} Returns emitter, so calls can be chained.
   */
  tracking.EventEmitter.prototype.removeListener = function(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }
    if (!this.events_) {
      return this;
    }

    var listeners = this.listeners(event);
    if (Array.isArray(listeners)) {
      var i = listeners.indexOf(listener);
      if (i < 0) {
        return this;
      }
      listeners.splice(i, 1);
    }

    return this;
  };

  /**
   * By default EventEmitters will print a warning if more than 10 listeners
   * are added for a particular event. This is a useful default which helps
   * finding memory leaks. Obviously not all Emitters should be limited to 10.
   * This function allows that to be increased. Set to zero for unlimited.
   * @param {number} n The maximum number of listeners.
   */
  tracking.EventEmitter.prototype.setMaxListeners = function() {
    throw new Error('Not implemented');
  };

}());

(function() {
  /**
   * Canvas utility.
   * @static
   * @constructor
   */
  tracking.Canvas = {};

  /**
   * Loads an image source into the canvas.
   * @param {HTMLCanvasElement} canvas The canvas dom element.
   * @param {string} src The image source.
   * @param {number} x The canvas horizontal coordinate to load the image.
   * @param {number} y The canvas vertical coordinate to load the image.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {function} opt_callback Callback that fires when the image is loaded
   *     into the canvas.
   * @static
   */
  tracking.Canvas.loadImage = function(canvas, src, x, y, width, height, opt_callback) {
    var instance = this;
    var img = new window.Image();
    img.crossOrigin = '*';
    img.onload = function() {
      var context = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      context.drawImage(img, x, y, width, height);
      if (opt_callback) {
        opt_callback.call(instance);
      }
      img = null;
    };
    img.src = src;
  };
}());

(function() {
  /**
   * DisjointSet utility with path compression. Some applications involve
   * grouping n distinct objects into a collection of disjoint sets. Two
   * important operations are then finding which set a given object belongs to
   * and uniting the two sets. A disjoint set data structure maintains a
   * collection S={ S1 , S2 ,..., Sk } of disjoint dynamic sets. Each set is
   * identified by a representative, which usually is a member in the set.
   * @static
   * @constructor
   */
  tracking.DisjointSet = function(length) {
    if (length === undefined) {
      throw new Error('DisjointSet length not specified.');
    }
    this.length = length;
    this.parent = new Uint32Array(length);
    for (var i = 0; i < length; i++) {
      this.parent[i] = i;
    }
  };

  /**
   * Holds the length of the internal set.
   * @type {number}
   */
  tracking.DisjointSet.prototype.length = null;

  /**
   * Holds the set containing the representative values.
   * @type {Array.<number>}
   */
  tracking.DisjointSet.prototype.parent = null;

  /**
   * Finds a pointer to the representative of the set containing i.
   * @param {number} i
   * @return {number} The representative set of i.
   */
  tracking.DisjointSet.prototype.find = function(i) {
    if (this.parent[i] === i) {
      return i;
    } else {
      return (this.parent[i] = this.find(this.parent[i]));
    }
  };

  /**
   * Unites two dynamic sets containing objects i and j, say Si and Sj, into
   * a new set that Si ∪ Sj, assuming that Si ∩ Sj = ∅;
   * @param {number} i
   * @param {number} j
   */
  tracking.DisjointSet.prototype.union = function(i, j) {
    var iRepresentative = this.find(i);
    var jRepresentative = this.find(j);
    this.parent[iRepresentative] = jRepresentative;
  };

}());

(function() {
  /**
   * Image utility.
   * @static
   * @constructor
   */
  tracking.Image = {};

  /**
   * Computes gaussian blur. Adapted from
   * https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {number} diameter Gaussian blur diameter, must be greater than 1.
   * @return {array} The edge pixels in a linear [r,g,b,a,...] array.
   */
  tracking.Image.blur = function(pixels, width, height, diameter) {
    diameter = Math.abs(diameter);
    if (diameter <= 1) {
      throw new Error('Diameter should be greater than 1.');
    }
    var radius = diameter / 2;
    var len = Math.ceil(diameter) + (1 - (Math.ceil(diameter) % 2));
    var weights = new Float32Array(len);
    var rho = (radius + 0.5) / 3;
    var rhoSq = rho * rho;
    var gaussianFactor = 1 / Math.sqrt(2 * Math.PI * rhoSq);
    var rhoFactor = -1 / (2 * rho * rho);
    var wsum = 0;
    var middle = Math.floor(len / 2);
    for (var i = 0; i < len; i++) {
      var x = i - middle;
      var gx = gaussianFactor * Math.exp(x * x * rhoFactor);
      weights[i] = gx;
      wsum += gx;
    }
    for (var j = 0; j < weights.length; j++) {
      weights[j] /= wsum;
    }
    return this.separableConvolve(pixels, width, height, weights, weights, false);
  };

  /**
   * Computes the integral image for summed, squared, rotated and sobel pixels.
   * @param {array} pixels The pixels in a linear [r,g,b,a,...] array to loop
   *     through.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} opt_integralImage Empty array of size `width * height` to
   *     be filled with the integral image values. If not specified compute sum
   *     values will be skipped.
   * @param {array} opt_integralImageSquare Empty array of size `width *
   *     height` to be filled with the integral image squared values. If not
   *     specified compute squared values will be skipped.
   * @param {array} opt_tiltedIntegralImage Empty array of size `width *
   *     height` to be filled with the rotated integral image values. If not
   *     specified compute sum values will be skipped.
   * @param {array} opt_integralImageSobel Empty array of size `width *
   *     height` to be filled with the integral image of sobel values. If not
   *     specified compute sobel filtering will be skipped.
   * @static
   */
  tracking.Image.computeIntegralImage = function(pixels, width, height, opt_integralImage, opt_integralImageSquare, opt_tiltedIntegralImage, opt_integralImageSobel) {
    if (arguments.length < 4) {
      throw new Error('You should specify at least one output array in the order: sum, square, tilted, sobel.');
    }
    var pixelsSobel;
    if (opt_integralImageSobel) {
      pixelsSobel = tracking.Image.sobel(pixels, width, height);
    }
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var w = i * width * 4 + j * 4;
        var pixel = ~~(pixels[w] * 0.299 + pixels[w + 1] * 0.587 + pixels[w + 2] * 0.114);
        if (opt_integralImage) {
          this.computePixelValueSAT_(opt_integralImage, width, i, j, pixel);
        }
        if (opt_integralImageSquare) {
          this.computePixelValueSAT_(opt_integralImageSquare, width, i, j, pixel * pixel);
        }
        if (opt_tiltedIntegralImage) {
          var w1 = w - width * 4;
          var pixelAbove = ~~(pixels[w1] * 0.299 + pixels[w1 + 1] * 0.587 + pixels[w1 + 2] * 0.114);
          this.computePixelValueRSAT_(opt_tiltedIntegralImage, width, i, j, pixel, pixelAbove || 0);
        }
        if (opt_integralImageSobel) {
          this.computePixelValueSAT_(opt_integralImageSobel, width, i, j, pixelsSobel[w]);
        }
      }
    }
  };

  /**
   * Helper method to compute the rotated summed area table (RSAT) by the
   * formula:
   *
   * RSAT(x, y) = RSAT(x-1, y-1) + RSAT(x+1, y-1) - RSAT(x, y-2) + I(x, y) + I(x, y-1)
   *
   * @param {number} width The image width.
   * @param {array} RSAT Empty array of size `width * height` to be filled with
   *     the integral image values. If not specified compute sum values will be
   *     skipped.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} pixel Pixel value to be added to the integral image.
   * @static
   * @private
   */
  tracking.Image.computePixelValueRSAT_ = function(RSAT, width, i, j, pixel, pixelAbove) {
    var w = i * width + j;
    RSAT[w] = (RSAT[w - width - 1] || 0) + (RSAT[w - width + 1] || 0) - (RSAT[w - width - width] || 0) + pixel + pixelAbove;
  };

  /**
   * Helper method to compute the summed area table (SAT) by the formula:
   *
   * SAT(x, y) = SAT(x, y-1) + SAT(x-1, y) + I(x, y) - SAT(x-1, y-1)
   *
   * @param {number} width The image width.
   * @param {array} SAT Empty array of size `width * height` to be filled with
   *     the integral image values. If not specified compute sum values will be
   *     skipped.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} pixel Pixel value to be added to the integral image.
   * @static
   * @private
   */
  tracking.Image.computePixelValueSAT_ = function(SAT, width, i, j, pixel) {
    var w = i * width + j;
    SAT[w] = (SAT[w - width] || 0) + (SAT[w - 1] || 0) + pixel - (SAT[w - width - 1] || 0);
  };

  /**
   * Converts a color from a colorspace based on an RGB color model to a
   * grayscale representation of its luminance. The coefficients represent the
   * measured intensity perception of typical trichromat humans, in
   * particular, human vision is most sensitive to green and least sensitive
   * to blue.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {boolean} fillRGBA If the result should fill all RGBA values with the gray scale
   *  values, instead of returning a single value per pixel.
   * @param {Uint8ClampedArray} The grayscale pixels in a linear array ([p,p,p,a,...] if fillRGBA
   *  is true and [p1, p2, p3, ...] if fillRGBA is false).
   * @static
   */
  tracking.Image.grayscale = function(pixels, width, height, fillRGBA) {
    var gray = new Uint8ClampedArray(fillRGBA ? pixels.length : pixels.length >> 2);
    var p = 0;
    var w = 0;
    for (var i = 0; i < height; i++) {
      for (var j = 0; j < width; j++) {
        var value = pixels[w] * 0.299 + pixels[w + 1] * 0.587 + pixels[w + 2] * 0.114;
        gray[p++] = value;

        if (fillRGBA) {
          gray[p++] = value;
          gray[p++] = value;
          gray[p++] = pixels[w + 3];
        }

        w += 4;
      }
    }
    return gray;
  };

  /**
   * Fast horizontal separable convolution. A point spread function (PSF) is
   * said to be separable if it can be broken into two one-dimensional
   * signals: a vertical and a horizontal projection. The convolution is
   * performed by sliding the kernel over the image, generally starting at the
   * top left corner, so as to move the kernel through all the positions where
   * the kernel fits entirely within the boundaries of the image. Adapted from
   * https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} weightsVector The weighting vector, e.g [-1,0,1].
   * @param {number} opaque
   * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
   */
  tracking.Image.horizontalConvolve = function(pixels, width, height, weightsVector, opaque) {
    var side = weightsVector.length;
    var halfSide = Math.floor(side / 2);
    var output = new Float32Array(width * height * 4);
    var alphaFac = opaque ? 1 : 0;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var sy = y;
        var sx = x;
        var offset = (y * width + x) * 4;
        var r = 0;
        var g = 0;
        var b = 0;
        var a = 0;
        for (var cx = 0; cx < side; cx++) {
          var scy = sy;
          var scx = Math.min(width - 1, Math.max(0, sx + cx - halfSide));
          var poffset = (scy * width + scx) * 4;
          var wt = weightsVector[cx];
          r += pixels[poffset] * wt;
          g += pixels[poffset + 1] * wt;
          b += pixels[poffset + 2] * wt;
          a += pixels[poffset + 3] * wt;
        }
        output[offset] = r;
        output[offset + 1] = g;
        output[offset + 2] = b;
        output[offset + 3] = a + alphaFac * (255 - a);
      }
    }
    return output;
  };

  /**
   * Fast vertical separable convolution. A point spread function (PSF) is
   * said to be separable if it can be broken into two one-dimensional
   * signals: a vertical and a horizontal projection. The convolution is
   * performed by sliding the kernel over the image, generally starting at the
   * top left corner, so as to move the kernel through all the positions where
   * the kernel fits entirely within the boundaries of the image. Adapted from
   * https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} weightsVector The weighting vector, e.g [-1,0,1].
   * @param {number} opaque
   * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
   */
  tracking.Image.verticalConvolve = function(pixels, width, height, weightsVector, opaque) {
    var side = weightsVector.length;
    var halfSide = Math.floor(side / 2);
    var output = new Float32Array(width * height * 4);
    var alphaFac = opaque ? 1 : 0;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var sy = y;
        var sx = x;
        var offset = (y * width + x) * 4;
        var r = 0;
        var g = 0;
        var b = 0;
        var a = 0;
        for (var cy = 0; cy < side; cy++) {
          var scy = Math.min(height - 1, Math.max(0, sy + cy - halfSide));
          var scx = sx;
          var poffset = (scy * width + scx) * 4;
          var wt = weightsVector[cy];
          r += pixels[poffset] * wt;
          g += pixels[poffset + 1] * wt;
          b += pixels[poffset + 2] * wt;
          a += pixels[poffset + 3] * wt;
        }
        output[offset] = r;
        output[offset + 1] = g;
        output[offset + 2] = b;
        output[offset + 3] = a + alphaFac * (255 - a);
      }
    }
    return output;
  };

  /**
   * Fast separable convolution. A point spread function (PSF) is said to be
   * separable if it can be broken into two one-dimensional signals: a
   * vertical and a horizontal projection. The convolution is performed by
   * sliding the kernel over the image, generally starting at the top left
   * corner, so as to move the kernel through all the positions where the
   * kernel fits entirely within the boundaries of the image. Adapted from
   * https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {array} horizWeights The horizontal weighting vector, e.g [-1,0,1].
   * @param {array} vertWeights The vertical vector, e.g [-1,0,1].
   * @param {number} opaque
   * @return {array} The convoluted pixels in a linear [r,g,b,a,...] array.
   */
  tracking.Image.separableConvolve = function(pixels, width, height, horizWeights, vertWeights, opaque) {
    var vertical = this.verticalConvolve(pixels, width, height, vertWeights, opaque);
    return this.horizontalConvolve(vertical, width, height, horizWeights, opaque);
  };

  /**
   * Compute image edges using Sobel operator. Computes the vertical and
   * horizontal gradients of the image and combines the computed images to
   * find edges in the image. The way we implement the Sobel filter here is by
   * first grayscaling the image, then taking the horizontal and vertical
   * gradients and finally combining the gradient images to make up the final
   * image. Adapted from https://github.com/kig/canvasfilters.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @return {array} The edge pixels in a linear [r,g,b,a,...] array.
   */
  tracking.Image.sobel = function(pixels, width, height) {
    pixels = this.grayscale(pixels, width, height, true);
    var output = new Float32Array(width * height * 4);
    var sobelSignVector = new Float32Array([-1, 0, 1]);
    var sobelScaleVector = new Float32Array([1, 2, 1]);
    var vertical = this.separableConvolve(pixels, width, height, sobelSignVector, sobelScaleVector);
    var horizontal = this.separableConvolve(pixels, width, height, sobelScaleVector, sobelSignVector);

    for (var i = 0; i < output.length; i += 4) {
      var v = vertical[i];
      var h = horizontal[i];
      var p = Math.sqrt(h * h + v * v);
      output[i] = p;
      output[i + 1] = p;
      output[i + 2] = p;
      output[i + 3] = 255;
    }

    return output;
  };

}());

(function() {
  /**
   * ViolaJones utility.
   * @static
   * @constructor
   */
  tracking.ViolaJones = {};

  /**
   * Holds the minimum area of intersection that defines when a rectangle is
   * from the same group. Often when a face is matched multiple rectangles are
   * classified as possible rectangles to represent the face, when they
   * intersects they are grouped as one face.
   * @type {number}
   * @default 0.5
   * @static
   */
  tracking.ViolaJones.REGIONS_OVERLAP = 0.5;

  /**
   * Holds the HAAR cascade classifiers converted from OpenCV training.
   * @type {array}
   * @static
   */
  tracking.ViolaJones.classifiers = {};

  /**
   * Detects through the HAAR cascade data rectangles matches.
   * @param {pixels} pixels The pixels in a linear [r,g,b,a,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {number} initialScale The initial scale to start the block
   *     scaling.
   * @param {number} scaleFactor The scale factor to scale the feature block.
   * @param {number} stepSize The block step size.
   * @param {number} edgesDensity Percentage density edges inside the
   *     classifier block. Value from [0.0, 1.0], defaults to 0.2. If specified
   *     edge detection will be applied to the image to prune dead areas of the
   *     image, this can improve significantly performance.
   * @param {number} data The HAAR cascade data.
   * @return {array} Found rectangles.
   * @static
   */
  tracking.ViolaJones.detect = function(pixels, width, height, initialScale, scaleFactor, stepSize, edgesDensity, data) {
    var total = 0;
    var rects = [];
    var integralImage = new Int32Array(width * height);
    var integralImageSquare = new Int32Array(width * height);
    var tiltedIntegralImage = new Int32Array(width * height);

    var integralImageSobel;
    if (edgesDensity > 0) {
      integralImageSobel = new Int32Array(width * height);
    }

    tracking.Image.computeIntegralImage(pixels, width, height, integralImage, integralImageSquare, tiltedIntegralImage, integralImageSobel);

    var minWidth = data[0];
    var minHeight = data[1];
    var scale = initialScale * scaleFactor;
    var blockWidth = (scale * minWidth) | 0;
    var blockHeight = (scale * minHeight) | 0;

    while (blockWidth < width && blockHeight < height) {
      var step = (scale * stepSize + 0.5) | 0;
      for (var i = 0; i < (height - blockHeight); i += step) {
        for (var j = 0; j < (width - blockWidth); j += step) {

          if (edgesDensity > 0) {
            if (this.isTriviallyExcluded(edgesDensity, integralImageSobel, i, j, width, blockWidth, blockHeight)) {
              continue;
            }
          }

          if (this.evalStages_(data, integralImage, integralImageSquare, tiltedIntegralImage, i, j, width, blockWidth, blockHeight, scale)) {
            rects[total++] = {
              width: blockWidth,
              height: blockHeight,
              x: j,
              y: i
            };
          }
        }
      }

      scale *= scaleFactor;
      blockWidth = (scale * minWidth) | 0;
      blockHeight = (scale * minHeight) | 0;
    }
    return this.mergeRectangles_(rects);
  };

  /**
   * Fast check to test whether the edges density inside the block is greater
   * than a threshold, if true it tests the stages. This can improve
   * significantly performance.
   * @param {number} edgesDensity Percentage density edges inside the
   *     classifier block.
   * @param {array} integralImageSobel The integral image of a sobel image.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} width The image width.
   * @return {boolean} True whether the block at position i,j can be skipped,
   *     false otherwise.
   * @static
   * @protected
   */
  tracking.ViolaJones.isTriviallyExcluded = function(edgesDensity, integralImageSobel, i, j, width, blockWidth, blockHeight) {
    var wbA = i * width + j;
    var wbB = wbA + blockWidth;
    var wbD = wbA + blockHeight * width;
    var wbC = wbD + blockWidth;
    var blockEdgesDensity = (integralImageSobel[wbA] - integralImageSobel[wbB] - integralImageSobel[wbD] + integralImageSobel[wbC]) / (blockWidth * blockHeight * 255);
    if (blockEdgesDensity < edgesDensity) {
      return true;
    }
    return false;
  };

  /**
   * Evaluates if the block size on i,j position is a valid HAAR cascade
   * stage.
   * @param {number} data The HAAR cascade data.
   * @param {number} i Vertical position of the pixel to be evaluated.
   * @param {number} j Horizontal position of the pixel to be evaluated.
   * @param {number} width The image width.
   * @param {number} blockSize The block size.
   * @param {number} scale The scale factor of the block size and its original
   *     size.
   * @param {number} inverseArea The inverse area of the block size.
   * @return {boolean} Whether the region passes all the stage tests.
   * @private
   * @static
   */
  tracking.ViolaJones.evalStages_ = function(data, integralImage, integralImageSquare, tiltedIntegralImage, i, j, width, blockWidth, blockHeight, scale) {
    var inverseArea = 1.0 / (blockWidth * blockHeight);
    var wbA = i * width + j;
    var wbB = wbA + blockWidth;
    var wbD = wbA + blockHeight * width;
    var wbC = wbD + blockWidth;
    var mean = (integralImage[wbA] - integralImage[wbB] - integralImage[wbD] + integralImage[wbC]) * inverseArea;
    var variance = (integralImageSquare[wbA] - integralImageSquare[wbB] - integralImageSquare[wbD] + integralImageSquare[wbC]) * inverseArea - mean * mean;

    var standardDeviation = 1;
    if (variance > 0) {
      standardDeviation = Math.sqrt(variance);
    }

    var length = data.length;

    for (var w = 2; w < length; ) {
      var stageSum = 0;
      var stageThreshold = data[w++];
      var nodeLength = data[w++];

      while (nodeLength--) {
        var rectsSum = 0;
        var tilted = data[w++];
        var rectsLength = data[w++];

        for (var r = 0; r < rectsLength; r++) {
          var rectLeft = (j + data[w++] * scale + 0.5) | 0;
          var rectTop = (i + data[w++] * scale + 0.5) | 0;
          var rectWidth = (data[w++] * scale + 0.5) | 0;
          var rectHeight = (data[w++] * scale + 0.5) | 0;
          var rectWeight = data[w++];

          var w1;
          var w2;
          var w3;
          var w4;
          if (tilted) {
            // RectSum(r) = RSAT(x-h+w, y+w+h-1) + RSAT(x, y-1) - RSAT(x-h, y+h-1) - RSAT(x+w, y+w-1)
            w1 = (rectLeft - rectHeight + rectWidth) + (rectTop + rectWidth + rectHeight - 1) * width;
            w2 = rectLeft + (rectTop - 1) * width;
            w3 = (rectLeft - rectHeight) + (rectTop + rectHeight - 1) * width;
            w4 = (rectLeft + rectWidth) + (rectTop + rectWidth - 1) * width;
            rectsSum += (tiltedIntegralImage[w1] + tiltedIntegralImage[w2] - tiltedIntegralImage[w3] - tiltedIntegralImage[w4]) * rectWeight;
          } else {
            // RectSum(r) = SAT(x-1, y-1) + SAT(x+w-1, y+h-1) - SAT(x-1, y+h-1) - SAT(x+w-1, y-1)
            w1 = rectTop * width + rectLeft;
            w2 = w1 + rectWidth;
            w3 = w1 + rectHeight * width;
            w4 = w3 + rectWidth;
            rectsSum += (integralImage[w1] - integralImage[w2] - integralImage[w3] + integralImage[w4]) * rectWeight;
            // w1 = (rectLeft - 1) + (rectTop - 1) * width;
            // w2 = (rectLeft + rectWidth - 1) + (rectTop + rectHeight - 1) * width;
            // w3 = (rectLeft - 1) + (rectTop + rectHeight - 1) * width;
            // w4 = (rectLeft + rectWidth - 1) + (rectTop - 1) * width;
            // rectsSum += (integralImage[w1] + integralImage[w2] - integralImage[w3] - integralImage[w4]) * rectWeight;
          }
        }

        var nodeThreshold = data[w++];
        var nodeLeft = data[w++];
        var nodeRight = data[w++];

        if (rectsSum * inverseArea < nodeThreshold * standardDeviation) {
          stageSum += nodeLeft;
        } else {
          stageSum += nodeRight;
        }
      }

      if (stageSum < stageThreshold) {
        return false;
      }
    }
    return true;
  };

  /**
   * Postprocess the detected sub-windows in order to combine overlapping
   * detections into a single detection.
   * @param {array} rects
   * @return {array}
   * @private
   * @static
   */
  tracking.ViolaJones.mergeRectangles_ = function(rects) {
    var disjointSet = new tracking.DisjointSet(rects.length);

    for (var i = 0; i < rects.length; i++) {
      var r1 = rects[i];
      for (var j = 0; j < rects.length; j++) {
        var r2 = rects[j];
        if (tracking.Math.intersectRect(r1.x, r1.y, r1.x + r1.width, r1.y + r1.height, r2.x, r2.y, r2.x + r2.width, r2.y + r2.height)) {
          var x1 = Math.max(r1.x, r2.x);
          var y1 = Math.max(r1.y, r2.y);
          var x2 = Math.min(r1.x + r1.width, r2.x + r2.width);
          var y2 = Math.min(r1.y + r1.height, r2.y + r2.height);
          var overlap = (x1 - x2) * (y1 - y2);
          var area1 = (r1.width * r1.height);
          var area2 = (r2.width * r2.height);

          if ((overlap / (area1 * (area1 / area2)) >= this.REGIONS_OVERLAP) &&
            (overlap / (area2 * (area1 / area2)) >= this.REGIONS_OVERLAP)) {
            disjointSet.union(i, j);
          }
        }
      }
    }

    var map = {};
    for (var k = 0; k < disjointSet.length; k++) {
      var rep = disjointSet.find(k);
      if (!map[rep]) {
        map[rep] = {
          total: 1,
          width: rects[k].width,
          height: rects[k].height,
          x: rects[k].x,
          y: rects[k].y
        };
        continue;
      }
      map[rep].total++;
      map[rep].width += rects[k].width;
      map[rep].height += rects[k].height;
      map[rep].x += rects[k].x;
      map[rep].y += rects[k].y;
    }

    var result = [];
    Object.keys(map).forEach(function(key) {
      var rect = map[key];
      result.push({
        total: rect.total,
        width: (rect.width / rect.total + 0.5) | 0,
        height: (rect.height / rect.total + 0.5) | 0,
        x: (rect.x / rect.total + 0.5) | 0,
        y: (rect.y / rect.total + 0.5) | 0
      });
    });

    return result;
  };

}());

(function() {
  /**
   * Brief intends for "Binary Robust Independent Elementary Features".This
   * method generates a binary string for each keypoint found by an extractor
   * method.
   * @static
   * @constructor
   */
  tracking.Brief = {};

  /**
   * The set of binary tests is defined by the nd (x,y)-location pairs
   * uniquely chosen during the initialization. Values could vary between N =
   * 128,256,512. N=128 yield good compromises between speed, storage
   * efficiency, and recognition rate.
   * @type {number}
   */
  tracking.Brief.N = 512;

  /**
   * Caches coordinates values of (x,y)-location pairs uniquely chosen during
   * the initialization.
   * @type {Object.<number, Int32Array>}
   * @private
   * @static
   */
  tracking.Brief.randomImageOffsets_ = {};

  /**
   * Caches delta values of (x,y)-location pairs uniquely chosen during
   * the initialization.
   * @type {Int32Array}
   * @private
   * @static
   */
  tracking.Brief.randomWindowOffsets_ = null;

  /**
   * Generates a binary string for each found keypoints extracted using an
   * extractor method.
   * @param {array} The grayscale pixels in a linear [p1,p2,...] array.
   * @param {number} width The image width.
   * @param {array} keypoints
   * @return {Int32Array} Returns an array where for each four sequence int
   *     values represent the descriptor binary string (128 bits) necessary
   *     to describe the corner, e.g. [0,0,0,0, 0,0,0,0, ...].
   * @static
   */
  tracking.Brief.getDescriptors = function(pixels, width, keypoints) {
    // Optimizing divide by 32 operation using binary shift
    // (this.N >> 5) === this.N/32.
    var descriptors = new Int32Array((keypoints.length >> 1) * (this.N >> 5));
    var descriptorWord = 0;
    var offsets = this.getRandomOffsets_(width);
    var position = 0;

    for (var i = 0; i < keypoints.length; i += 2) {
      var w = width * keypoints[i + 1] + keypoints[i];

      var offsetsPosition = 0;
      for (var j = 0, n = this.N; j < n; j++) {
        if (pixels[offsets[offsetsPosition++] + w] < pixels[offsets[offsetsPosition++] + w]) {
          // The bit in the position `j % 32` of descriptorWord should be set to 1. We do
          // this by making an OR operation with a binary number that only has the bit
          // in that position set to 1. That binary number is obtained by shifting 1 left by
          // `j % 32` (which is the same as `j & 31` left) positions.
          descriptorWord |= 1 << (j & 31);
        }

        // If the next j is a multiple of 32, we will need to use a new descriptor word to hold
        // the next results.
        if (!((j + 1) & 31)) {
          descriptors[position++] = descriptorWord;
          descriptorWord = 0;
        }
      }
    }

    return descriptors;
  };

  /**
   * Matches sets of features {mi} and {m′j} extracted from two images taken
   * from similar, and often successive, viewpoints. A classical procedure
   * runs as follows. For each point {mi} in the first image, search in a
   * region of the second image around location {mi} for point {m′j}. The
   * search is based on the similarity of the local image windows, also known
   * as kernel windows, centered on the points, which strongly characterizes
   * the points when the images are sufficiently close. Once each keypoint is
   * described with its binary string, they need to be compared with the
   * closest matching point. Distance metric is critical to the performance of
   * in- trusion detection systems. Thus using binary strings reduces the size
   * of the descriptor and provides an interesting data structure that is fast
   * to operate whose similarity can be measured by the Hamming distance.
   * @param {array} keypoints1
   * @param {array} descriptors1
   * @param {array} keypoints2
   * @param {array} descriptors2
   * @return {Int32Array} Returns an array where the index is the corner1
   *     index coordinate, and the value is the corresponding match index of
   *     corner2, e.g. keypoints1=[x0,y0,x1,y1,...] and
   *     keypoints2=[x'0,y'0,x'1,y'1,...], if x0 matches x'1 and x1 matches x'0,
   *     the return array would be [3,0].
   * @static
   */
  tracking.Brief.match = function(keypoints1, descriptors1, keypoints2, descriptors2) {
    var len1 = keypoints1.length >> 1;
    var len2 = keypoints2.length >> 1;
    var matches = new Array(len1);

    for (var i = 0; i < len1; i++) {
      var min = Infinity;
      var minj = 0;
      for (var j = 0; j < len2; j++) {
        var dist = 0;
        // Optimizing divide by 32 operation using binary shift
        // (this.N >> 5) === this.N/32.
        for (var k = 0, n = this.N >> 5; k < n; k++) {
          dist += tracking.Math.hammingWeight(descriptors1[i * n + k] ^ descriptors2[j * n + k]);
        }
        if (dist < min) {
          min = dist;
          minj = j;
        }
      }
      matches[i] = {
        index1: i,
        index2: minj,
        keypoint1: [keypoints1[2 * i], keypoints1[2 * i + 1]],
        keypoint2: [keypoints2[2 * minj], keypoints2[2 * minj + 1]],
        confidence: 1 - min / this.N
      };
    }

    return matches;
  };

  /**
   * Removes matches outliers by testing matches on both directions.
   * @param {array} keypoints1
   * @param {array} descriptors1
   * @param {array} keypoints2
   * @param {array} descriptors2
   * @return {Int32Array} Returns an array where the index is the corner1
   *     index coordinate, and the value is the corresponding match index of
   *     corner2, e.g. keypoints1=[x0,y0,x1,y1,...] and
   *     keypoints2=[x'0,y'0,x'1,y'1,...], if x0 matches x'1 and x1 matches x'0,
   *     the return array would be [3,0].
   * @static
   */
  tracking.Brief.reciprocalMatch = function(keypoints1, descriptors1, keypoints2, descriptors2) {
    var matches = [];
    if (keypoints1.length === 0 || keypoints2.length === 0) {
      return matches;
    }

    var matches1 = tracking.Brief.match(keypoints1, descriptors1, keypoints2, descriptors2);
    var matches2 = tracking.Brief.match(keypoints2, descriptors2, keypoints1, descriptors1);
    for (var i = 0; i < matches1.length; i++) {
      if (matches2[matches1[i].index2].index2 === i) {
        matches.push(matches1[i]);
      }
    }
    return matches;
  };

  /**
   * Gets the coordinates values of (x,y)-location pairs uniquely chosen
   * during the initialization.
   * @return {array} Array with the random offset values.
   * @private
   */
  tracking.Brief.getRandomOffsets_ = function(width) {
    if (!this.randomWindowOffsets_) {
      var windowPosition = 0;
      var windowOffsets = new Int32Array(4 * this.N);
      for (var i = 0; i < this.N; i++) {
        windowOffsets[windowPosition++] = Math.round(tracking.Math.uniformRandom(-15, 16));
        windowOffsets[windowPosition++] = Math.round(tracking.Math.uniformRandom(-15, 16));
        windowOffsets[windowPosition++] = Math.round(tracking.Math.uniformRandom(-15, 16));
        windowOffsets[windowPosition++] = Math.round(tracking.Math.uniformRandom(-15, 16));
      }
      this.randomWindowOffsets_ = windowOffsets;
    }

    if (!this.randomImageOffsets_[width]) {
      var imagePosition = 0;
      var imageOffsets = new Int32Array(2 * this.N);
      for (var j = 0; j < this.N; j++) {
        imageOffsets[imagePosition++] = this.randomWindowOffsets_[4 * j] * width + this.randomWindowOffsets_[4 * j + 1];
        imageOffsets[imagePosition++] = this.randomWindowOffsets_[4 * j + 2] * width + this.randomWindowOffsets_[4 * j + 3];
      }
      this.randomImageOffsets_[width] = imageOffsets;
    }

    return this.randomImageOffsets_[width];
  };
}());

(function() {
  /**
   * FAST intends for "Features from Accelerated Segment Test". This method
   * performs a point segment test corner detection. The segment test
   * criterion operates by considering a circle of sixteen pixels around the
   * corner candidate p. The detector classifies p as a corner if there exists
   * a set of n contiguous pixelsin the circle which are all brighter than the
   * intensity of the candidate pixel Ip plus a threshold t, or all darker
   * than Ip − t.
   *
   *       15 00 01
   *    14          02
   * 13                03
   * 12       []       04
   * 11                05
   *    10          06
   *       09 08 07
   *
   * For more reference:
   * http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.60.3991&rep=rep1&type=pdf
   * @static
   * @constructor
   */
  tracking.Fast = {};

  /**
   * Holds the threshold to determine whether the tested pixel is brighter or
   * darker than the corner candidate p.
   * @type {number}
   * @default 40
   * @static
   */
  tracking.Fast.THRESHOLD = 40;

  /**
   * Caches coordinates values of the circle surrounding the pixel candidate p.
   * @type {Object.<number, Int32Array>}
   * @private
   * @static
   */
  tracking.Fast.circles_ = {};

  /**
   * Finds corners coordinates on the graysacaled image.
   * @param {array} The grayscale pixels in a linear [p1,p2,...] array.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {number} threshold to determine whether the tested pixel is brighter or
   *     darker than the corner candidate p. Default value is 40.
   * @return {array} Array containing the coordinates of all found corners,
   *     e.g. [x0,y0,x1,y1,...], where P(x0,y0) represents a corner coordinate.
   * @static
   */
  tracking.Fast.findCorners = function(pixels, width, height, opt_threshold) {
    var circleOffsets = this.getCircleOffsets_(width);
    var circlePixels = new Int32Array(16);
    var corners = [];

    if (opt_threshold === undefined) {
      opt_threshold = this.THRESHOLD;
    }

    // When looping through the image pixels, skips the first three lines from
    // the image boundaries to constrain the surrounding circle inside the image
    // area.
    for (var i = 3; i < height - 3; i++) {
      for (var j = 3; j < width - 3; j++) {
        var w = i * width + j;
        var p = pixels[w];

        // Loops the circle offsets to read the pixel value for the sixteen
        // surrounding pixels.
        for (var k = 0; k < 16; k++) {
          circlePixels[k] = pixels[w + circleOffsets[k]];
        }

        if (this.isCorner(p, circlePixels, opt_threshold)) {
          // The pixel p is classified as a corner, as optimization increment j
          // by the circle radius 3 to skip the neighbor pixels inside the
          // surrounding circle. This can be removed without compromising the
          // result.
          corners.push(j, i);
          j += 3;
        }
      }
    }

    return corners;
  };

  /**
   * Checks if the circle pixel is brighter than the candidate pixel p by
   * a threshold.
   * @param {number} circlePixel The circle pixel value.
   * @param {number} p The value of the candidate pixel p.
   * @param {number} threshold
   * @return {Boolean}
   * @static
   */
  tracking.Fast.isBrighter = function(circlePixel, p, threshold) {
    return circlePixel - p > threshold;
  };

  /**
   * Checks if the circle pixel is within the corner of the candidate pixel p
   * by a threshold.
   * @param {number} p The value of the candidate pixel p.
   * @param {number} circlePixel The circle pixel value.
   * @param {number} threshold
   * @return {Boolean}
   * @static
   */
  tracking.Fast.isCorner = function(p, circlePixels, threshold) {
    if (this.isTriviallyExcluded(circlePixels, p, threshold)) {
      return false;
    }

    for (var x = 0; x < 16; x++) {
      var darker = true;
      var brighter = true;

      for (var y = 0; y < 9; y++) {
        var circlePixel = circlePixels[(x + y) & 15];

        if (!this.isBrighter(p, circlePixel, threshold)) {
          brighter = false;
          if (darker === false) {
            break;
          }
        }

        if (!this.isDarker(p, circlePixel, threshold)) {
          darker = false;
          if (brighter === false) {
            break;
          }
        }
      }

      if (brighter || darker) {
        return true;
      }
    }

    return false;
  };

  /**
   * Checks if the circle pixel is darker than the candidate pixel p by
   * a threshold.
   * @param {number} circlePixel The circle pixel value.
   * @param {number} p The value of the candidate pixel p.
   * @param {number} threshold
   * @return {Boolean}
   * @static
   */
  tracking.Fast.isDarker = function(circlePixel, p, threshold) {
    return p - circlePixel > threshold;
  };

  /**
   * Fast check to test if the candidate pixel is a trivially excluded value.
   * In order to be a corner, the candidate pixel value should be darker or
   * brighter than 9-12 surrounding pixels, when at least three of the top,
   * bottom, left and right pixels are brighter or darker it can be
   * automatically excluded improving the performance.
   * @param {number} circlePixel The circle pixel value.
   * @param {number} p The value of the candidate pixel p.
   * @param {number} threshold
   * @return {Boolean}
   * @static
   * @protected
   */
  tracking.Fast.isTriviallyExcluded = function(circlePixels, p, threshold) {
    var count = 0;
    var circleBottom = circlePixels[8];
    var circleLeft = circlePixels[12];
    var circleRight = circlePixels[4];
    var circleTop = circlePixels[0];

    if (this.isBrighter(circleTop, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleRight, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleBottom, p, threshold)) {
      count++;
    }
    if (this.isBrighter(circleLeft, p, threshold)) {
      count++;
    }

    if (count < 3) {
      count = 0;
      if (this.isDarker(circleTop, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleRight, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleBottom, p, threshold)) {
        count++;
      }
      if (this.isDarker(circleLeft, p, threshold)) {
        count++;
      }
      if (count < 3) {
        return true;
      }
    }

    return false;
  };

  /**
   * Gets the sixteen offset values of the circle surrounding pixel.
   * @param {number} width The image width.
   * @return {array} Array with the sixteen offset values of the circle
   *     surrounding pixel.
   * @private
   */
  tracking.Fast.getCircleOffsets_ = function(width) {
    if (this.circles_[width]) {
      return this.circles_[width];
    }

    var circle = new Int32Array(16);

    circle[0] = -width - width - width;
    circle[1] = circle[0] + 1;
    circle[2] = circle[1] + width + 1;
    circle[3] = circle[2] + width + 1;
    circle[4] = circle[3] + width;
    circle[5] = circle[4] + width;
    circle[6] = circle[5] + width - 1;
    circle[7] = circle[6] + width - 1;
    circle[8] = circle[7] - 1;
    circle[9] = circle[8] - 1;
    circle[10] = circle[9] - width - 1;
    circle[11] = circle[10] - width - 1;
    circle[12] = circle[11] - width;
    circle[13] = circle[12] - width;
    circle[14] = circle[13] - width + 1;
    circle[15] = circle[14] - width + 1;

    this.circles_[width] = circle;
    return circle;
  };
}());

(function() {
  /**
   * Math utility.
   * @static
   * @constructor
   */
  tracking.Math = {};

  /**
   * Euclidean distance between two points P(x0, y0) and P(x1, y1).
   * @param {number} x0 Horizontal coordinate of P0.
   * @param {number} y0 Vertical coordinate of P0.
   * @param {number} x1 Horizontal coordinate of P1.
   * @param {number} y1 Vertical coordinate of P1.
   * @return {number} The euclidean distance.
   */
  tracking.Math.distance = function(x0, y0, x1, y1) {
    var dx = x1 - x0;
    var dy = y1 - y0;

    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Calculates the Hamming weight of a string, which is the number of symbols that are
   * different from the zero-symbol of the alphabet used. It is thus
   * equivalent to the Hamming distance from the all-zero string of the same
   * length. For the most typical case, a string of bits, this is the number
   * of 1's in the string.
   *
   * Example:
   *
   * <pre>
   *  Binary string     Hamming weight
   *   11101                 4
   *   11101010              5
   * </pre>
   *
   * @param {number} i Number that holds the binary string to extract the hamming weight.
   * @return {number} The hamming weight.
   */
  tracking.Math.hammingWeight = function(i) {
    i = i - ((i >> 1) & 0x55555555);
    i = (i & 0x33333333) + ((i >> 2) & 0x33333333);

    return ((i + (i >> 4) & 0xF0F0F0F) * 0x1010101) >> 24;
  };

  /**
   * Generates a random number between [a, b] interval.
   * @param {number} a
   * @param {number} b
   * @return {number}
   */
  tracking.Math.uniformRandom = function(a, b) {
    return a + Math.random() * (b - a);
  };

  /**
   * Tests if a rectangle intersects with another.
   *
   *  <pre>
   *  x0y0 --------       x2y2 --------
   *      |       |           |       |
   *      -------- x1y1       -------- x3y3
   * </pre>
   *
   * @param {number} x0 Horizontal coordinate of P0.
   * @param {number} y0 Vertical coordinate of P0.
   * @param {number} x1 Horizontal coordinate of P1.
   * @param {number} y1 Vertical coordinate of P1.
   * @param {number} x2 Horizontal coordinate of P2.
   * @param {number} y2 Vertical coordinate of P2.
   * @param {number} x3 Horizontal coordinate of P3.
   * @param {number} y3 Vertical coordinate of P3.
   * @return {boolean}
   */
  tracking.Math.intersectRect = function(x0, y0, x1, y1, x2, y2, x3, y3) {
    return !(x2 > x1 || x3 < x0 || y2 > y1 || y3 < y0);
  };

}());

(function() {
  /**
   * Matrix utility.
   * @static
   * @constructor
   */
  tracking.Matrix = {};

  /**
   * Loops the array organized as major-row order and executes `fn` callback
   * for each iteration. The `fn` callback receives the following parameters:
   * `(r,g,b,a,index,i,j)`, where `r,g,b,a` represents the pixel color with
   * alpha channel, `index` represents the position in the major-row order
   * array and `i,j` the respective indexes positions in two dimensions.
   * @param {array} pixels The pixels in a linear [r,g,b,a,...] array to loop
   *     through.
   * @param {number} width The image width.
   * @param {number} height The image height.
   * @param {function} fn The callback function for each pixel.
   * @param {number} opt_jump Optional jump for the iteration, by default it
   *     is 1, hence loops all the pixels of the array.
   * @static
   */
  tracking.Matrix.forEach = function(pixels, width, height, fn, opt_jump) {
    opt_jump = opt_jump || 1;
    for (var i = 0; i < height; i += opt_jump) {
      for (var j = 0; j < width; j += opt_jump) {
        var w = i * width * 4 + j * 4;
        fn.call(this, pixels[w], pixels[w + 1], pixels[w + 2], pixels[w + 3], w, i, j);
      }
    }
  };

}());

(function() {
  /**
   * EPnp utility.
   * @static
   * @constructor
   */
  tracking.EPnP = {};

  tracking.EPnP.solve = function(objectPoints, imagePoints, cameraMatrix) {};
}());

(function() {
  /**
   * Glorious-Dawn: custom additional initialization   *
   */
  tracking.Fast.THRESHOLD=20;
  tracking.Brief.randomWindowOffsets_=Int32Array.from([4,0,-7,-4,-2,5,4,7,2,-10,15,-11,6,-6,0,7,11,-9,-6,6,-5,14,9,-14,-9,-5,-6,-2,1,-1,13,-1,-2,-6,11,-10,-1,-11,-3,4,12,1,11,13,3,-13,7,8,3,14,-15,3,9,-2,10,-5,-1,3,10,7,13,-10,-8,1,-7,10,-11,8,-6,15,4,15,-4,6,14,-10,9,-5,0,11,-13,-7,-15,11,14,6,3,6,-3,-13,10,-3,-4,3,-8,12,-14,11,-14,1,-6,-2,3,14,10,14,4,13,10,15,2,5,1,1,9,-8,-10,13,-15,-9,-14,-7,9,7,-9,7,12,2,10,-14,7,0,-10,6,-15,-13,1,11,6,-8,8,-12,9,14,1,15,5,-10,2,3,9,8,-2,-4,13,-5,-8,0,-7,-3,13,-11,-7,10,13,-3,8,2,4,13,12,7,-6,4,15,1,-11,6,15,11,-5,-5,-1,-15,11,9,9,11,-5,-3,-7,-5,0,-8,1,-6,-4,-10,-5,1,0,15,15,-12,-11,-10,-6,12,10,-6,-8,0,6,-4,-7,-9,3,-9,-15,8,-7,-11,-2,7,-4,8,7,8,-3,5,4,-4,-9,4,5,-1,-7,-1,11,-5,-5,14,5,13,-14,13,6,-9,11,4,16,-7,-9,13,-15,-15,-2,10,-4,13,-11,15,11,6,10,-14,0,5,-12,1,-3,-10,0,3,10,-5,9,-9,10,1,-7,-13,-10,9,-5,-3,-4,-12,-13,-8,13,11,2,15,7,-9,-3,-5,0,13,12,2,-11,-8,-2,-9,14,-3,-11,8,-4,14,-4,12,4,-4,-13,5,3,2,4,-2,-6,-2,-5,14,3,-11,-1,2,-7,-6,-11,-7,11,3,-10,2,-11,14,8,-11,4,-2,4,3,1,-15,6,4,2,-4,0,0,4,-9,-8,11,3,-3,-11,-13,9,2,-8,3,15,15,0,7,-12,13,-4,5,10,-9,2,-2,-11,-5,-4,-5,-9,14,7,-2,-7,-2,10,-3,-1,2,-15,-13,14,8,-14,-10,-14,-14,5,13,-2,1,6,7,12,5,-2,-11,-7,-1,13,-9,10,16,-6,-12,4,-10,-8,-1,-13,16,6,8,-13,-4,13,1,-10,-6,13,-12,15,-5,-9,10,-3,4,7,2,-7,9,-1,7,-2,9,-5,2,11,1,12,-9,-5,-9,-5,9,-2,11,10,-11,-5,2,15,-9,-14,2,-15,-15,-6,14,-11,-3,-6,-6,-9,-9,-9,-13,12,-3,-14,-14,0,16,-12,6,0,-12,-12,15,-2,5,4,-1,-8,9,-5,-8,-6,-1,-12,15,-11,11,-9,9,-2,-15,-8,-5,-1,-12,4,-2,14,-10,8,-3,-13,3,-13,-5,15,2,14,9,-13,5,0,4,-8,4,7,5,3,-11,-3,2,6,0,-2,-11,1,13,-4,9,-2,-11,13,6,-2,-9,-2,1,14,4,15,12,12,3,8,15,-14,-6,16,-13,-10,-13,0,-13,-5,-2,-4,4,-2,14,-3,-4,5,14,9,0,14,12,9,14,7,-2,-12,12,-11,4,1,2,0,-9,-10,8,15,7,-10,10,13,-12,-6,10,2,15,3,15,5,0,-3,10,1,16,-2,-4,-3,13,13,2,8,-1,-5,15,5,1,3,11,-6,0,14,11,-2,-9,6,-5,11,10,-6,15,7,10,-9,-8,-10,-8,-15,-12,-9,6,-2,-14,8,5,4,-4,-4,14,-7,10,5,-14,-6,7,12,3,12,4,-3,-14,7,-8,-7,-1,3,4,-11,-12,10,12,-4,2,-15,-14,7,12,5,10,9,-14,-9,-12,-10,12,5,13,8,-13,2,-8,7,-8,5,-11,-1,5,4,-9,5,-12,-5,7,-2,8,0,10,16,-11,-4,-2,12,13,6,2,12,6,10,10,-6,-14,-4,-6,-7,-11,1,-12,-4,11,9,7,-1,6,-4,-11,3,-4,-5,-2,14,-14,-11,5,2,8,13,-11,13,6,-12,2,7,11,11,5,-4,7,-13,-9,10,0,-3,11,-8,-9,16,4,9,9,-14,9,-14,-1,-10,-7,-12,-6,12,3,-5,9,16,8,0,4,-6,12,13,15,14,9,9,-8,-13,1,12,-11,-2,10,9,-11,-9,4,13,15,-5,8,11,10,-10,-12,1,14,-9,2,-6,2,-9,12,-9,-4,-3,-6,-14,4,-11,-13,11,12,6,14,-12,15,-2,7,-15,1,4,-8,2,13,0,6,3,12,-4,-6,-8,7,14,0,-1,-3,-6,12,-2,-15,-4,-13,-11,8,-8,6,7,-2,-13,8,0,-5,-4,0,10,-13,10,5,16,-6,14,3,12,3,9,10,8,-1,0,-9,10,-6,9,11,6,13,3,9,15,9,-11,-2,6,7,-3,-13,16,4,-14,-7,-11,-11,6,9,-8,-15,-2,8,-7,3,15,3,5,-3,11,2,-15,8,10,-12,5,15,5,15,-1,3,-10,11,-5,7,-6,-5,-5,-7,-6,7,-6,14,13,-7,-2,-15,3,-13,-2,-8,-8,6,0,14,-15,12,-11,-1,1,-1,2,15,1,-11,4,-9,13,-6,12,5,8,-1,-8,-11,5,8,14,-4,5,3,-14,-1,-12,-11,-7,1,5,14,-8,3,-2,8,14,0,-7,-4,-4,12,0,10,1,-15,-14,10,-1,4,11,-12,-11,11,-4,8,-3,4,4,-10,10,-14,0,-12,15,-10,-8,4,-10,16,14,13,0,-4,-2,-9,-9,-1,2,16,11,8,-14,7,-7,8,-5,-5,5,5,-10,7,11,-5,8,-5,-11,0,-1,-11,10,6,8,-9,8,14,11,0,6,8,15,-3,-15,5,5,12,7,-13,-12,-1,0,16,5,-3,-7,0,10,8,-6,-2,8,-13,13,1,14,-5,1,2,-9,-13,3,-10,15,2,16,6,-8,15,-8,4,8,-5,-2,5,14,10,7,3,-6,-3,3,-13,-3,-14,1,-12,13,15,3,7,-9,4,-8,10,-13,-3,-3,-1,-6,-14,-11,-6,4,-11,12,-8,1,2,10,1,-2,-8,2,-13,14,1,4,0,8,15,-1,4,0,-7,-3,16,8,0,9,0,-4,-2,-2,7,4,-9,15,-7,14,2,-8,7,-13,-6,1,12,-8,-7,3,-2,13,-14,10,-14,2,-13,-1,-4,9,-3,15,-11,-6,10,-4,-14,-4,6,-3,-11,-9,-1,-7,3,-3,3,0,12,6,5,-10,10,-14,-12,-4,8,-7,11,5,15,14,-4,4,-5,-11,-7,1,-6,-13,-7,-12,10,13,-13,14,7,-13,-8,11,5,12,-6,-11,-13,-12,-5,12,13,-5,-5,-11,-2,6,8,-1,-10,6,6,14,3,5,3,-14,-12,1,-12,14,13,-4,10,7,13,-15,-8,-7,-14,8,12,-2,-15,10,12,-9,1,0,2,12,8,4,-10,-13,-12,-4,-9,16,-6,-4,-8,6,-6,-9,-10,2,1,6,3,-8,-6,1,6,13,16,-15,15,14,0,10,-5,16,11,-2,15,2,1,7,-6,-8,12,9,12,9,-9,-4,-11,-13,-14,3,1,-3,-11,13,-8,0,3,12,-4,6,15,1,-12,-4,14,-2,11,3,4,1,7,1,2,14,-5,-8,0,-3,-8,-4,-14,11,-12,-14,2,5,15,1,11,2,9,-15,9,4,6,-3,-5,-10,-9,-8,11,13,8,16,3,9,15,9,-1,-12,-2,-7,-10,-6,-7,15,-13,-13,6,6,11,14,-15,14,15,6,0,-7,-9,6,-5,-11,-12,-4,-11,-9,-1,-9,-14,16,16,3,-4,11,10,-3,13,-13,0,8,0,-6,13,-5,14,3,-10,-3,11,-9,8,-12,-8,12,5,-12,-13,5,-14,-8,-5,-12,-6,-12,0,1,-9,-5,7,2,11,-3,-6,7,0,9,-7,12,3,-7,15,4,1,-10,9,-12,-10,2,16,0,15,-14,-6,14,-3,-7,-8,4,-7,-6,-10,-1,-2,-10,13,14,0,-3,11,-6,-14,-11,6,7,-3,14,-15,7,-6,6,-8,-8,11,-1,10,-5,-14,16,-11,-6,-15,15,-14,-12,4,11,-9,-3,-3,-3,14,16,-15,13,13,10,5,14,6,-4,5,11,1,-15,8,4,0,-12,-3,4,12,14,3,-7,-4,1,14,13,-9,2,16,12,1,5,-4,3,13,-2,12,-11,-2,5,13,-3,2,14,-3,-3,0,0,-1,-9,2,-13,-3,-5,6,-6,15,12,2,-13,1,-6,-10,5,3,9,-14,-13,-5,-3,6,1,-8,12,-2,13,12,-13,-13,6,-11,5,-3,4,2,5,-13,-12,-8,-8,-7,-10,-3,-12,15,-8,2,14,-13,7,-4,10,-1,8,-10,1,4,16,11,8,13,7,-12,8,-11,7,-15,-3,-5,3,-6,-6,4,6,6,13,3,-8,3,2,-6,2,-3,5,-12,3,-2,4,8,-10,-8,-3,-1,-4,-8,6,-6,2,4,3,-9,5,12,-9,-1,2,13,-11,9,7,-8,5,12,-2,7,-2,3,-14,-2,-14,5,-12,-10,7,-8,-10,-6,13,12,-10,5,10,-9,-12,3,10,-6,-6,5,-5,-6,-9,1,-8,-15,1,-13,-3,6,10,3,1,15,-9,3,-4,16,13,-2,-12,13,-6,11,2,-4,10,-5,-2,-15,3,-11,-13,5,-5,16,-3,10,15,9,5,9,8,0,-3,3,5,14,0,8,15,10,9,11,6,-14,-10,3,-3,10,-2,-14,-14,-5,12,0,3,4,-3,2,-12,-7,12,-12,-2,-1,-11,6,3,9,9,-8,-11,14,-6,15,3,-7,2,-7,-10,11,-5,13,8,5,2,15,-5,-11,7,-8,-7,0,-1,-4,5,-7,1,14,1,11,12,7,4,0,-13,-10,-8,3,10,10,-13,-7,-15,-6,13,-1,-6,1,-2,12,-3,14,15,-10,5,9,-3,12,10,-1,0,14,6,-6,11,7,9,-11,-3,-13,11,-5,0,-7,-6,-9,-8,-1,-4,-14,-9,-2,16,14,-15,14,4,0,11,-13,12,2,6,14,0,3,12,13,12,-6,-10,-12,-3,0,10,-12,-12,-13,-10,-12,-10,-2,5,-6,-4,-11,-15,-14,-6,2,-10,12,1,15,16,-6,6,2,11,5,0,9,-4,16,-15,8,13,11,10,-1,14,11,-7,13,0,11,8,-4,-9,-14,14,-14,5,16,-15,11,-3,8,10,-14,9,-14,10,-14,10,6,-9,10,8,7,-9,-9,15,-14,0,14,8,-9,5,13,0,0,-7,0,-11,2,9,-8,7,-9,-7,13,-12,10,4,14,7,7,12,-15,16,-4,-14,-12,8,5,8,-4,12,1,2,-13,3,-4,-2,-5]);

  // Used to eliminate the randomness when feature extractor needs to be stored and reused
  tracking.Brief.setRandomWindowOffsets=function(windowOffsets){
    this.randomImageOffsets_={};
    this.randomWindowOffsets_=Int32Array.from(windowOffsets);
  };

  tracking.Brief.generateRandomWindowOffsets=function(){
    var windowPosition = 0;
    var windowOffsets = new Int32Array(4 * this.N);
    for (var i = 0; i < this.N; i++) {
      windowOffsets[windowPosition++] = Math.round(tracking.Math.uniformRandom(-15, 16));
      windowOffsets[windowPosition++] = Math.round(tracking.Math.uniformRandom(-15, 16));
      windowOffsets[windowPosition++] = Math.round(tracking.Math.uniformRandom(-15, 16));
      windowOffsets[windowPosition++] = Math.round(tracking.Math.uniformRandom(-15, 16));
    }
    return windowOffsets;
  };

}());

module.exports=tracking;