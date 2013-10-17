/*!
 * Copyright (c) 2013 Petar Korponaić
 *
 * All rights reserved
 */

(function() {
  if (!window.console) {
    window.console = {};
  }

  if(!console)
    console = window.console;

  // union of Chrome, FF, IE, and Safari console methods
  var m = [
    "log", "info", "warn", "error", "debug", "trace", "dir", "group",
    "groupCollapsed", "groupEnd", "time", "timeEnd", "profile", "profileEnd",
    "dirxml", "assert", "count", "markTimeline", "timeStamp", "clear"
  ];
  // define undefined methods as noops to prevent errors
  for (var i = 0; i < m.length; i++) {
    if (!window.console[m[i]]) {
      window.console[m[i]] = function() {};
    }
  }
})();

function addValueToURL(url, name, value)
{
	if(typeof(url) == "undefined") return "";


	if(typeof(name) != "undefined" && name && name != "")
	{
		if(typeof(value) != "undefined" && value)
			url = url + (url.indexOf("?") != -1 ? "&" : "?") + encodeURIComponent(name) + "=" + encodeURIComponent(value);
	}

	return url;
}

function locationParam(sVar)
{
  return decodeURI(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURI(sVar).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}

function randomString (strLength, charSet)
{
    var result = [];

    strLength = strLength || 5;
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    while (strLength--) {
        result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
    }

    return result.join('');
}
