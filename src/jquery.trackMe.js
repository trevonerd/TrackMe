/**
 * ___________                     __      _____
 * \__    ___/___________    ____ |  | __ /     \   ____
 *   |    |  \_  __ \__  \ _/ ___\|  |/ //  \ /  \_/ __ \
 *   |    |   |  | \// __ \\  \___|    </    Y    \  ___/
 *   |____|   |__|  (____  /\___  >__|_ \____|__  /\___  >
 *                       \/     \/     \/       \/     \/
 *
 *
 * jQuery TrackMe v2.1.8 - 10/08/2016
 * --------------------------------
 * Original author: Marco Trevisani (marco.trevisani@ynap.com)
 * Further changes, comments:
 * --- v2.18:
 * - fix event tracking!
 * - refactoring tracking functions.
 * --- v2.17:
 * - now you can grab the action from another element using the data attribute: "data-tracking-action-from-id"
 * --- v2.16:
 * - added tracking on selects (on change).
 * - added tracking on radios (add class js-track-me-container to the radios container).
 * --- v2.15:
 * - added tracking on keyup event.
 * --- v2.14:
 * - added no follow links feature.
 * --- v2.1.3:
 * - added placeholder feature for labels.
 * --- v2.1.2:
 * - added simple description :)
 * - added new public function trackEvent{trackingInfoObject}
 *
 *
 **** Description:
 * What does this plugin?
 * - It attaches the event tracking on elements with specific classes reading data attributes for the tracking info.
 * - It tracks the user behavior during filling of the form.
 *
 **** Available custom classes:
 * js-track-me          {any element} - track event on click.
 * js-track-me-hover:   {any element} - track event on mouseover.
 * js-track-me-focus:   {any element} - track event on focus.
 * js-track-me-form:    {form} - track user behavior during filling of the form (skipped inputs and inputs not valid).
 * js-track-me-keyup:   {text input} - track event on key up (first char only).
 * js-track-me-select:  {select} - track on change event.
 *
 **** Data Attributes:
 * data-tracking-category               - Set the event category.
 * data-tracking-action                 - Set the event action.
 * data-tracking-label                  - Set the event label.
 * data-tracking-form-id                - Track only if this form is valid.
 * data-tracking-event                  - Track only when this event will dispatched.
 * data-tracking-label-checked          - {checkbox only} this is the event label when the checkbox is checked.
 * data-tracking-label-not-checked      - {checkbox only} this is the event label when the checkbox isn't checked.
 * data-tracking-label-on               - {element with a switch functionality} Set the event label when the switch is on. (es: accordion open, option turned on...).
 * data-tracking-label-off              - {element with a switch functionality} Set the event label when the switch is off. (es: accordion closed, option turned off...).
 * data-tracking-action-from-id         - Get the tracking action data attribute from this element.
 *
 **** Initialisation Options:
 *      $(selector).trackMe({
 *       debug: false,
 *       formTracking {
 *           completedEvents: false,
 *           oneTimeOnly: true,
 *           labelCompleted: "completed",
 *           labelNotValid: "not valid",
 *           labelSkipped: "skipped"
 *       },
 *       category: "custom global category",
 *       action: "custom global action",
 *       callback: function() {
 *          console.log("Event tracked.");
 *
 **** Usage Example:
 *
 *  JS: $(selector).trackMe();
 *  HTML: <a class="link js-track-me" href="a_beautiful_link" data-tracking-category="myoox" data-tracking-action="home" data-tracking-label="banner">Click Me!</a>
 *
 **** More Examples:
 *
 * You can set custom global action and label using public functions:
 *
 *      $(selector).trackMe();
 *      $(selector).data("plugin_trackMe").setTrackingCategory("custom global category");
 *      $(selector).data("plugin_trackMe").setTrackingAction("custom global action");
 *
 */
