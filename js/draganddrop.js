;(function(){

  var root = Snap('#svgRoot');
  var scatterButton = document.getElementById('svgScatter');
  var referenceButton = document.getElementById('svgReference');
  var easyButton = document.getElementById('easyButton');
  var hardButton = document.getElementById('hardButton');
  var easyElements = 'g:not([id^="Layer"]):not([id="Static"])'; // try changing to just 'g'
  var hardElements = 'g:not([id="Static"])';

  var _imported; // needed for a hack
  
  // Gets the amount of x- and y-shift needed
  // to redraw an element from its last
  // starting point.
  function reDrawMovement(elem) {
    elem.getBBox();
    // The object's last drawn position
    if (elem._.bboxwt) {
      var orig_x = elem._.bboxwt.cx;
      var orig_y = elem._.bboxwt.cy;
    } else {
      var orig_x = elem._.bbox.cx;
      var orig_y = elem._.bbox.cy;
    };
    // The object's current position
    var curr_x = elem._.bbox.cx;
    var curr_y = elem._.bbox.cy;
    // The amount of movement needed to 
    // redraw from the last starting point
    var move_x = (curr_x-orig_x);
    var move_y = (curr_y-orig_y);
    
    return {
      x: move_x,
      y: move_y
    };
  };
  
  // This funcion returns the scale factor for scaling drag
  // motion, based on the viewport and original SVG dimensions.
  function getScaleFactor() {
    var view = document.getElementsByTagName("svg")[0];
    var svg = document.getElementsByTagName("svg")[1];
    var viewAspectRatio = view.width.baseVal.value / view.height.baseVal.value;
    var svgAspectRatio = svg.viewBox.baseVal.width / svg.viewBox.baseVal.height;
    if (viewAspectRatio > svgAspectRatio) {
      // scale by height
      return svg.viewBox.baseVal.height / view.height.baseVal.value;
    } else {
      // scale by width
      return svg.viewBox.baseVal.width / view.width.baseVal.value;
    };
  };
  
  // This handler is needed to scale the amount of 
  // movement by the zoom and aspect ratio. The result
  // is a more natural drag and drop experience.
  function onDragMove(dx, dy, posx, posy) {
    // For some reason, calling the reDrawMovement
    // function causes this handler to break; so,
    // for now, we'll copy the code.
    // var shift = reDrawMovement(this);
    if (this._.bboxwt) {
      var orig_x = this._.bboxwt.cx;
      var orig_y = this._.bboxwt.cy;
    } else {
      var orig_x = this._.bbox.cx;
      var orig_y = this._.bbox.cy;
    };
    var curr_x = this._.bbox.cx;
    var curr_y = this._.bbox.cy;
    var move_x = (curr_x-orig_x);
    var move_y = (curr_y-orig_y);
    
    scaleFactor = getScaleFactor();
    this.attr( { transform: 'T'+(move_x + scaleFactor * dx)+','+(move_y + scaleFactor * dy)});
  };

  // This handler is needed because Snap wants to 
  // translate the element from its original position,
  // not its last position.
  function onDragStart(x, y, e) {
    var shift = reDrawMovement(this);
    // Redraw the object at its current position
    this.attr( {transform: 'T' + shift.x + ',' + shift.y});
  };

  // // This handler is only used for debugging purposes.
  // function onDragEnd(e) {
  //   var bBox = this.getBBox();
  //   // console.log("ddx = "+ddx+'\nddy = '+ddy+'\ndxDone = '+dxDone+'\ndyDone = '+dyDone);
  //   console.log("Ending: "+bBox.cx+', '+bBox.cy);
  //   console.log("Moved by: " + (this._.bbox.cx - this._.bboxwt.cx) + ', ' + (this._.bbox.cy - this._.bboxwt.cy));
  // };
  
  // Draw the entire canvas
  function draw(selector) {
    Snap.load(url, function(fragment) {
      root.append(fragment);
      fragment.selectAll(selector).forEach(function(elem) {
        elem.drag(onDragMove, onDragStart);//, onDragEnd);
      });
      // A hack to get a reference to imported SVG
      // Better approach would be to use Promise
      _imported = fragment;
      
      // Reference SVG
      // Snap.svg doesn't want to append same fragment twice,
      // so we hack:
      Snap.load(url, function(f){ root.append(f); });
    });
  }
  
  var individualElements = easyElements;
  draw(individualElements);
  
  // // SVG that will be manipulated by user
  // Snap.load(url, function(fragment) {
  //   root.append(fragment);
  //   fragment.selectAll(individualElements).forEach(function(elem) {
  //     elem.drag(onDragMove, onDragStart);//, onDragEnd);
  //   });
  //
  //   // A hack to get a reference to imported SVG
  //   // Better approach would be to use Promise
  //   _imported = fragment;
  // });
  //
  // // Reference SVG
  // // Snap.svg doesn't want to append same fragment twice,
  // // so we hack:
  // Snap.load(url, function(f){ root.append(f); });

  scatterButton.addEventListener('click', function() {
    scatterSVG(_imported, individualElements);
  });

  referenceButton.addEventListener('click', function() {
    toggleReference(root.node);
  });
  
  function eraseAndReDraw(elements) {
    var canvas = document.getElementById("svgRoot");
    while (canvas.firstChild) {
      canvas.removeChild(canvas.firstChild);
    }
    draw(individualElements);
  }
  
  easyButton.addEventListener('click', function() {
    individualElements = easyElements;
    eraseAndReDraw(individualElements);
  })

  hardButton.addEventListener('click', function() {
    individualElements = hardElements;
    eraseAndReDraw(individualElements);
  })
  
  var width = 0;
  var height = 0;
  
  function scatterSVG(parent, selector) {
    var svg = document.getElementsByTagName("svg")[1];
    // Get the height and width of the SVG
    width = svg.viewBox.baseVal.width;
    height = svg.viewBox.baseVal.height;
    
    parent.selectAll(selector).forEach(function(elem) {
      // Translation instead of actual movement
      // of the element. Quick to implement, but
      // probably isn't the best choice in the end
      var bBox = elem.getBBox();
      // Pick a destination
      var dest_x = Math.random() * width;
      var dest_y = Math.random() * height;
      
      // If the element has been moved, we get the
      // original coordinates; otherwise, use the 
      // current coordinates.
      if (elem._.bboxwt) {
        var delta_x = dest_x - elem._.bboxwt.cx;
        var delta_y = dest_y - elem._.bboxwt.cy;
      } else {
        var delta_x = dest_x - bBox.cx;
        var delta_y = dest_y - bBox.cy;
      }
      
      // Move the element
      elem.transform('t' + delta_x + ',' + delta_y);
    });
  }

  function toggleReference(root) {
    root.classList.toggle('is-reference-visible');
  }

}());