/*!
 * Copyright (c) 2013 Petar Korponaić
 *
 * All rights reserved
 */

function loadDynamic(content_address, dynamic_container)
{
        var request_url = content_address;
        request_url = addValueToURL(request_url, "load_dynamic", "1");
        $.ajax({
		type: "GET",
		url: request_url,
		cache: false,
		dataType: "html",
		success: function(result_data) {
			if(dynamic_container == "body")
				$(dynamic_container).html(result_data);
			else
				$(dynamic_container).replaceWith(result_data);
			makeDynamicContent(dynamic_container);
		}
        });
}

function makeDynamicContent(dynamic_container)
{
	if(dynamic_container == "" || dynamic_container == "body")
		return;

	function resolveURL( url ){
		var a = document.createElement('a');
		a.href=url; // set string url
		url = a.href; // get qualified url
		return url;
	}

	$(dynamic_container).find("a").click(function(e) {

		var target = $(this).attr("target");

		if(typeof target != "undefined" && target != "")
			return true;

		if($(this).hasClass("no_dynamic"))
			return true;

		if($(this).hasClass("disabled"))
			return false;

		var href = $(this).attr("href");

		var script_url = $(location).attr("protocol") + "//" + $(location).attr("host") + $(location).attr("pathname");
		var resolve_url = resolveURL(href);
		if(resolve_url.indexOf(script_url) != 0)
			return true;

		e.preventDefault();

		loadDynamic(href, dynamic_container);
		return false;
	});
}

