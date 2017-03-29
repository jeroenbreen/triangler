function Canvas(app, name, size) {
    this.app = app;
    this.name = name;
    this.size = size;
    this.element = null;
    this.context = null;
    this.init();
}

Canvas.prototype.init = function(obj, id, resize) {
    this.element = document.getElementById('canvas-' + this.name);
    this.context = this.element.getContext ('2d');
};

Canvas.prototype.scale = function() {
    this.element.setAttribute ('width', this.size * this.app.settings.width);
    this.element.setAttribute ('height', this.size * this.app.settings.height);
};

Canvas.prototype.drawBackground = function() {
    var ctx = this.context;
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, 500, 500);
};

Canvas.prototype.clear = function() {
    var ctx = this.context;
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, this.size * this.app.settings.width, this.size * this.app.settings.height);
};



Canvas.prototype.drawTriangles = function(set) {
    var ctx = this.context;
    for (var i = 0, l = set.length; i < l; i++) {
        var triangle = set[i];
        ctx.fillStyle = 'rgba(' + triangle.color + ', 1)';
        ctx.beginPath();
        ctx.moveTo(this.size * triangle.A.x, this.size * triangle.A.y);
        ctx.lineTo(this.size * triangle.B.x, this.size * triangle.B.y);
        ctx.lineTo(this.size * triangle.C.x, this.size * triangle.C.y);
        ctx.closePath();
        ctx.fill();
    }
};

Canvas.prototype.drawImage = function() {
    this.context.drawImage(image, 0, 0, this.size * this.app.settings.width, this.size * this.app.settings.height);
};

Canvas.prototype.getImageData = function() {
    return this.context.getImageData (0, 0, this.size * this.app.settings.width, this.size * this.app.settings.height).data;
};





