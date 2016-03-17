/*!
 * jQuery TrackMe v1.6 - 17/03/2016
 * --------------------------------
 * Original author: Marco Trevisani (marco.trevisani@ynap.com)
 * Further changes, comments:
 * Licensed under the MIT license
 */
; (function ($, window, document) {
    "use strict";

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
    var formIsValid = function (formId) {
        if (typeof (formId) !== "undefined") {
            var $formToValidate = $("#" + formId);
            if ($formToValidate.length && !$formToValidate.valid()) {
                return false;
            }
        }
        return true;
    };

    // ( Debug Layer )
    var onlineOrStageEnvironment = function () {
        if (document.location.hostname.match("yoox.com$")) {
            return true;
        }
        return false;
    },
        checkQueryString = function () {
            //if (location.search.match("td=1$")) {
            //    return true;
            //}
            //return false;
            return true;
        },
        debugTrackedEvent = function (category, action, label) {
            if (!onlineOrStageEnvironment() && checkQueryString()) {
                var messageText = "[EVENT] --------------------\nCategory: " + category + "\nAction: " + action + "\nLabel: " + label + "\n----------------------------",
                    messageHtml = "<b>Category:</b> " + category + " <b> - Action:</b> " + action + " <b> - Label:</b> " + label + "<br />",
                    $message = $("<h3>").html("New Event:").after($("<p>").html(messageHtml)),
                    $messageContainer = $("<div>", { "class": "track-event-notification-layer fade-in" });

                if (!$(".track-event-notification-layer").length) {
                    $messageContainer.append($message);
                    $("body").append($messageContainer);
                } else {
                    clearTimeout(window.closeDebugLayerTimeout);
                    $(".track-event-notification-layer").append($message).removeClass("fade-out").addClass("fade-in");
                }

                window.closeDebugLayerTimeout = setTimeout(function () {
                    $(".track-event-notification-layer").removeClass("fade-in").addClass("fade-out");
                    setTimeout(function () {
                        $(".track-event-notification-layer").html("");
                    }, 1000);
                }, 3500);

                console.log(messageText);
            }
        };

    // - Public Functions - - -
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

            plugin.$element.on("click" + "." + plugin._name, ".js-track-me", function () {
                plugin.startTracking.call(plugin, $(this));
            });

            plugin.$element.on("hover" + "." + plugin._name, ".js-track-me-hover", function () {
                plugin.startTracking.call(plugin, $(this));
            });

            plugin.$element.on("focus" + "." + plugin._name, ".js-track-me-focus", function () {
                plugin.startTracking.call(plugin, $(this));
            });
        },

        // Unbind events that trigger methods
        unbindEvents: function () {
            this.$element.off("." + this._name);
        },

        getTrackingData: function ($elm) {
            return {
                category: typeof ($elm.data("trackingCategory")) === "undefined" ? this.options.category : $elm.data("trackingCategory"),
                action: typeof ($elm.data("trackingAction")) === "undefined" ? this.options.action : $elm.data("trackingAction"),
                label: $elm.data("trackingLabel"),
                labelChecked: $elm.data("trackingLabelChecked"),
                labelNotChecked: $elm.data("trackingLabelNotChecked"),
                labelOn: $elm.data("trackingLabelOn"),
                labelOff: $elm.data("trackingLabelOff"),
                event: $elm.data("trackingEvent"),
                formToValidate: $elm.data("trackingFormId")
            };
        },

        startTracking: function ($element) {
            var plugin = this;
            this.trackingData = this.getTrackingData($element);

            // Track checkbox events
            if ($element.is("input[type=checkbox]") && typeof (plugin.trackingData.labelChecked) !== "undefined") {
                var label = $element.is(":checked") ? plugin.trackingData.labelChecked : plugin.trackingData.labelNotChecked;

                if (typeof (plugin.trackingData.event) === "undefined" && label !== "undefined") {
                    plugin.trackUserEvent(plugin.trackingData.category, plugin.trackingData.action, label);
                } else {
                    $("body").off(plugin.trackingData.event).one(plugin.trackingData.event, function () {
                        plugin.trackUserEvent(jsInit.analytics.category, plugin.trackingData.action, label);
                    });
                }
                // Track switch events
            } else if (typeof (plugin.trackingData.labelOn) !== "undefined" || typeof (plugin.trackingData.labelOff) !== "undefined") {
                if ($element.hasClass("js-track-me-on")) {
                    $element.removeClass("js-track-me-on");
                    plugin.trackUserEvent(plugin.trackingData.category, plugin.trackingData.action, plugin.trackingData.labelOff);
                } else {
                    $element.addClass("js-track-me-on");
                    plugin.trackUserEvent(plugin.trackingData.category, plugin.trackingData.action, plugin.trackingData.labelOn);
                }
                // Track only if form is valid
            } else if (typeof (plugin.trackingData.formToValidate) !== "undefined") {
                if (formIsValid(plugin.trackingData.formToValidate)) {
                    plugin.trackUserEvent(plugin.trackingData.category, plugin.trackingData.action, plugin.trackingData.label);
                }

                // Track on custom event
            } else {
                if (typeof (plugin.trackingData.event) === "undefined") {
                    plugin.trackUserEvent(plugin.trackingData.category, plugin.trackingData.action, plugin.trackingData.label);
                } else {
                    $("body").off(plugin.trackingData.event).one(plugin.trackingData.event, function () {
                        plugin.trackUserEvent(plugin.trackingData.category, plugin.trackingData.action, plugin.trackingData.label);
                    });
                }
            }

            this.callback();
        },

        setTrackingCategory: function (category) {
            this.options.category = category;
        },

        setTrackingAction: function (action) {
            this.options.action = action;
        },

        updateTrackingData: function (updatedTrackingData) {
            $.extend(true, this.trackingData, updatedTrackingData);
        },

        getCurrentTrackingCategory: function () {
            return this.options.category;
        },

        getCurrentTrackingAction: function () {
            return this.options.action;
        },

        trackUserEvent: function (category, action, label) {
            if (typeof (label) !== "undefined" && typeof (action) !== "undefined" && label !== "" && action !== "") {
                if (this.options.debug) {
                    debugTrackedEvent(category, action, label);
                }

                $Y.track.userEvent("ga", { category: category, action: action, label: label });
            }
        },

        callback: function () {
            // Cache onComplete option
            var onComplete = this.options.onComplete;

            if (typeof onComplete === "function") {
                onComplete.call(this.element);
            }
        },

        trackingData: {
            category: "",
            action: "",
            label: "",
            labelChecked: "",
            labelNotChecked: "",
            labelOn: "",
            labelOff: "",
            event: "",
            formToValidate: ""
        }
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
        debug: true, // true: activate the event notification layer
        category: "",
        action: "",
        onComplete: function () { }
    };

    $.fn.triggerDelayed = function (event, delay) {
        delay = delay || 50;
        var element = $(this);
        setTimeout(function () {
            element.trigger(event);
        }, delay);
    };

})(jQuery, window, document);