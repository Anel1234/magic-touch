console.log(cs)
    
    var img = document.getElementById("test-picture");
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var imgd = ctx.getImageData(0, 0, img.height, img.width)
    
    pix = imgd.data,
    newColor = {r:0,g:0,b:0, a:0};

    var quotient = Math.floor(img.height/img.width);
    var remainder = img.height % img.width;

    for (var i = 0, n = pix.length; i <n; i += 4) {
    var r = pix[i],
            g = pix[i+1],
            b = pix[i+2];

            console.log(i/4);
            
            for (var j = 0; j < cs.length; j++){
            }

        if (!cs[i].inner) continue;{ 
            // Change the white to the new color.
            pix[i] = newColor.r;
            pix[i+1] = newColor.g;
            pix[i+2] = newColor.b;
            pix[i+3] = newColor.a;
        }