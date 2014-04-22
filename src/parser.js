// Create and add the parser to TableSorter
jQuery.tablesorter.addParser(function () {
	
	function getFormat(s, table, cell, cellIndex){
		var c = table.config,
			ci = c.$headers.filter('[data-column=' + cellIndex + ']:last');
		return ci.length && ci[0].dateFormat ||
				jQuery.tablesorter.getData(ci, c.headers[cellIndex], 'dateFormat') ||
				c.dateFormat;
	}
	
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