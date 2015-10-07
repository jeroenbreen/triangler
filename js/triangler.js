require(['dojo/dom', 'dojo/domReady!'], function(dom){
    var target = dom.byId('drop-target');
    var readImage = function(imgFile){
        if(!imgFile.type.match(/image.*/)){
            document.getElementById('drop-target').innerHTML = 'The dropped file is not an image: ' + imgFile.type;
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e){
            initImage(e.target.result);
        };
        reader.readAsDataURL(imgFile);
    };

    //	DOMReady setup
    target.addEventListener('dragover', function(e) {e.preventDefault();}, true);
    target.addEventListener('drop', function(e){
        e.preventDefault();
        readImage(e.dataTransfer.files[0]);
    }, true);
});

var graphics = {
    resize : 10
  , triangles : 8
  , points : 9
  , iHeight : 80
  , iWidth  : 0
  , bits : null
}
  , image = new Image()
  , originalCanvas = {}
  , triangleCanvas = {}
  , bestCanvas = {}
  , imageData = null
  , points = []
  , triangles = []
  , timer = null;


function init() {
    setDimensions();
    setCanvas(originalCanvas, 'canvas_original', 1);
    setCanvas(triangleCanvas, 'canvas_triangle', 1);
    setCanvas(bestCanvas, 'canvas_best', graphics.resize);
    setImageData();
    initButtons();
    initPoints();
    initTriangles();
    drawBackground();
    drawTriangles(triangles);
    start();
}

function initPoints() {
    var ix = 0
      , iy = 0;
    for (var i = 0, l = graphics.points; i < l; i++) {
        var point = new Point(ix, iy);
        points.push(point);
        ix++;
        if (ix == 3) {
            ix = 0; iy++;
        }
    }
}

function initTriangles() {
    for (var i = 0, l = graphics.triangles; i < l; i++) {
        triangles.push(new Triangle(i));
    }
}

// constructors
function Point(ix, iy) {
    this.x = ix * graphics.iWidth / 2;
    this.y = iy * graphics.iHeight / 2;
}

function Triangle (i) {
    var row = Math.floor (i / 4);
    var col = Math.floor ((i % 4 ) / 2);
    this.A = row * 3 + col + 1;
    this.B = this.A + 2;
    this.C = (i % 2 == 0 ? this.A + 3 : this.A - 1);
    this.pixels = [];
    this.color = [0, 0, 0];
    this.deviation = 0;
}

// update functions
function updatePixels (triangle) {
    // this function finds the pixels corresponding with the triangle by
    // drawing the triangle black on white, outputting the imagedata of that
    // and then finding the pixels with color value < 255
    var triangleData
      , pixelIndex = 0
      , pixels = [];
    // draw a black triangle on a white canvas
    var ctx = triangleCanvas.context;
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, graphics.iWidth, graphics.iHeight);
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.moveTo (points[triangle.A].x, points[triangle.A].y);
    ctx.lineTo (points[triangle.B].x, points[triangle.B].y);
    ctx.lineTo (points[triangle.C].x, points[triangle.C].y);
    ctx.closePath();
    ctx.fill();
    // find the black pixels
    triangleData = triangleCanvas.context.getImageData(0, 0, graphics.iWidth, graphics.iHeight).data;
    for (var i = 0; i < graphics.bits; i += 4) {
        if (triangleData[i] < 255) {
            pixels[pixelIndex] = i;
            pixelIndex++;
        }
    }
    triangle.pixels = pixels;
}

function updateColor(triangle) {
    var red = 0
      , green = 0
      , blue = 0
      , pixels = triangle.pixels
      , l = pixels.length
      , r
      , g
      , b;
    // count total red, green and blue of the area of the triangle in the original data
    for (var i = 0; i < l; i ++) {
        var pixel = pixels[i];
        red += imageData[pixel];
        green += imageData[pixel + 1];
        blue += imageData[pixel + 2];
    }
    // find the average red, green and blue
    r = Math.round (red / l);
    g = Math.round (green / l);
    b = Math.round (blue / l);
    triangle.color = [r, g, b];
}

function updateDeviation(triangle) {
    var deviation = 0
      , l = triangle.pixels.length
      , multiplier = 1 + l / 500;
    for (var i = 0; i < l; i++) {
        var pixel = triangle.pixels[i];
        deviation += Math.abs(imageData[pixel] - triangle.color[0]);
        deviation += Math.abs(imageData[pixel + 1] - triangle.color[1]);
        deviation += Math.abs(imageData[pixel + 2] - triangle.color[2]);
    }
    triangle.deviation = deviation * multiplier;
}

// split functions

function findLongest (triangle) {
    var side = [];
    side[0] = [pi(points[triangle.A], points[triangle.B]), triangle.A, triangle.B];
    side[1] = [pi(points[triangle.A], points[triangle.C]), triangle.A, triangle.C];
    side[2] = [pi(points[triangle.B], points[triangle.C]), triangle.B, triangle.C];
    side.sort ( function (a, b) { return b[0] - a[0] } );
    return [side[0][1], side[0][2]];
}

function pi(a, b) {
    return Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2);
}

