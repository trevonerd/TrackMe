/**
 * ___________                     __      _____
 * \__    ___/___________    ____ |  | __ /     \   ____
 *   |    |  \_  __ \__  \ _/ ___\|  |/ //  \ /  \_/ __ \
 *   |    |   |  | \// __ \\  \___|    </    Y    \  ___/
 *   |____|   |__|  (____  /\___  >__|_ \____|__  /\___  >
 *                       \/     \/     \/       \/     \/
 *
 *
 * jQuery TrackMe v2.1.1 - 06/04/2016
 * --------------------------------
 * Original author: Marco Trevisani (marco.trevisani@ynap.com)
 * Further changes, comments:
 * - added jsdoc comments
 *
 * Licensed under the MIT license
 *
 * @name $
 * @class
 * @ignore
 * @description This just documents the method that is added to jQuery by this plugin.
 * See <a href="http://jquery.com/">the jQuery library</a> for full details.
 */
/**
 * @name $.fn
 * @memberof $
 * @description This just documents the method that is added to jQuery by this plugin.
 * See <a href="http://jquery.com/">the jQuery library</a> for full details.
 */
;(function ($, window, document) {
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
    /**
     * @private
     */
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
    /**
     * @private
     */
    var onlineOrStageEnvironment = function () {
            if (document.location.hostname.match("yoox.com$") || document.location.hostname.match("yoox.cn$")) {
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
                    messageHtml = "Category:</b> " + category + " <br /> <b>Action:</b> " + action + " <br /> <b>Label:</b> " + label + "<br />",
                    $message = $("<h3>").html("New Event:").after($("<p>").html(messageHtml)),
                    $messageContainer = $("<div>", {"class": "track-event-notification-layer fade-in"});

                if (!$(".track-event-notification-layer").length) {
                    $messageContainer.append($message);
                    $("body").append($messageContainer);
                } else {
                    clearTimeout(window.closeDebugLayerTimeout);
                    $(".track-event-notification-layer").append($message).removeClass("fade-out").addClass("fade-in");
                }

                window.closeDebugLayerTimeout = setTimeout(function () {
                    $(".track-event-notification-layer").removeClass("fade-in").addClass("fade-out").html("");
                }, 3000);

                console.log(messageText);
            }
        };

    // - Public Functions - - -
    $.extend(TrackMe.prototype, {
        /**
         * Initialization logic
         * @ignore
         * @function
         * @memberof trackMe
         * @example $(selector).trackMe();
         */
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

            plugin.$element.on("blur" + "." + plugin._name, ".js-track-form input:not([type=submit]), .js-track-form select", function (event) {
                // track only REQUIRED input not already tracked.
                if (!$(this).data("alreadyTracked") && typeof ($(this).data("valRequired")) !== 'undefined') {
                    plugin.startTrackingForm.call(plugin, $(this));
                }
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

        getFormTrackingData: function ($elm) {
            var $form = $elm.closest('form');
            return {
                category: typeof ($form.data("trackingCategory")) === "undefined" ? this.options.category : $form.data("trackingCategory"),
                action: typeof ($form.data("trackingAction")) === "undefined" ? this.options.action : $form.data("trackingAction"),
                label: $form.data("trackingFormName"),
                fieldName: typeof ($elm.data("trackingName")) === "undefined" ? $elm.attr('name') : $elm.data("trackingName")
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
                        plugin.trackUserEvent(plugin.trackingData.category, plugin.trackingData.action, label);
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

        startTrackingForm: function ($element) {
            var plugin = this;
            this.trackingData = this.getFormTrackingData($element);

            if ($element.val().length === 0) {
                plugin.trackUserEvent(plugin.trackingData.category, plugin.trackingData.action, plugin.trackingData.label + " " + plugin.options.formTracking.labelSkipped + " " + plugin.trackingData.fieldName);
            } else if (!$element.valid()) {
                plugin.trackUserEvent(plugin.trackingData.category, plugin.trackingData.action, plugin.trackingData.label + " " + plugin.options.formTracking.labelNotValid + " " + plugin.trackingData.fieldName);
            } else {
                if (this.options.formTracking.completedEvents) {
                    plugin.trackUserEvent(plugin.trackingData.category, plugin.trackingData.action, plugin.trackingData.label + " " + plugin.options.formTracking.labelCompleted + " " + plugin.trackingData.fieldName);
                }
            }
            if (this.options.formTracking.oneTimeOnly) {
                $element.data("alreadyTracked", true);
            }

            this.callback();
        },

        /**
         * Set global tracking category
         * @method
         * @param {string} category - Category name.
         * @memberof trackMe
         * @example
         * $(selector).data("plugin_trackMe").setTrackingCategory("cart");
         */
        setTrackingCategory: function (category) {
            this.options.category = category;
        },

        /**
         * Set global tracking action
         * @method
         * @param {string} action - Action name.
         * @memberof trackMe
         * @example
         * $(selector).data("plugin_trackMe").setTrackingAction("delivery page");
         */
        setTrackingAction: function (action) {
            this.options.action = action;
        },

        updateTrackingData: function (updatedTrackingData) {
            $.extend(true, this.trackingData, updatedTrackingData);
        },

        /**
         * Get current global tracking category
         * @method
         * @return {string} Current global tracking category
         * @memberof trackMe
         * @example
         * $(selector).data("plugin_trackMe").getCurrentTrackingCategory();
         */
        getCurrentTrackingCategory: function () {
            return this.options.category;
        },

        /**
         * Get current global tracking action
         * @method
         * @return {string} Current global tracking action
         * @memberof trackMe
         * @example
         * $(selector).data("plugin_trackMe").getCurrentTrackingAction();
         */
        getCurrentTrackingAction: function () {
            return this.options.action;
        },

        /**
         * Track custom user event
         * @method
         * @param {string} category - Event category.
         * @param {string} action - Event action.
         * @param {string} label - Event label.
         * @memberof trackMe
         * @example
         * var trackMe = $("body").data("plugin_trackMe");
         * trackMe.trackUserEvent("userbar", "login", "facebook");
         */
        trackUserEvent: function (category, action, label) {
            if (typeof (label) !== "undefined" && typeof (action) !== "undefined" && label !== "" && action !== "") {
                if (this.options.debug) {
                    debugTrackedEvent(category, action, label);
                }

                $Y.track.userEvent("ga", {category: category, action: action, label: label});
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

    /**
     * Start the magic! Attach the event tracking on elements with specific classes.<br />
     * <br />
     * Available custom classes:<br />
     * <b>js-track-me</b>          {any element} - track event on click.<br />
     * <b>js-track-me-hover:</b>   {any element} - track event on mouseover.<br />
     * <b>js-track-me-focus:</b>   {any element} - track event on focus.<br />
     * <b>js-track-me-form:</b>    {form} - track user behavior during filling of the form.<br />
     *
     * @param {Object}  [options] - The plugin options.
     * @param {boolean} [options.debug=false] - Debug mode with console.log and in-page notification layer.
     * @param {Object}  [options.formTracking] - Options for the form tracking feature.
     * @param {boolean} [options.formTracking.completedEvents=false] - Track the successful completion of the fields.
     * @param {boolean} [options.formTracking.oneTimeOnly=true] - Track the field event only the first time.
     * @param {string}  [options.formTracking.labelCompleted=completed] - Label for the completed event.
     * @param {string}  [options.formTracking.labelNotValid=not valid] - Label for the not valid event.
     * @param {string}  [options.formTracking.labelSkipped=skipped] - Label for the skipped event.
     * @param {string}  [options.category] - The global tracking category name.
     * @param {string}  [options.action] - The global tracking action name.
     * @param {callback} [options.callback] - The default callback called after tracking event.
     * @returns jQuery
     * @name trackMe
     * @class
     * @version 2.1.1
     * @date 6 Apr 2016
     * @author Marco Trevisani
     * @license MIT license
     * @see global
     * @example
     * $(selector).trackMe();
     */
    $.fn.trackMe = function (options) {
        this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new TrackMe(this, options));
            }
        });

        return this;
    };

    /**
     * @name defaults
     * @default
     * @example
     * $(selector).trackMe({
     *       debug: false,
     *       formTracking {
     *           completedEvents: false,
     *           oneTimeOnly: true,
     *           labelCompleted: "completed",
     *           labelNotValid: "not valid",
     *           labelSkipped: "skipped"
     *       },
     *       category: "cart",
     *       action: "",
     *       callback: function() {
     *          console.log("Event tracked.");
     *       };
     * });
     * @property {object}   options - The default plugin options.
     * @property {boolean}  options.debug - Debug mode with console.log and in-page notification layer.
     * @property {object}   options.formTracking - The default options for the form tracking feature.
     * @property {boolean}  options.formTracking.completedEvents - Track the successful completion of the fields.
     * @property {boolean}  options.formTracking.oneTimeOnly - Track the field event only the first time.
     * @property {string}   options.formTracking.labelCompleted - The default label for the completed event.
     * @property {string}   options.formTracking.labelNotValid - The default label for the not valid event.
     * @property {string}   options.formTracking.labelSkipped - The default label for the skipped event.
     * @property {string}   options.category - The default global tracking category name.
     * @property {string}   options.action - The default global tracking action name.
     * @property {callback} options.callback - The default callback called after tracking event.
     */
    $.fn.trackMe.defaults = {
        debug: false, // true: activate the event notification layer
        formTracking: {
            completedEvents: false,
            oneTimeOnly: true,
            labelCompleted: "completed",
            labelNotValid: "not valid",
            labelSkipped: "skipped"
        },
        category: "",
        action: "",
        onComplete: function () {
        }
    };

    /**
     * Trigger an event with a custom delay.
     * @class triggerDelayed
     * @param {string} event - the event name to trigger.
     * @param {number} [delay=50] - the delay in ms to wait before triggering.
     * @example
     * $(selector).triggerDelayed("ITEM_ADDED", 100);
     */
    $.fn.triggerDelayed = function (event, delay) {
        delay = delay || 50;
        var element = $(this);
        setTimeout(function () {
            element.trigger(event);
        }, delay);
    };

})(jQuery, window, document);