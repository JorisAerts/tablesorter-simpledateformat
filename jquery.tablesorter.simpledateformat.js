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
jQuery.tablesorter.addParser(function () {

    var

        /** (Double-) escape a regular expression */
        _regexEscape = function (value) {
            return "\\" + value;
        },

        _int = function(value) {
            return parseInt(value, 10);
        },

        /**
         * Helper for creating regular expressions
         * format-pattern -> [ regex, index ]
         * where index is a string containing the regex names,
         * - used for getting the mapped value -
         * because named groups are impossible in Java
         */
        _cache = {},

        Months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        Days = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
        AD = [ "AD"],

        /** Helper for creating regular expressions */
        RegExBuilder = {
            len: function (options) {
                options = options || {};
                return function (match) {
                    return '(' +
                        (options.type || _regexEscape("d")) +
                        '{' + match.length + '})'
                        ;
                }
            },
            val: function (value) {
                return function () {
                    var a = arguments;
                    return a.length < 2 ? a[0] : "(" + [].join.call(a, "|") + ")";
                }
            }
        },

        _createValue = function (ret, increase) {
            return ret ? (jQuery.isFunction(ret) ? ret : function (format, value, date) {
                date[ret](_int(value) + (increase || 0), 10)
            }) : function () {
            };
        },

        _createPattern = function () {
            var a = arguments;
            return { replace: a[0], val: _createValue.apply(this, [].slice.call(a, 1)) };
        },



        /**
         * The patters to match against
         * Each pattern contains
         * - a replace function, which is used for creating the regular expression
         * - a val function, which is used to set a property of the date (day, month, year, seconds, millis, ...)
         */
        Patterns = {
            "Y": _createPattern(RegExBuilder.len(), function (format, value, date) {
                value = _int(value, 10);
                date[format.length > 2 ? "setFullYear" : "setYear"](value);
            }),
            "y": _createPattern(RegExBuilder.len(), function (format, value, date) {
                value = _int(value, 10);
                date[format.length > 2 ? "setFullYear" : "setYear"](value);
            }),
            "M": _createPattern(RegExBuilder.len({ type: _regexEscape("w") }), function (format, value, date) {
                var l = format.length;
                if(l==3){
                    value = Months.indexOf(value);
                }else{
                    value = _int(value, 10);
                }
                date.setMonth(value - 1);
            }),
            "d": _createPattern(RegExBuilder.len(), "setDate", -1),
            "H": _createPattern(RegExBuilder.len(), "setHours"),
            "m": _createPattern(RegExBuilder.len(), "setMinutes"),
            "s": _createPattern(RegExBuilder.len(), "setSeconds"),
            "S": _createPattern(RegExBuilder.len(), "setMilliseconds")
        },

        /** The regular expression, used to decode the format */
        _splitterRegex = function () {
            var s = "", v;
            for (v in Patterns) {
                s += v;
            }
            return new RegExp("'.*'|[" + s + "]+", "g");
        }(),

        /** Creates the regex for a format */
        _createParser = function (format) {
            var index = [],
                regex = format.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, function (c) {
                    return _regexEscape(c);
                }).replace(
                    _splitterRegex,
                    function (match /*, offset, string */) {
                        var c = match.charAt(0);
                        index += match;
                        if (!Patterns.hasOwnProperty(c)) {
                            return match;
                        }
                        return(Patterns[c].replace(match));
                    }
                );
            return [ new RegExp(regex), index ];
        },

        /** Cached format-based Regex retrieval */
        _getParser = function (format) {
            if (_cache[format] == null) {
                _cache[format] = _createParser(format);
            }
            return _cache[format];
        },


        _preProcessResult = function (result, index) {

        },

            /** Parse a date with the (_cached) format */
        _parseDate = function (source, format, _cache) {
            var ref = (_cache === false ? _createParser : _getParser)(format),
                regex = ref[0],
                index = ref[1],
                match = source.match(regex),
                i = 1, l = match.length,
                date = new Date(0),
                c, p;
            for (; i < l; i++) {
                format = index[i - 1],
                    c = format.charAt(0);
                if (Patterns.hasOwnProperty(c)) {
                    Patterns[c].val(format, match[i], date);
                }
            }
            return date;
        }

        ;

    /** TEST, DEBUG!!!! */
    //console.log(Patterns);
    //var ds = "22-12-2014 23:59:59.999";
    //console.log(ds, _parseDate(ds, "dd-MM-yyyy HH:mm:ss.SSS"));

    /** The parser declaration */
    return {

        id: "SimpleDateFormat", // "yyyy-mm-dd HH:mm:ss.SSS", ...
        type: "numeric",

        is: function () {
            return false;
        },

        format: function (s, table, cell, cellIndex) {
            var c = table.config,
                ci = c.$headers.filter('[data-column=' + cellIndex + ']:last'),
                format = ci.length && ci[0].dateFormat ||
                    jQuery.tablesorter.getData(ci, c.headers[cellIndex], 'dateFormat') ||
                    c.dateFormat,
                date = _parseDate(s, format).getTime();
            return date ? date || s : s;
        }

    };


}());