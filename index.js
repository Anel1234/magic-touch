window.onload = function() {
    colorThreshold = 15;
    blurRadius = 5;
    simplifyTolerant = 0;
    simplifyCount = 30;
    hatchLength = 4;
    hatchOffset = 0;

    imageInfo = null;
    cacheInd = null;
    mask = null;
    imageMask = null;
    downPoint = null;
    allowDraw = false;
    currentThreshold = colorThreshold;
    
    document.addEventListener("keydown", keyPressHandler, false);
    
    showThreshold();
    document.getElementById("blurRadius").value = blurRadius;
    setInterval(function () { hatchTick(); }, 300);
};
function uploadClick() {
    document.getElementById("file-upload").click();
};
function onRadiusChange(e) {
    blurRadius = e.target.value;
};
function imgChange (inp) {
    if (inp.files && inp.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = document.getElementById("test-picture");
            img.setAttribute('src', e.target.result);
            img.onload = function() {
                window.initCanvas(img);
            };
        }
        reader.readAsDataURL(inp.files[0]);
    }
};
function initCanvas(img) {
    var cvs = document.getElementById("resultCanvas");
    cvs.width = img.width;
    cvs.height = img.height;
    imageInfo = {
        width: img.width,
        height: img.height,
        context: cvs.getContext("2d")
    };
    mask = null;
    
    var tempCtx = document.createElement("canvas").getContext("2d");
    tempCtx.canvas.width = imageInfo.width;
    tempCtx.canvas.height = imageInfo.height;
    tempCtx.drawImage(img, 0, 0);
    imageInfo.data = tempCtx.getImageData(0, 0, imageInfo.width, imageInfo.height);
};
function getMousePosition(e) {
    var p = $(e.target).offset(),
        x = Math.round((e.clientX || e.pageX) - p.left),
        y = Math.round((e.clientY || e.pageY) - p.top);
    return { x: x, y: y };
};
function onMouseDown(e) {
    if (e.button == 0) {
        allowDraw = true;
        downPoint = getMousePosition(e);
        drawMask(downPoint.x, downPoint.y);
    }
    else allowDraw = false;
};
function onMouseMove(e) {
    if (allowDraw) {
        var p = getMousePosition(e);
        if (p.x != downPoint.x || p.y != downPoint.y) {
            var dx = p.x - downPoint.x,
                dy = p.y - downPoint.y,
                len = Math.sqrt(dx * dx + dy * dy),
                adx = Math.abs(dx),
                ady = Math.abs(dy),
                sign = adx > ady ? dx / adx : dy / ady;
            sign = sign < 0 ? sign / 5 : sign / 3;
            var thres = Math.min(Math.max(colorThreshold + Math.floor(sign * len), 1), 255);
            //var thres = Math.min(colorThreshold + Math.floor(len / 3), 255);
            if (thres != currentThreshold) {
                currentThreshold = thres;
                drawMask(downPoint.x, downPoint.y);
            }
        }
    }
};
function onMouseUp(e) {
    allowDraw = false;
    currentThreshold = colorThreshold;
};
function showThreshold() {
    document.getElementById("threshold").innerHTML = "Threshold: " + currentThreshold;
};
function drawMask(x, y) {
    if (!imageInfo) return;
    
    showThreshold();
    
    var image = {
        data: imageInfo.data.data,
        width: imageInfo.width,
        height: imageInfo.height,
        bytes: 4
    };

     var ctx = imageInfo.context;
       //ctx.clearRect(0, 0, imageInfo.width, imageInfo.height);
       var img = document.getElementById("test-picture");
       //ctx.drawImage(image, 0, 0, image.width, image.height);
       ctx.drawImage(img, 0, 0);
       
       var imgd = ctx.getImageData(0, 0, image.width, image.height)
       pix = imgd.data;
       
       newColor = {r:255,g:255,b:255, a:0};



    mask = MagicWand.floodFill(image, x, y, currentThreshold);
    
   imageMask = mask;
       
       //ctx.clearRect(0, 0, imageInfo.width, imageInfo.height);
       
       console.log(mask);
       
       
       for (var i = 0, n = mask.data.length; i <n; i += 1) {
       if(mask.data[i] == 1) {
       //console.log(mask.data[i]);
       
       pix[4*i] = newColor.r;
               pix[(4*i)+1] = newColor.g;
               pix[(4*i)+2] = newColor.b;
               pix[(4*i)+3] = newColor.a;
       }
       }
       console.log(pix);
       
       ctx.putImageData(imgd, 0, 0);
       
      
    
    mask = MagicWand.gaussBlurOnlyBorder(mask, blurRadius);
    
     
    
    drawBorder();
};
function hatchTick() {
    hatchOffset = (hatchOffset + 1) % (hatchLength * 2);
    drawBorder(true);
};
function drawBorder(noBorder) {

    if (!mask) return;
    
    var x,y,i,j,
        w = imageInfo.width,
        h = imageInfo.height,
        ctx = imageInfo.context,
        imgData = ctx.createImageData(w, h),
        res = imgData.data;
    
    if (!noBorder) cacheInd = MagicWand.getBorderIndices(mask);
    
    //ctx.clearRect(0, 0, w, h);
    
    var len = cacheInd.length;
    for (j = 0; j < len; j++) {
        i = cacheInd[j];
        x = i % w; // calc x by index
        y = (i - x) / w; // calc y by index
        k = (y * w + x) * 4; 
        if ((x + y + hatchOffset) % (hatchLength * 2) < hatchLength) { // detect hatch color 
            res[k + 3] = 255; // black, change only alpha
        } else {
            res[k] = 255; // white
            res[k + 1] = 255;
            res[k + 2] = 255;
            res[k + 3] = 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);
    
};
function trace() {
    var cs = MagicWand.traceContours(mask);
    cs = MagicWand.simplifyContours(cs, simplifyTolerant, simplifyCount);

    mask = null;

    // draw contours
    var ctx = imageInfo.context;
    //ctx.clearRect(0, 0, imageInfo.width, imageInfo.height);
    //inner
    ctx.beginPath();
    for (var i = 0; i < cs.length; i++) {
        if (!cs[i].inner) continue;
        var ps = cs[i].points;
        ctx.moveTo(ps[0].x, ps[0].y);
        for (var j = 1; j < ps.length; j++) {
            ctx.lineTo(ps[j].x, ps[j].y);
        }
    }
    ctx.strokeStyle = "red";
    ctx.stroke();    
    //outer
    ctx.beginPath();
    for (var i = 0; i < cs.length; i++) {
        if (cs[i].inner) continue;
        var ps = cs[i].points;
        ctx.moveTo(ps[0].x, ps[0].y);
        for (var j = 1; j < ps.length; j++) {
            ctx.lineTo(ps[j].x, ps[j].y);
        }
    }
    ctx.strokeStyle = "blue";
    ctx.stroke();    
};

function getCanvasImage() {
if (!imageInfo) return;
    
    showThreshold();
    
    var image = {
        data: imageInfo.data.data,
        width: imageInfo.width,
        height: imageInfo.height,
        bytes: 4
    };

     var ctx = imageInfo.context;
       //ctx.clearRect(0, 0, imageInfo.width, imageInfo.height);
       var img = document.getElementById("test-picture");
       //ctx.drawImage(image, 0, 0, image.width, image.height);
       ctx.drawImage(img, 0, 0);
       
       var imgd = ctx.getImageData(0, 0, image.width, image.height)
       pix = imgd.data;
       
       newColor = {r:255,g:255,b:255, a:0};
       //newColor = {r:122,g:201,b:54, a:255};


    //mask = MagicWand.floodFill(image, x, y, currentThreshold);
       
       //ctx.clearRect(0, 0, imageInfo.width, imageInfo.height);
       
       console.log(imageMask);
       
       
       for (var i = 0, n = imageMask.data.length; i <n; i += 1) {
       if(imageMask.data[i] == 1) {
       //console.log(mask.data[i]);
       
       pix[4*i] = newColor.r;
               pix[(4*i)+1] = newColor.g;
               pix[(4*i)+2] = newColor.b;
               pix[(4*i)+3] = newColor.a;
       }
       }
       console.log(pix);
       
       ctx.putImageData(imgd, 0, 0);
}

function convertImagetoCanvas() {
    var can = document.getElementById('resultCanvas');
    var ctx = imageInfo.context;
    $('#test-picture').attr("src",can.toDataURL());
}

function keyPressHandler(e) {
var keyCode = e.keyCode;
    if(keyCode == 46){
        console.log("delete!");
        trace();
        getCanvasImage();
        convertImagetoCanvas();
    }
}



