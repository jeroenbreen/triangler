function Triangle(app, a, b, c, color) {
    this.app = app;
    this.A = a;
    this.B = b;
    this.C = c;
    this.color = color;
    this.deviation = 0;
}

Triangle.prototype.update = function() {
    this.updatePixels();
    this.updateColor();
    this.updateDeviation();
};

Triangle.prototype.updatePixels = function() {
    // this function finds the pixels corresponding with the triangle by
    // drawing the triangle black on white, outputting the imagedata of that
    // and then finding the pixels with color value < 255
    var triangleData,
        pixelIndex = 0,
        pixels = [];
    // draw a black triangle on a white canvas
    var ctx = this.app.canvas.triangle.context;
    this.app.canvas.triangle.clear();

    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.moveTo (this.A.x, this.A.y);
    ctx.lineTo (this.B.x, this.B.y);
    ctx.lineTo (this.C.x, this.C.y);
    ctx.closePath();
    ctx.fill();
    // find the black pixels
    triangleData = this.app.canvas.triangle.getImageData();
    for (var i = 0; i < this.app.settings.bits; i += 4) {
        if (triangleData[i] < 255) {
            pixels[pixelIndex] = i;
            pixelIndex++;
        }
    }
    this.pixels = pixels;
};

Triangle.prototype.updateColor = function() {
    var red = 0,
        green = 0,
        blue = 0,
        pixels = this.pixels,
        l = pixels.length,
        r,
        g,
        b;
    // count total red, green and blue of the area of the triangle in the original data
    for (var i = 0; i < l; i ++) {
        var pixel = pixels[i];
        red += this.app.imageData[pixel];
        green += this.app.imageData[pixel + 1];
        blue += this.app.imageData[pixel + 2];
    }
    // find the average red, green and blue
    r = Math.round (red / l);
    g = Math.round (green / l);
    b = Math.round (blue / l);
    this.color = [r, g, b];
};

Triangle.prototype.updateDeviation = function() {
    var deviation = 0,
        l = this.pixels.length,
        multiplier = 1 + l / 500;
    for (var i = 0; i < l; i++) {
        var pixel = this.pixels[i];
        deviation += Math.abs(this.app.imageData[pixel] - this.color[0]);
        deviation += Math.abs(this.app.imageData[pixel + 1] - this.color[1]);
        deviation += Math.abs(this.app.imageData[pixel + 2] - this.color[2]);
    }
    this.deviation = deviation * multiplier;
};

Triangle.prototype.getLongestSide = function() {
    // return two Points
    var side = [];
    side[0] = [this.pi(this.A, this.B), this.A, this.B];
    side[1] = [this.pi(this.A, this.C), this.A, this.C];
    side[2] = [this.pi(this.B, this.C), this.B, this.C];
    side.sort ( function (a, b) { return b[0] - a[0] } );
    return [side[0][1], side[0][2]];
};

Triangle.prototype.pi = function(a, b) {
    return Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2);
};