;
(function ($, window, document) {
    "use strict";

    var pluginName = "trackMe";

    function TrackMe (element, options) {
        this.element = element;
        this._name = pluginName;
        this._defaults = $.fn.trackMe.defaults;
        this.options = $.extend({}, this._defaults, options);
        this.trackingData = {};
        this.init();
    }

    // - Private Functions - - -
    var formIsValid = function (formId) {
        if (formId !== undefined) {
            var $formToValidate = $("#" + formId);
            if ($formToValidate.length && !$formToValidate.valid()) {
                return false;
            }
            if ($("#" + formId + " #Privacy").length > 0 || $("#" + formId + " #privacy").length > 0) {
                if ($Y.privacyManager && !$Y.privacyManager.isValid()) {
                    return false;
                }
            }
        }
        return true;
    };

    // ( Debug Layer )
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
                var messageText = "[EVENT] --------------------\nCategory: " +
                        category +
                        "\nAction: " +
                        action +
                        "\nLabel: " +
                        label +
                        "\n----------------------------",
                    messageHtml = "Category:</b> " +
                        category +
                        " <br /> <b>Action:</b> " +
                        action +
                        " <br /> <b>Label:</b> " +
                        label +
                        "<br />",
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
                        $(".track-event-notification-layer").removeClass("fade-in").addClass("fade-out").html("");
                    },
                    3000);

                console.log(messageText);
            }
        };

    // - Public Functions - - -
    $.extend(TrackMe.prototype,
        {
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

                plugin.$element.on("click" + "." + plugin._name,
                    ".js-track-me",
                    function (e) {
                        if (plugin.options.debugNoFollowLinks) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        plugin.startTracking.call(plugin, $(this));
                    });

                plugin.$element.on("hover" + "." + plugin._name,
                    ".js-track-me-hover",
                    function () {
                        plugin.startTracking.call(plugin, $(this));
                    });

                plugin.$element.on("keyup" + "." + plugin._name,
                    ".js-track-me-keyup",
                    function () {
                        // track only REQUIRED input not already tracked.
                        if (!$(this).data("alreadyTracked")) {
                            plugin.startTracking.call(plugin, $(this));
                        }
                    });

                plugin.$element.on("focus" + "." + plugin._name,
                    ".js-track-me-focus",
                    function () {
                        plugin.startTracking.call(plugin, $(this));
                    });

                plugin.$element.on("blur" + "." + plugin._name,
                    ".js-track-form input:not([type=submit]), .js-track-form select",
                    function () {
                        // track only REQUIRED input not already tracked.
                        if (!$(this).data("alreadyTracked") && $(this).data("valRequired") !== undefined) {
                            plugin.startTrackingForm.call(plugin, $(this));
                        }
                    });

                plugin.$element.on("change" + "." + plugin._name,
                    ".js-track-me-select",
                    function () {
                        plugin.startTrackingSelect.call(plugin, $(this));
                    });
            },

            // Unbind events that trigger methods
            unbindEvents: function () {
                this.$element.off("." + this._name);
            },

            // START - Get data functions
            getTrackingData: function ($elm) {
                var $actionTargetElm = $elm;
                var customActionTargetElement = $elm.data("tracking-action-from-id");
                if (customActionTargetElement !== undefined) {
                    $actionTargetElm = $(customActionTargetElement);
                }

                return {
                    category: ($elm.data("trackingCategory")) === undefined
                        ? this.options.category
                        : $elm.data("trackingCategory"),
                    action: ($actionTargetElm.data("trackingAction")) === undefined
                        ? this.options.action
                        : $actionTargetElm.data("trackingAction"),
                    label: $elm.data("trackingLabel"),
                    labelChecked: $elm.data("trackingLabelChecked"),
                    labelNotChecked: $elm.data("trackingLabelNotChecked"),
                    labelOn: $elm.data("trackingLabelOn"),
                    labelOff: $elm.data("trackingLabelOff"),
                    event: $elm.data("trackingEvent"),
                    formToValidate: $elm.data("trackingFormId"),
                    getActionFrom: $elm.data("tracking-action-from-id")
                };
            },

            getSelectTrackingData: function ($elm) {
                var $selectedOptions = $elm.find(":selected");
                return {
                    category: ($selectedOptions.data("trackingCategory")) === undefined
                        ? this.options.category
                        : $selectedOptions.data("trackingCategory"),
                    action: ($selectedOptions.data("trackingAction")) === undefined
                        ? this.options.action
                        : $selectedOptions.data("trackingAction"),
                    label: $selectedOptions.data("trackingLabel"),
                    event: $selectedOptions.data("trackingEvent")
                };
            },

            getFormTrackingData: function ($elm) {
                var $form = $elm.closest("form");
                return {
                    category: ($form.data("trackingCategory")) === undefined
                        ? this.options.category
                        : $form.data("trackingCategory"),
                    action: ($form.data("trackingAction")) === undefined
                        ? this.options.action
                        : $form.data("trackingAction"),
                    label: $form.data("trackingFormName"),
                    fieldName: ($elm.data("trackingName")) === undefined ? $elm.attr("name") : $elm.data("trackingName")
                };
            },
            // END - Get data functions

            elementAlreadyTracked: function ($element) {
                if (!$element.data("alreadyTracked")) {
                    return false;
                }
                return true;
            },

            setAlreadyTrackedDataToRadio: function ($element) {
                $element.closest("form").find("input[type=radio]").data("alreadyTracked", false);
                $element.data("alreadyTracked", true);
            },

            // Start - Tracking Functions
            eventTrackingDefault: function () {
                var plugin = this,
                    trackingFunction = function () {
                        plugin.trackUserEvent(plugin.trackingData.category,
                            plugin.trackingData.action,
                            plugin.trackingData.label);
                    };
                $("body")
                    .off(plugin.trackingData.event)
                    .one(plugin.trackingData.event, trackingFunction);
            },

            trackMeDefault: function () {
                var plugin = this;
                if (plugin.trackingData.label !== undefined) {
                    if (plugin.trackingData.event === undefined) {
                        plugin.trackUserEvent(plugin.trackingData.category,
                            plugin.trackingData.action,
                            plugin.trackingData.label);
                    } else {
                        plugin.eventTrackingDefault(plugin);
                    }
                }
            },

            trackMeRadio: function ($element) {
                var plugin = this;

                if (plugin.trackingData.event === undefined &&
                    plugin.trackingData.label !== undefined &&
                    !plugin.elementAlreadyTracked($element)) {
                    plugin.trackUserEvent(plugin.trackingData.category,
                        plugin.trackingData.action,
                        plugin.trackingData.label);
                    $element.parents(".js-track-me-container").find("input:radio").removeData("alreadyTracked");
                    $element.data("alreadyTracked", true);
                    plugin.setAlreadyTrackedDataToRadio($element);
                } else if (plugin.trackingData.event !== undefined && !plugin.elementAlreadyTracked($element)) {
                    var trackingFunction = function () {
                        plugin.trackUserEvent(plugin.trackingData.category,
                            plugin.trackingData.action,
                            plugin.trackingData.label);
                        $element.parents(".js-track-me-container").find("input:radio").removeData("alreadyTracked");
                        $element.data("alreadyTracked", true);
                        plugin.setAlreadyTrackedDataToRadio($element);
                    };
                    $("body")
                        .off(plugin.trackingData.event, trackingFunction)
                        .one(plugin.trackingData.event, trackingFunction);
                }
            },

            trackMeSwitch: function ($element) {
                var plugin = this;

                if ($element.hasClass("js-track-me-on")) {
                    $element.removeClass("js-track-me-on");
                    plugin.trackUserEvent(plugin.trackingData.category,
                        plugin.trackingData.action,
                        plugin.trackingData.labelOff);
                } else {
                    $element.addClass("js-track-me-on");
                    plugin.trackUserEvent(plugin.trackingData.category,
                        plugin.trackingData.action,
                        plugin.trackingData.labelOn);
                }
            },

            trackMeFormValid: function () {
                var plugin = this;
                if (formIsValid(plugin.trackingData.formToValidate)) {
                    plugin.trackMeDefault();
                }
            },

            startTracking: function ($element) {
                var plugin = this;
                this.trackingData = this.getTrackingData($element);

                // Track checkbox events
                if ($element.is("input[type=checkbox]") && plugin.trackingData.labelChecked !== undefined) {
                    plugin.trackingData.label = $element.is(":checked")
                        ? plugin.trackingData.labelChecked
                        : plugin.trackingData.labelNotChecked;
                    plugin.trackMeDefault();

                    // Track radio events
                } else if ($element.is("input[type=radio]")) {
                    plugin.trackMeRadio($element);

                    // Track switch events
                } else if (plugin.trackingData.labelOn !== undefined || plugin.trackingData.labelOff !== undefined) {
                    plugin.trackMeSwitch($element);

                    // Track only if form is valid
                } else if (plugin.trackingData.formToValidate !== undefined) {
                    plugin.trackMeFormValid();
                    // Default tracking
                } else {
                    plugin.trackMeDefault();
                }

                if ($element.hasClass("js-track-me-keyup")) {
                    $element.data("alreadyTracked", true);
                }

                this.callback();
            },

            startTrackingSelect: function ($element) {
                var plugin = this;
                this.trackingData = this.getSelectTrackingData($element);

                if (plugin.trackingData.event === undefined) {
                    plugin.trackUserEvent(plugin.trackingData.category,
                        plugin.trackingData.action,
                        plugin.trackingData.label);
                } else {
                    plugin.trackingFunction = function () {
                        plugin.trackUserEvent(plugin.trackingData.category,
                            plugin.trackingData.action,
                            plugin.trackingData.label);
                    };
                    $("body")
                        .off(plugin.trackingData.event, plugin.trackingFunction)
                        .one(plugin.trackingData.event, plugin.trackingFunction);
                }
            },

            startTrackingForm: function ($element) {
                var plugin = this;
                this.trackingData = this.getFormTrackingData($element);

                if ($element.val().length === 0) {
                    plugin.trackUserEvent(plugin.trackingData.category,
                        plugin.trackingData.action,
                        plugin.trackingData.label +
                        " " +
                        plugin.options.formTracking.labelSkipped +
                        " " +
                        plugin.trackingData.fieldName);
                } else if (!$element.valid()) {
                    plugin.trackUserEvent(plugin.trackingData.category,
                        plugin.trackingData.action,
                        plugin.trackingData.label +
                        " " +
                        plugin.options.formTracking.labelNotValid +
                        " " +
                        plugin.trackingData.fieldName);
                } else {
                    if (this.options.formTracking.completedEvents) {
                        plugin.trackUserEvent(plugin.trackingData.category,
                            plugin.trackingData.action,
                            plugin.trackingData.label +
                            " " +
                            plugin.options.formTracking.labelCompleted +
                            " " +
                            plugin.trackingData.fieldName);
                    }
                }
                if (this.options.formTracking.oneTimeOnly) {
                    $element.data("alreadyTracked", true);
                }

                this.callback();
            },
            // END - Tracking Function

            setTrackingCategory: function (category) {
                this.options.category = category;
            },

            setTrackingAction: function (action) {
                this.options.action = action;
            },

            addPlaceholder: function (placeholder) {
                $.extend(this.options.placeholders, placeholder);
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

            managePlaceholder: function (text) {
                var myRegexp = /{{([a-zA-Z0-9_]*)}}/g,
                    result = text.match(myRegexp),
                    placeholderText,
                    i;
                if (result) {
                    for (i = 0; i <= result.length; i = i + 1) {
                        placeholderText = this.options.placeholders[result[i]] !== undefined
                            ? this.options.placeholders[result[i]]
                            : "";
                        text = text.replace(result[i], placeholderText);
                    }
                }
                return text;
            },

            trackUserEvent: function (category, action, label) {
                if (label !== undefined && action !== undefined && label !== "" && action !== "") {
                    if (this.options.debug) {
                        debugTrackedEvent(category, action, label);
                    }

                    label = this.managePlaceholder(label);

                    $Y.track.userEvent("ga", { category: category, action: action, label: label });
                }
            },

            trackEvent: function (trackInfo) {
                trackInfo.category = trackInfo.category || this.options.category;
                trackInfo.action = trackInfo.action || this.options.action;

                if (trackInfo.label !== undefined &&
                    trackInfo.action !== undefined &&
                    trackInfo.label !== "" &&
                    trackInfo.action !== "") {
                    if (this.options.debug) {
                        debugTrackedEvent(trackInfo.category, trackInfo.action, trackInfo.label);
                    }

                    $Y.track.userEvent("ga",
                        { category: trackInfo.category, action: trackInfo.action, label: trackInfo.label });
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
        debug: false, // true: activate the event notification layer
        debugNoFollowLinks: false, // DANGEROUS!
        formTracking: {
            completedEvents: false,
            oneTimeOnly: true,
            labelCompleted: "completed",
            labelNotValid: "not valid",
            labelSkipped: "skipped"
        },
        category: "",
        action: "",
        placeholders: {},
        onComplete: function () {
        }
    };

    $.fn.triggerDelayed = function (event, delay) {
        delay = delay || 50;
        var element = $(this);
        setTimeout(function () {
                element.trigger(event);
            },
            delay);
    };

}(jQuery, window, document));