function findOther (a, b) {
    var sameTriangles = [];
    for (var i = 0, l = triangles.length; i < l; i++) {
        var triangle = triangles[i];
        if ((triangle.A == a || triangle.B == a || triangle.C == a) && (triangle.A == b || triangle.B == b || triangle.C == b)) {
            sameTriangles.push(i);
        }
    }
    return sameTriangles;
}

function makeNewPoint (a, b) {
    // makes a new point in the middle of line a-b
    var ax = points[a].x
      , ay = points[a].y
      , bx = points[b].x
      , by = points[b].y
      , newX = (ax + bx ) / 2
      , newY = (ay + by) / 2
      , newPoint = {'x': newX, 'y': newY };
    points.push(newPoint);
    return points.length - 1;
}

function makeNewTriangle (oldTriangles, newPoint, oldPoint1, oldPoint2) {
    var firstTriangle = triangles[oldTriangles[0]]
      , secondTriangle
      , outerPoint1
      , outerPoint2
      , newTriangle1
      , newTriangle2
      , changedTriangles = [];
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

    newTriangle1 = {
        'A': outerPoint1,
        'B': oldPoint2,
        'C': newPoint,
        'pixels': [],
        'color': firstTriangle.color,
        'deviation': 0};
    triangles.push(newTriangle1);
    changedTriangles.push(newTriangle1);

    if (oldTriangles.length > 1) {
        secondTriangle = triangles[oldTriangles[1]];
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

        newTriangle2 = {
            'A': outerPoint2,
            'B': oldPoint2,
            'C': newPoint,
            'pixels': [],
            'color': secondTriangle.color,
            'deviation': 0
        };
        triangles.push(newTriangle2);
        changedTriangles.push(newTriangle2);
    }
    return changedTriangles;
}


// main functions

function setProperties(set) {
    for (var i = 0, l = set.length; i < l; i++) {
        var triangle = set[i];
        updatePixels(triangle);
        updateColor(triangle);
        updateDeviation(triangle);
    }
}

function checkTriangles () {
    var highestDeviation = getHighestDeviation()
      , changedTriangles;
    changedTriangles = splitTriangle(triangles[highestDeviation]);
    setProperties(changedTriangles);
    drawTriangles(changedTriangles);
}

function getHighestDeviation() {
    var dev = []
      , l =  triangles.length;
    for (var i = 0; i < l; i++) {
        dev[i] = [i, triangles[i].deviation];
    }
    dev.sort( function (a,b) { return a[1] - b[1] } );
    return dev[l - 1][0];
}

function splitTriangle(triangle) {
    var longest = findLongest(triangle)
      , sameTriangles = findOther(longest[0], longest[1])
      , newPoint = makeNewPoint(longest[0], longest[1]);
    return makeNewTriangle(sameTriangles, newPoint, longest[0], longest[1]);
}

// draw

function drawBackground() {
    var ctx = bestCanvas.context;
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, 500, 500);
}

function drawTriangles (set) {
    var ctx = bestCanvas.context;
    for (var i = 0, l = set.length; i < l; i++) {
        var triangle = set[i];
        ctx.fillStyle = 'rgba(' + triangle.color + ', 1)';
        ctx.beginPath();
        ctx.moveTo (graphics.resize * points[triangle.A].x, graphics.resize * points[triangle.A].y);
        ctx.lineTo (graphics.resize * points[triangle.B].x, graphics.resize * points[triangle.B].y);
        ctx.lineTo (graphics.resize * points[triangle.C].x, graphics.resize * points[triangle.C].y);
        ctx.closePath();
        ctx.fill();
    }
}

// buttons

function initButtons() {
    document.getElementById('buttons').style.display = 'block';
    document.getElementById('drop-target').style.display = 'none';
}

function start() {
    //checkTriangles();
    setProperties(triangles);
    drawTriangles(triangles);
    timer = setInterval (checkTriangles, 0);
    hide('start');
    show('stop');
}

function stop() {
    clearTimeout(timer);
    hide('stop');
    show('start');
}

function hide(id) {
    var el = document.getElementById(id);
    if (el) {
        el.style.display = 'none';
    }
}

function show (id) {
    var el = document.getElementById(id);
    if (el) {
        el.style.display = 'block';
    }
}

// canvas functions

function setDimensions() {
    graphics.iWidth = image.width;
    graphics.iHeight = image.height;
    graphics.bits = graphics.iWidth * graphics.iHeight * 4;
}

function setImageData() {
    originalCanvas.context.drawImage(image, 0, 0, graphics.iWidth, graphics.iHeight);
    imageData = originalCanvas.context.getImageData (0, 0, graphics.iWidth, graphics.iHeight).data;
}

function setCanvas(obj, id, resize) {
    obj.canvas = document.getElementById(id);
    obj.context = obj.canvas.getContext ('2d');
    obj.canvas.setAttribute ('width', resize * graphics.iWidth);
    obj.canvas.setAttribute ('height', resize * graphics.iHeight);
}

function initImage(src) {
    image.onload = function() {
        if (image.height > graphics.iHeight) {
            image.width = image.width * graphics.iHeight / image.height;
            image.height = graphics.iHeight;
        }
        if(image.complete) {
            init();
        }
        else {
            setTimeout(init, 100);
        }
    };
    image.src = src;
}