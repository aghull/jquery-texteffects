(function ($, _, window, document) {
  var defaults = {
    inc: 1,
    speed: 0
  };

  function TextEffects(el, options) {
    this.$el = $(el);
    this.options = _.defaults(options||{}, defaults);
    this.init();
  }

  TextEffects.prototype = {
    init: function() {
      var number = parseInt(this.$el.text(), 10);
      var target = number+this.options.inc;
      this.adjustNumber(target, String(Math.abs(this.options.inc)).length-2);
    },

    // speed: how many numbers to blur
    adjustNumber: function(target, speed) {
      var that = this;
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

    // speed: how many numbers to blur
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
            this.rotate(this.spans[i], next[i], 100+500*(next.length-1-speed-i), parseInt(from,10) < parseInt(to,10) ? 1 : -1, calledback ? null : (calledback=true) && function() {
              that.numberFlip(next, to, speed);
            });
          }
        }
      } else {
        that.reattach(that.$el.text(to));
        for (i=0; i!=speed; i++) {
          that.stopBlur(this.spans[this.spans.length-speed+i]);
        }
        that.complete();
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
    },

    wrap: function($el) {
      return $el.wrapInner($('<div>').css({
        overflow: 'hidden',
        display: 'inline-block',
        position: 'relative',
      })).children().first();
    },

    // speed: ms
    rotate: function($el, text, speed, direction, callback) {
      var that = this;
      var letters = [ this.detach($el).text(text), this.detach($el, true) ]
      , center = $el.position().top
      , offset = $el.height() * direction;
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
          $el.text(Math.floor(Math.random()*10));
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
