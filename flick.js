;(function( window ) {

  var classList = typeof document.documentElement.classList !== "undefined";

  var forEach = function( obj, iterator ) {
    for ( var key in obj ) {
      if ( obj.hasOwnProperty( key ) ) {
        iterator.call( this, obj[key], key, obj );
      }
    }
  };

  var pythagoras = function( x1, x2, y1, y2 ) {
    var
      xDelta = x2 - x1,
      yDelta = y1 - y2,
      pow = Math.pow,
      distance = Math.sqrt( pow( xDelta, 2 ) + pow( yDelta, 2 ) ),
      angle = Math.atan2( yDelta, xDelta ) / ( Math.PI / 180 );

    return { distance: distance, angle: angle };
  }
  
  function Tap( el, options ) {
    this.element = typeof el === 'object' ? el : document.getElementById( el );
    this.eventStart = this.hasTouch ? 'touchstart' : 'mousedown';
    this.eventMove = this.hasTouch ? 'touchmove' : 'mousemove';
    this.eventEnd = this.hasTouch ? 'touchend' : 'mouseup';
    this.moved =  this.longTap = this.flickTimeout = false;
    this.timers = {
      longTap: null,
      flick: null
    };
    this.lastTapTS = 0;
    this.tapCount = 0;
    this.startPosition = { x: 0, y: 0 };
    this.srcElement = null;
    this.element.addEventListener( this.eventStart, this, false );
    this.element.style["-webkit-user-select"] = "none"; // no copy/paste
    this.element.style["-webkit-touch-callout"] = "none"; // no long tap
    this.element.style["-webkit-tap-highlight-color"] = "transparent"; // no highlight
  };

  Tap.prototype.hasTouch = 'ontouchstart' in window || 'createTouch' in document;

  Tap.prototype.start = function( e ) {
    if ( this.lastTapTS === 0 || e.timeStamp - this.lastTapTS > 200 ) {
      this.tapCount = 0;
    }
    this.tapCount++;
    this.build();
    this.srcElement = e.target;
    this.startPosition.x = this.hasTouch ? e.touches[0].clientX : e.clientX;
    this.startPosition.y = this.hasTouch ? e.touches[0].clientY : e.clientY;
    this.lastTapTS = e.timeStamp;
  };

  Tap.prototype.move = function( e ) {
    var
      x = this.hasTouch ? e.touches[0].clientX : e.clientX,
      y = this.hasTouch ? e.touches[0].clientY : e.clientY;

    if ( ! this.moved && ! this.flickTimeout ) {
      if ( pythagoras( this.startPosition.x, x, this.startPosition.y, y ).distance > 10 ) {
        this.moved = true;
        classList && this.element.classList.remove( "tap" );
        classList && this.element.classList.add( "flick" );
      }
    }

    e.preventDefault();
  };

  Tap.prototype.end = function( e ) {
    var
      x = this.hasTouch ? e.changedTouches[0].clientX : e.clientX,
      y = this.hasTouch ? e.changedTouches[0].clientY : e.clientY;

    if ( e.target.tagName !== 'SELECT' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' ) {
      e.preventDefault();
    }

    if ( ! this.moved ) {
      var
        event = document.createEvent( 'Event' ),
        s = this.startPosition;
      event.initEvent( this.longTap ? 'longtap' : 'tap', true, true );
      event.tapCount = this.tapCount;

      this.srcElement.dispatchEvent( event );
    } else if ( ! this.flickTimeout ) {
      var
        event = document.createEvent( 'Event' ),
        p = pythagoras( this.startPosition.x, x, this.startPosition.y, y );
      event.initEvent( 'flick', true, true );
      event.tapCount = this.tapCount;
      event.angle = p.angle;
      event.distance = p.distance;
      this.srcElement.dispatchEvent( event );
    }

    this.reset();
  };

  Tap.prototype.cancel = function( e ) {
    this.reset();
  }

  Tap.prototype.reset = function(){
    var element = this.hasTouch ? this.element : document;
    this.moved = this.longTap = this.flickTimeout = false;
    this.startPosition.x = this.startPosition.y  = 0;
    this.srcElement = null;
    forEach( this.timers, function( val, key, obj ){
      clearTimeout( val );
      obj[ key ] = null;
    } );
    element.removeEventListener( this.eventMove, this, false );
    element.removeEventListener( this.eventEnd, this, false );
    classList && this.element.classList.remove( "longtap" );
    classList && this.element.classList.remove( "tap" );
    classList && this.element.classList.remove( "flick" );
    if ( this.hasTouch ) {
      this.element.removeEventListener( 'touchcancel', this, false );
    }
  };

  Tap.prototype.build = function(){
    var element = this.hasTouch ? this.element : document;
    element.addEventListener( this.eventMove, this, false );
    element.addEventListener( this.eventEnd, this, false );
    classList && this.element.classList.add( "tap" );
    this.timers.longTap = setTimeout( (function(that){
      return function() {
        classList && that.element.classList.add( "longtap" );
        classList && that.element.classList.remove( "tap" );
        that.longTap = true;
      };
    }(this)), 500 );
    this.timers.flick = setTimeout( (function(that){
      return function() {
        if ( that.moved ) {
          classList && that.element.classList.remove( "flick" );
          that.reset();
        }
        that.flickTimeout = true;
      };
    }(this)), 300 );
    if ( this.hasTouch ) {
      this.element.addEventListener( 'touchcancel', this, false );
    }
  };

  Tap.prototype.handleEvent = function( e ) {
    switch ( e.type ){
      case 'touchstart':
      case 'mousedown':
        this.start( e );
        break;
      case 'touchmove':
      case 'mousemove':
        this.move( e );
        break;
      case 'touchend':
      case 'mouseup':
        this.end( e );
        break;
      case 'touchcancel':
        this.cancel( e );
        break;
    }
  }

  window.Tap = function( element, options ){
    var elements;
    if ( element == undefined ) {
      // !exception
      return false;
    } else if ( typeof element === "string" && element ) {
      if ( !document.querySelectorAll ) {
        return false;
      }
      try {
        elements = Array.prototype.slice.call( document.querySelectorAll( element ) );
      } catch(e) {
        return false;
      }
      if ( ! elements.length ) {
        return false;
      }
    } else if ( element instanceof HTMLElement ) {
      elements = [ element ];
    }

    for ( var i in elements ) {
      new Tap( elements[i], options );
    }
  };

}( this ));