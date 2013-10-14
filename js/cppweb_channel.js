/**
* cppw_channel
* Copyright 2013 Petar Korponaić
* All rights reserved.
*/

function CommChannel(channel_address, is_master)
{
    var me = this;

    this.address = channel_address;
    this.isMaster = is_master;
    this.channelId = "";
    this.isOpen = false;


    this.create = function(on_success, on_error, on_timeout) {

        this.channelCommand(
            this.address,
            null,
            this.isMaster,
            "create_channel",
            null,
            function() { me.isOpen = true; if(typeof(on_success) != "undefined" && on_success) on_success(); },
            on_timeout,
            on_error
        );
    };

    this.destroy = function(on_success, on_error, on_timeout) {

        this.channelCommand(
            this.address,
            this.channelId,
            this.isMaster,
            "destroy_channel",
            null,
            function() { me.isOpen = false; if(typeof(on_success) != "undefined" && on_success) on_success(); },
            on_timeout,
            on_error
        );
    };


    this.open = function(channel_id, on_success, on_error, on_timeout) {
        this.channelId = channel_id;

        this.channelCommand(
            this.address,
            this.channelId,
            this.isMaster,
            "open_channel",
            null,
            function() { me.isOpen = true; if(typeof(on_success) != "undefined" && on_success) on_success(); },
            on_timeout,
            on_error
        );
    };

    this.close = function(on_success, on_error, on_timeout) {

        this.channelCommand(
            this.address,
            this.channelId,
            this.isMaster,
            "close_channel",
            null,
            function() { me.isOpen = false; if(typeof(on_success) != "undefined" && on_success) on_success(); },
            on_timeout,
            on_error
        );
    };

    this.send = function(data, on_success, on_error, on_timeout) {
        this.channelCommand(
            this.address,
            this.channelId,
            this.isMaster,
            "send",
            data,
            on_success,
            on_timeout,
            on_error
        );
    }

    this.receive = function(on_success, on_error, on_timeout) {
        this.channelCommand(
            this.address,
            this.channelId,
            this.isMaster,
            "receive",
            null,
            on_success,
            on_timeout,
            on_error
        );
    };

    this.channelCommand = function(channel_address, channel_id, is_master, channel_command, data, onSuccess, onTimeout, onError, commandCallback)
    {
        var request_url = channel_address;
        request_url = addValueToURL(request_url, "channel", channel_id);
        request_url = addValueToURL(request_url, "master", is_master ? "true" : "false");
        request_url = addValueToURL(request_url, "command", channel_command);
        request_url = addValueToURL(request_url, "data", data);

        $.jsonp({
            url: request_url,
            cache: false,
            callbackParameter: "callback",
            success: function(data) {

                if(data.status == "error")
                {
                    if(typeof onError != "undefined" && onError)
                        onError(data.message);
                }
                else
                {
                    if(data.status == "timeout")
                    {
                        if(typeof onTimeout != "undefined" && onTimeout)
                            onTimeout();
                    }
                    else
                    {

                        if(typeof onSuccess != "undefined" && onSuccess)
                            onSuccess(data.data);
                    }
                }
            },

            error: function(x, t, e) {
                if(typeof onError != "undefined" && onError)
                {
                    var msg = t;
                    if(e && e != "") msg = msg + ": " + e;
                    onError(msg);
                }
            }
        });
    }

    return this;
}
