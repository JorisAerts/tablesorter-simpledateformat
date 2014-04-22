(function () {

    /**

     SimpleDateFormat (v0.1)
     by Joris Aerts 2014

     Date and Time Patterns:
     =======================
     G    Era designator    Text    AD
     y    Year    Year    1996; 96
     Y    Week year    Year    2009; 09
     M    Month in year    Month    July; Jul; 07
     w    Week in year    Number    27
     W    Week in month    Number    2
     D    Day in year    Number    189
     d    Day in month    Number    10
     F    Day of week in month    Number    2
     E    Day name in week    Text    Tuesday; Tue
     u    Day number of week (1 = Monday, ..., 7 = Sunday)    Number    1
     a    Am/pm marker    Text    PM
     H    Hour in day (0-23)    Number    0
     k    Hour in day (1-24)    Number    24
     K    Hour in am/pm (0-11)    Number    0
     h    Hour in am/pm (1-12)    Number    12
     m    Minute in hour    Number    30
     s    Second in minute    Number    55
     S    Millisecond    Number    978
     z    Time zone    General time zone    Pacific Standard Time; PST; GMT-08:00
     Z    Time zone    RFC 822 time zone    -0800
     X    Time zone    ISO 8601 time zone    -08; -0800; -08:00

     */
    var SimpleDateFormat = function (_cache) {

        var

            _regexEscape = function (value) {
                return "\\" + value;
            },

            RegExBuilder = {
                len: function (options) {
                    options = options || {};
                    return function (match) {
                        return '(' +
                            (options.type || _regexEscape("d")) +
                            '{' + match.length + '}' +
                        ')';
                    }
                },
                val: function (value) {
                    return function () {
                        var a = arguments;
                        return a.length < 2 ? a[0] : "(" + [].join.call(a, "|") + ")";
                    }
                },
                wordChar: function (value) {
                    return function () {
                        return "([\\w\\d]+)";
                    }
                }
            },

            _createValue = function (ret, increase) {
                return ret ? (jQuery.isFunction(ret) ? ret : function (format, value, date) {
                    date[ret](parseInt(value,10) + (increase || 0), 10)
                }) : function () {
                };
            },

            _createPattern = function () {
                var a = arguments;
                return {
                    pattern:    a[0],
                    parse:        _createValue.apply(this, [].slice.call(a, 1))
                };
            },

            Patterns = {
                "Y": _createPattern(RegExBuilder.len(), function (format, value, date) {
                    value = parseInt(value,10);
                    date[format.length > 2 ? "setFullYear" : "setYear"](value);
                }),
                "y": _createPattern(RegExBuilder.len(), function (format, value, date) {
                    value = parseInt(value,10);
                    date[format.length > 2 ? "setFullYear" : "setYear"](value);
                }),
                "M": _createPattern(RegExBuilder.wordChar(), function (format, value, date) {
                    var l = format.length;
                    if (l == 3) {
                        value = Months.indexOf(value);
                    } else {
                        value = parseInt(value, 10);
                    }
                    date.setMonth(value - 1);
                }),
                "d": _createPattern(RegExBuilder.len(), "setDate", -1),
                "H": _createPattern(RegExBuilder.len(), "setHours"),
                "m": _createPattern(RegExBuilder.len(), "setMinutes"),
                "s": _createPattern(RegExBuilder.len(), "setSeconds"),
                "S": _createPattern(RegExBuilder.len(), "setMilliseconds")
            },

            /** The regular expression, used to decode the pattern */
            _splitterRegex = function () {
                var s = "", v;
                for (v in Patterns) {
                    s += v;
                }
                return new RegExp("'.*'|[" + s + "]+", "g");
            }(),

            /*

            // NOT YET FULLY SUPPORTED IN ALL BROWSERS:

            getLocaleString = function(locale, d, v){
                var opts = { weekday: "long" };
                //opts[v] = "long";
                return(d.toLocaleString(locale,opts));
            },
            getLocale = function (locale) {
                var dateRef = new Date(),
                    year = dateRef.getFullYear(),
                    day,
                    ret = { days: [], months: []  };
                dateRef.setMonth(0);
                dateRef.setDate(0);
                day = dateRef.getDay();
                for (var i = 0; i < 7; i++) {
                    ret.days[(7 + i - day) % 7] = getLocaleString(locale, dateRef, "weekday");
                    dateRef.setMonth(dateRef.getMonth() + 1);
                }
                while (year == dateRef.getFullYear()) {
                    ret.months.push(getLocaleString(locale, dateRef, "month"));
                    dateRef.setMonth(dateRef.getMonth() + 1);
                }
                return ret;
            }
            */

            _getLocale = function(cache){
                return function(locale) {
                    locale = "en";
                    return SimpleDateFormat.Locale[locale];
                };
            }({}),

            /** Creates the regex for a pattern */
            _createParser = function (pattern, locale) {
                var index = [],
                    regex = pattern.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, function (c) {
                        return _regexEscape(c);
                    }).replace(
                        _splitterRegex,
                        function (match /*, offset, string */) {
                            var c = match.charAt(0);
                            index.push( match);
                            if (!Patterns.hasOwnProperty(c)) {
                                return match;
                            }
                            return(Patterns[c].pattern(match, locale));
                        }
                    );
                return [ new RegExp(regex), index ];
            },


            /** Cached pattern-based Regex retrieval */
            _getParser = function (pattern, locale) {
                if (_cache[pattern] == null) {
                    _cache[pattern] = _createParser(pattern, locale);
                }
                return _cache[pattern];
            },

            /** Parse a date with the (_cached) pattern */
            _parseDate = function (source, pattern, locale) {
                var ref = _getParser(pattern, locale),
                    regex = ref[0],
                    index = ref[1],
                    match = source.match(regex),
                    i = 1, l = match.length,
                    date = new Date(0),
                    c;
                for (; i < l; i++) {
                    pattern = index[i - 1],
                        c = pattern.charAt(0);
                    if (Patterns.hasOwnProperty(c)) {
                        Patterns[c].parse(pattern, match[i], date);
                    }
                }
                return date;
            }

            ;

        function SimpleDateFormat(pattern, locale) {
            this.pattern = pattern;
            this.locale = _getLocale(locale);
        };

        SimpleDateFormat.prototype = {

            /** parse a String into a Date */
            parse: function (value) { return _parseDate(value, this.pattern); },

            /** format a Date into a String */
            format: function (date) { }

        };

        SimpleDateFormat.Locale = {
            en: function(){
                var ret = {
                    Months: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                    Days: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
                    Era: [ "AD", "BC" ]
                };
                jQuery.each(["Months", "Days"],function(i,n){
                    ret[n+"Short"] = [];
                    jQuery.each(ret[n],function(i, v){
                        ret[n+"Short"][i] = v.substr(0,3);
                    });
                });
                return ret;
            }()
        };

        return SimpleDateFormat;

    }({});

    function getFormat(s, table, cell, cellIndex){
        var c = table.config,
            ci = c.$headers.filter('[data-column=' + cellIndex + ']:last');
        return ci.length && ci[0].dateFormat ||
                jQuery.tablesorter.getData(ci, c.headers[cellIndex], 'dateFormat') ||
                c.dateFormat;
    }

    jQuery.tablesorter.addParser(function () {

        /** The parser declaration */
        return {

            id: "SimpleDateFormat", // "yyyy-mm-dd HH:mm:ss.SSS", ...
            type: "numeric",

            is: function () {
                return false;
            },

            format: function (s, table, cell, cellIndex) {
                var date = new SimpleDateFormat(getFormat(s, table, cell, cellIndex)).parse(s).getTime();
                return date ? date || s : s;
            }

        };

    }());


})();