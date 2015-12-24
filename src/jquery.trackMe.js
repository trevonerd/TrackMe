/*!
 * jQuery TrackMe v1.0 - 23/12/2015
 * --------------------------------
 * Original author: Marco Trevisani (marco.trevisani@ynap.com)
 * Further changes, comments: 
 * Licensed under the MIT license
 */
(function ($, window, document) {

    var pluginName = "trackMe";

    function TrackMe(element, options) {
        this.element = element;
        this._name = pluginName;
        this._defaults = $.fn.trackMe.defaults;
        this.options = $.extend({}, this._defaults, options);
        this.trackingData = {};
        this.init();
    }

    // - Private Functions - - -
    var getTrackingData = function ($elm) {
        return {
            category: jsInit.analytics.category,
            action: (typeof ($elm.data("trackingAction")) === "undefined") ? jsInit.analytics.action : $elm.data("trackingAction"),
            label: $elm.data("trackingLabel"),
            labelChecked: $elm.data("trackingLabelChecked"),
            labelNotChecked: $elm.data("trackingLabelNotChecked"),
            event: $elm.data("trackingEvent"),
            formToValidate: $elm.data("trackingFormId")
        };
    };

    var formIsValid = function (formId) {
        if (typeof (formId) !== 'undefined') {
            var $formToValidate = $('#' + formId);
            if ($formToValidate.length && !$formToValidate.valid()) {
                return false;
            }
        }
        return true;
    };

    // DEBUG SYSTEM
    var debugTrackedEvent = function (category, action, label) {
        var $message = $("<h3>").html('New Event:').after($("<p>").html("<b>Category:</b> " + category + " <br /> <b>Action:</b> " + action + " <br /> <b>Label:</b> " + label + "<br />")),
            $messageContainer = $("<div>", { "class": "track-event-notification-layer fade-in" });

        if (!$(".track-event-notification-layer").length) {
            $messageContainer.append($message);
            $('body').append($messageContainer);
        } else {
            //clearTimeout(closeDebugLayerTimeout);
            $(".track-event-notification-layer").append($message).removeClass("fade-out").addClass("fade-in");
        }

        //closeDebugLayerTimeout = setTimeout(function () {
        //    $(".track-event-notification-layer").removeClass("fade-in").addClass("fade-out").html("");
        //}, 3000);
    };

    // - Public Functions - - -
    this.setTrackingAction = function (action) {
        trackingCategory = action;
    };

    // - Init - - -
    $.extend(TrackMe.prototype, {
        // Initialization logic
        init: function () {
            this.buildCache();
            this.bindEvents();
        },
        destroy: function () {
            this.unbindEvents();
            this.$element.removeData();
        },

        // Cache DOM nodes for performance
        buildCache: function () {
            this.$element = $(this.element);
        },

        // Bind events that trigger methods
        bindEvents: function () {
            var plugin = this;
            plugin.$element.on('click' + '.' + plugin._name, '.js-track-me', function () {
                plugin.startTracking.call(plugin, $(this));
            });
        },

        // Unbind events that trigger methods
        unbindEvents: function () {
            this.$element.off('.' + this._name);
        },

        // Create custom methods
        startTracking: function ($element) {
            var plugin = this;
            this.trackingData = getTrackingData($element);

            // Track checkbox events
            if ($element.is('input[type=checkbox]') && typeof (plugin.trackingData.labelChecked) !== 'undefined') {
                var label = $element.is(':checked') ? plugin.trackingData.labelChecked : plugin.trackingData.labelNotChecked;

                if (typeof (plugin.trackingData.event) === 'undefined' && label !== 'undefined') {
                    plugin.trackUserEvents(jsInit.analytics.category, plugin.trackingData.action, label);
                } else {
                    $('body').off(plugin.trackingData.event).one(plugin.trackingData.event, function () {
                        plugin.trackUserEvents(jsInit.analytics.category, plugin.trackingData.action, label);
                    });
                }

                // Track only if form is valid
            } else if (typeof (plugin.trackingData.formToValidate) !== 'undefined') {
                if (formIsValid(plugin.trackingData.formToValidate)) {
                    plugin.trackUserEvents(jsInit.analytics.category, plugin.trackingData.action, plugin.trackingData.label);
                }

                // Track on custom event
            } else {
                if (typeof (plugin.trackingData.event) === 'undefined') {
                    plugin.trackUserEvents(jsInit.analytics.category, plugin.trackingData.action, plugin.trackingData.label);
                } else {
                    $('body').off(plugin.trackingData.event).one(plugin.trackingData.event, function () {
                        plugin.trackUserEvents(jsInit.analytics.category, plugin.trackingData.action, plugin.trackingData.label);
                    });
                }
            }

            this.callback();
        },

        setTrackingCategory: function (category) {
            this.trackingData.category = category;
        },

        trackUserEvents: function (category, action, label) {
            if (typeof (label) !== "undefined" && typeof (action) !== "undefined") {
                $Y.track.userEvent('ga', { category: category, action: action, label: label });
            }

            console.log(this.options.debug);
            if (this.options.debug) {
                debugTrackedEvent(category, action, label);
            }
        },

        callback: function () {
            // Cache onComplete option
            var onComplete = this.options.onComplete;

            if (typeof onComplete === 'function') {
                onComplete.call(this.element);
            }
        },

        trackingData: {}
    });

    $.fn.trackMe = function (options) {
        this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new TrackMe(this, options));
            }
        });

        return this;
    };

    $.fn.trackMe.defaults = {
        debug: 'false',
        onComplete: function () { }
    };

})(jQuery, window, document);
