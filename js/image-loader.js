require(['dojo/dom', 'dojo/domReady!'], function(dom) {

    var target = dom.byId('drop-target'),
        readImage = function(imgFile){
        if(!imgFile.type.match(/image.*/)){
            $('#drop-target').html('The dropped file is not an image: ' + imgFile.type);
            return;
        }

        var reader = new FileReader();
        reader.onload = function(e){
            app.loadImage(e.target.result);
        };
        reader.readAsDataURL(imgFile);
    };

    target.addEventListener('dragover', function(e) {
        e.preventDefault();
        $('#drop-target').addClass('hovering');
    }, true);

    target.addEventListener('dragleave', function(e) {
        e.preventDefault();
        $('#drop-target').removeClass('hovering');
    }, true);

    target.addEventListener('drop', function(e){
        e.preventDefault();
        readImage(e.dataTransfer.files[0]);
    }, true);
});