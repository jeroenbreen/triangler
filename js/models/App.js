function App() {
    this.imageData = null;
    this.points = [];
    this.triangles = [];
    this.canvas = {
        original: null,
        triangle: null,
        best: null
    };
    this.settings = {
        width: 0,
        height: 0,
        bits: 0,
        window: {
            height: 0,
            width: 0
        },
        scale: 0
    };

    this.timer = null;
    this.init();
}

// initialisation

App.prototype.init = function (src) {
    var contentFrame = $('#inn-content');
    this.canvas.original = new Canvas(this, 'original', 1);
    this.canvas.triangle = new Canvas(this, 'triangle', 1);
    this.settings.window.height = contentFrame.outerHeight() - 40;
    this.settings.window.width = contentFrame.outerWidth() - 200;
};

App.prototype.loadImage = function (src) {
    var self = this;
    image.onload = function() {
        if (image.height > settings.image.height) {
            image.width = image.width * settings.image.height / image.height;
            image.height = settings.image.height;
        }
        self.setScale(image);
        if(image.complete) {
            self.set();
        }
        else {
            setTimeout(self.set(), 100);
        }
    };
    image.src = src;
};

App.prototype.setScale = function (image) {
    var ratioWindow = this.settings.window.width / this.settings.window.height,
        ratioImage = image.width / image.height;
    if (ratioWindow > ratioImage) {
        this.settings.scale = this.settings.window.height / image.height;
    } else {
        this.settings.scale = this.settings.window.width / image.width;
    }
    this.canvas.best = new Canvas(this, 'best', this.settings.scale);
};


App.prototype.set = function () {
    this.setDimensions();
    this.canvas.original.scale();
    this.canvas.triangle.scale();
    this.canvas.best.scale();
    this.canvas.original.drawImage();
    this.imageData = this.canvas.original.getImageData();
    this.initButtons();
    this.createInitialPoints();
    this.initTriangles();
    this.canvas.best.drawBackground();
    this.canvas.best.drawTriangles(this.triangles);
    this.start();
};

App.prototype.setDimensions = function() {
    this.settings.width = image.width;
    this.settings.height = image.height;
    this.settings.bits = image.width * image.height * 4;
};

App.prototype.createInitialPoints = function () {
    var x = 0,
        y = 0;
    for (var i = 0; i < settings.points.initial; i++) {
        var px = x * this.settings.width / 2,
            py = y * this.settings.height / 2,
            point = new Point(app, px, py);
        this.points.push(point);
        x++;
        if (x === 3) {
            x = 0;
            y++;
        }
    }
};

App.prototype.initTriangles = function () {
    for (var i = 0; i < settings.triangles.initial; i++) {
        var row = Math.floor (i / 4),
            col = Math.floor ((i % 4 ) / 2),
            a = row * 3 + col + 1,
            b = a + 2,
            c = i % 2 === 0 ? a + 3 : a - 1,
            color = [0, 0, 0];
        this.triangles.push(new Triangle(this, this.points[a], this.points[b], this.points[c], color));
    }
};




// loop functions

App.prototype.checkTriangles = function() {
    var highestDeviation = this.getHighestDeviation(),
        changedTriangles;
    changedTriangles = this.splitTriangle(highestDeviation);
    this.updateTriangles(changedTriangles);
    this.canvas.best.drawTriangles(changedTriangles);
};

App.prototype.updateTriangles = function() {
    for (var i = 0, l = this.triangles.length; i < l; i++) {
        var triangle = this.triangles[i];
        triangle.update();
    }
};



App.prototype.getHighestDeviation = function() {
    var highestDeviation = 0,
        highest = null;
    for (var i = 0, l = this.triangles.length; i < l; i++) {
        var triangle = this.triangles[i];
        if (highest === null || triangle.deviation > highestDeviation) {
            highest = triangle;
            highestDeviation = triangle.deviation;
        }
    }
    return highest;
};

App.prototype.addPointInbetween = function(a, b) {
    // makes a new point in the middle of line a-b
    var ax = a.x,
        ay = a.y,
        bx = b.x,
        by = b.y,
        newX = (ax + bx ) / 2,
        newY = (ay + by) / 2,
        newPoint = new Point(this, newX, newY);
    this.points.push(newPoint);
    return newPoint;
};

App.prototype.splitTriangle = function(triangle) {
    var longest = triangle.getLongestSide(),
        sameTriangles = this.findMatchingTriangles(longest[0], longest[1]),
        newPoint = this.addPointInbetween(longest[0], longest[1]);
    return this.makeNewTriangle(sameTriangles, newPoint, longest[0], longest[1]);
};

App.prototype.makeNewTriangle = function(oldTriangles, newPoint, oldPoint1, oldPoint2) {
    var firstTriangle = this.triangles[oldTriangles[0]],
        secondTriangle,
        outerPoint1,
        outerPoint2,
        newTriangle1,
        newTriangle2,
        changedTriangles = [];

    if (firstTriangle.A !== oldPoint1 && firstTriangle.A !== oldPoint2) {
        outerPoint1 = firstTriangle.A;
    } else if (firstTriangle.B !== oldPoint1 && firstTriangle.B !== oldPoint2) {
        outerPoint1 = firstTriangle.B;
    } else {
        outerPoint1 = firstTriangle.C;
    }
    // reset points of the old triangle
    firstTriangle.A = outerPoint1;
    firstTriangle.B = oldPoint1;
    firstTriangle.C = newPoint;
    changedTriangles.push(firstTriangle);

    newTriangle1 = new Triangle(this, outerPoint1, oldPoint2, newPoint, firstTriangle.color);


    this.triangles.push(newTriangle1);
    changedTriangles.push(newTriangle1);

    if (oldTriangles.length > 1) {
        secondTriangle = this.triangles[oldTriangles[1]];
        if (secondTriangle.A !== oldPoint1 && secondTriangle.A !== oldPoint2) {
            outerPoint2 = secondTriangle.A;
        } else if (secondTriangle.B !== oldPoint1 && secondTriangle.B !== oldPoint2) {
            outerPoint2 = secondTriangle.B;
        } else {
            outerPoint2 = secondTriangle.C;
        }
        // reset points of the old triangle
        secondTriangle.A = outerPoint2;
        secondTriangle.B = oldPoint1;
        secondTriangle.C = newPoint;
        changedTriangles.push(secondTriangle);

        newTriangle2 = new Triangle(this, outerPoint2, oldPoint2, newPoint, secondTriangle.color);
        this.triangles.push(newTriangle2);
        changedTriangles.push(newTriangle2);
    }
    return changedTriangles;
};

App.prototype.findMatchingTriangles = function(a, b) {
    var sameTriangles = [];
    for (var i = 0, l = this.triangles.length; i < l; i++) {
        var triangle = this.triangles[i];
        if ((triangle.A === a || triangle.B === a || triangle.C === a) &&
            (triangle.A === b || triangle.B === b || triangle.C === b)) {
            sameTriangles.push(i);
        }
    }
    return sameTriangles;
};





// controls

App.prototype.initButtons = function() {
    $('#content-unloaded').hide();
    $('#content-loaded').show();
    document.getElementById('drop-target').style.display = 'none';
};

App.prototype.start = function() {
    var self = this;
    this.updateTriangles();
    this.canvas.best.drawTriangles(this.triangles);
    this.timer = setInterval(function(){
        self.checkTriangles();
    }, 0);

    $('#stop').show();
    $('#start').hide();
    $('#test').hide();
};

App.prototype.stop = function() {
    clearTimeout(this.timer);
    $('#stop').hide();
    $('#start').show();
    $('#test').show();
};


