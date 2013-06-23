(function ($, _, window, document) {
  var defaults = {
    chars: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ'
  };

  function TextEffects(el, options) {
    this.$el = $(el);
    this.options = _.defaults(options||{}, defaults);
    this.init();
  }

  TextEffects.prototype = {
    init: function() {
      if (this.options.inc) {
        this.odometer(parseInt(this.$el.text(), 10) + this.options.inc, Math.max(0,String(Math.abs(this.options.inc)).length-2));
      } else if (this.options.text) {
        this.text(this.options.text);
      }
    },

    // speed: how many numbers to blur
    odometer: function(target, speed) {
      var that = this;
      this.flipping = 0;
      // clone out el, split into spans and wrap in overflow
      this.clone = this.detach(this.$el, true);
      this.wrap(this.clone.html(this.spans = _.map(this.$el.text(), function(char) { return $('<span>').text(char); })));
      _.each(this.spans, function(span) {
        span.wrap($('<span>').css({
          display: 'inline-block',
          position: 'relative'
        }));
      });
      this.numberFlip(this.$el.text(), String(target), speed);
      var i;
      for (i=0; i!=speed; i++) {
        this.blur(this.spans[this.spans.length-speed+i], i+1);
      }
    },

    text: function(target) {
      var that = this;
      this.flipping = 0;
      // clone out el, split into spans and wrap in overflow
      this.clone = this.detach(this.$el, true);
      this.wrap(this.clone.html(this.spans = _.map(this.$el.text(), function(char) { return $('<span>').text(char); })));

      if (target.length>this.$el.text().length) {
        target = target.substring(0,this.$el.text().length);
      }
      while (target.length<this.$el.text().length) {
        target = target + ' ';
      }
      _.each(this.spans, function(span, i) {
        var s=[];
        _.times(_.random(3,20), function() { s.push(that.options.chars[_.random(that.options.chars.length-1)]); });
        s.push(target[i]);
        that.flipping++;
        that.flipTimes(span, s, function() {
          that.flipping--;
          if (that.flipping==0) {
            that.reattach(that.$el.text(target)); 
            that.complete();
          }
        });
      });
    },

    // flip number from (string) to (string), speed: how many numbers to blur
    numberFlip: function(from, to, speed) {
      var that = this, i;
      if (parseInt(from,10)!=parseInt(to,10)) {
        var next = String(parseInt(from,10) + ((parseInt(from,10) < parseInt(to,10) ? 1 : -1) * Math.pow(10, speed)));
        if (next.length > from.length) {
          this.spans.unshift($('<span>').text('0').insertBefore(this.spans[0]));
          from = '0'+from;
        }
        while (next.length<from.length) {
          next = '0'+next;
        }
        var calledback = false;
        for (i=next.length-1-speed; i>=0; i--) { // ...3,2,1,0
          if (next[i]!=from[i]) {
            this.flipping++;
            this.flip(this.spans[i], next[i], 100+500*(next.length-1-speed-i), parseInt(from,10) < parseInt(to,10) ? 1 : -1, (function(first) {
              calledback = true;
              return function() {
                that.flipping--;
                if (parseInt(next,10)==parseInt(to,10)) {
                  for (i=0; i!=speed; i++) {
                    that.stopBlur(that.spans[that.spans.length-speed+i]);
                  }
                  if (that.flipping==0) {
                    that.reattach(that.$el.text(to)); 
                    that.complete();
                  }
                }
                if (first) {
                  that.numberFlip(next, to, speed);
                }
              };
            }(!calledback)));
          }
        }
      }
    },

    flipTimes: function($el, queue, callback) {
      var that = this
      , next = queue.shift();
      if (next) {
        this.flip($el, next, 100, 1, function() {
          that.flipTimes($el, queue, callback);
        });
      } else {
        if (typeof callback=='function') {
          callback.call();
        }
      }
    },

    detach: function($el, hide) {
      var pos = $el.position(),
        clone = $el.clone();
      $el.data('textEffectsClone', ($el.data('textEffectsClone')||[]));
      $el.data('textEffectsClone').push(clone);
      hide && $el.css({opacity:0});
      clone.css({
        position: 'absolute',
        left: pos.left,
        top: pos.top
      }).insertAfter($el);
      return clone;
    },

    reattach: function($el) {
      if ($el.data('textEffectsClone')) {
        _.invoke($el.data('textEffectsClone'), 'remove');
      }
      $el.css({opacity:1});
    },

    complete: function() {
      this.$el.data("text-effects", null);
      if (typeof this.options.complete=='function') {
        this.options.complete.call();
      }
    },

    wrap: function($el) {
      return $el.wrapInner($('<div>').css({
        overflow: 'hidden',
        display: 'inline-block',
        position: 'relative',
      })).children().first();
    },

    // flip $el to text, speed is in ms, direction is 1 or -1
    flip: function($el, text, speed, direction, callback) {
      var that = this;
      var letters = [ this.detach($el).text(text), this.detach($el, true) ]
      , center = $el.position().top
      , offset = $el.height() * (direction > 0 ? 1 : -1);
      letters[1].css({top: center}).animate({top: center - offset}, speed);
      letters[0].css({top: center + offset}).animate({top: center}, speed, function() {
        that.reattach($el.text(text));
        if (typeof callback=='function') {
          callback.call();
        }
      });
    },

    // speed: 1: normal, 2+: faster
    blur: function($el, speed) {
      var that = this;
      var letters = [ this.detach($el), this.detach($el), this.detach($el), this.detach($el), this.detach($el, true) ]
      , center = $el.position().top
      , offset = $el.height()*0.1;
      letters[4].css({top: center - 2*offset, opacity: 0.2/speed});
      letters[3].css({top: center - offset, opacity: 0.2/speed});
      letters[2].css({top: center, opacity: 0.2/speed});
      letters[1].css({top: center + offset, opacity: 0.2/speed});
      letters[0].css({top: center + 2*offset, opacity: 0.2/speed});
      _.each(letters, function(letter) { that.flipRandomly(letter); });
    },

    stopBlur: function($el) {
      this.reattach($el);
    },

    flipRandomly: function($el) {
      var that = this;
      if ($el.parent().length) {
        setTimeout(function() {
          $el.text(_.random(0,9));
          that.flipRandomly($el);
        }, 10);
      }
    }
  };

  $.fn.textEffects = function(options) {
    return this.each(function() {
      if (!$(this).data("text-effects")) {
        $(this).data("text-effects", new TextEffects(this, options));
      }
    });
  };
}(jQuery, _, window, document));
