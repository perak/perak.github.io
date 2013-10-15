/**
* Video Call plugin using WebRTC
* Copyright 2013 Petar Korponaić
* All rights reserved.
*/

VideoCall = function(options)
{
    var me = this;

    // properties
    this.localVideoStream = null;
    this.remoteVideoStream = null;
    this.isMaster = true;
    this.isActive = false;

    // events
    this.onLocalVideoStarted = null;
    this.onLocalVideoError = null;
    this.onLocalVideoStopped = null;

    this.onRemoteVideoStarted = null;
    this.onRemoteVideoStopped = null;


    this.onSendMessage = null;

    this.onLocalHangup = null;
    this.onRemoteHangup = null;

    this.onUnsupportedBrowser = null;

    var localPeerConnection = null;
    var offerReceived = false;
    var messageQueue = [];



    // methods
    this.startLocalVideo = function()
    {
        if(RTCPeerConnection == null || getUserMedia == null)
        {
            if(typeof(onUnsupportedBrowser) != "undefined" && onUnsupportedBrowser)
                onUnsupportedBrowser();
            return;
        }

        getUserMedia({audio: true, video: true}, function(stream) { me.localVideoStream = stream; if(typeof(onLocalVideoStarted) != "undefined" && onLocalVideoStarted) onLocalVideoStarted(); } , onLocalVideoError);
    }

    this.stopLocalVideo = function()
    {
        if(me.localVideoStream)
        {
            me.localVideoStream.stop();
            me.localVideoStream = null;
        }

        if(typeof(onLocalVideoStopped) != "undefined" && onLocalVideoStopped)
            onLocalVideoStopped();
    }

    this.waitCall = function()
    {
        me.isMaster = true;
        me.isActive = true;
        offerReceived = false;
        messageQueue = [];

        createPeerConnection();
    }

    this.initCall = function()
    {
        me.isMaster = false;
        me.isActive = true;
        offerReceived = false;
        messageQueue = [];

        createPeerConnection();
        var constraints = mergeConstraints(options.offerConstraints, options.sdpConstraints);
        localPeerConnection.createOffer(setLocalAndSendMessage, onCreateOfferError, constraints);
    }

    this.hangupCall = function()
    {
        hangup();
        sendMessage({ type: "bye" });

        if(typeof(onLocalHangup) != "undefined" && onLocalHangup) onLocalHangup();
    }

    this.processSignalingMessage = function(msg)
    {
        if(msg.type === "offer")
        {
            setRemoteDescription(msg);
            createAnswer();

            offerReceived = true;
            // process queue
            while(messageQueue.length > 0) {
                me.processSignalingMessage(messageQueue.shift());
            }

        }

        if(msg.type === "answer")
            setRemoteDescription(msg);

        if(msg.type === "candidate")
        {
            if(offerReceived)
            {
                var candidate = new RTCIceCandidate({sdpMLineIndex: msg.label, candidate: msg.candidate});
                localPeerConnection.addIceCandidate(candidate);
            }
            else
                messageQueue.push(msg);
        }

        if(msg.type === "bye")
        {
            hangup();
            if(typeof(onRemoteHangup) != "undefined" && onRemoteHangup) onRemoteHangup();
        }
    }

    this.messageReceived = function(message)
    {
        var msg = JSON.parse(message);
        me.processSignalingMessage(msg);
    }

    function createPeerConnection() {
        // create peer connection
        localPeerConnection = new RTCPeerConnection(options.pcConfig, options.pcConstraints);

        localPeerConnection.onicecandidate = gotLocalIceCandidate;
        localPeerConnection.onaddstream = gotRemoteStream;

        localPeerConnection.addStream(me.localVideoStream);
    }

    function gotLocalIceCandidate(event) {

        if (event.candidate) {
            sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        }
    }

    function gotRemoteStream(event)
    {
        me.remoteVideoStream = event.stream;
        if(typeof(onRemoteVideoStarted) != "undefined" && onRemoteVideoStarted) onRemoteVideoStarted();
    }

    function setRemoteDescription(msg)
    {
        if(options.stereo)
            msg.sdp = addstereo(msg.sdp);
        msg.sdp = maybePreferAudioSendCodec(msg.sdp);
        localPeerConnection.setRemoteDescription(new RTCSessionDescription(msg), onSetRemoteDescriptionSuccess, onSetRemoteDescriptionError);
    }

    function onSetRemoteDescriptionSuccess()
    {
//console.log("onSetRemoteDescriptionSuccess");
    }

    function onSetRemoteDescriptionError(message)
    {
console.log("onSetRemoteDescriptionError");
    }

    function onCreateOfferError(message)
    {
console.log("onCreateOfferError");
    }

    function createAnswer()
    {
        localPeerConnection.createAnswer(setLocalAndSendMessage, onCreateAnswerError, options.sdpConstraints);
    }

    function onCreateAnswerError(message)
    {
console.log("onCreateAnswerError");
    }

    function setLocalAndSendMessage(description)
    {
        description.sdp = maybePreferAudioReceiveCodec(description.sdp);
        localPeerConnection.setLocalDescription(description);
        sendMessage(description);
    }

    function sendMessage(message)
    {
        var msgString = JSON.stringify(message);
        if(typeof(onSendMessage) != "undefined" && onSendMessage)
            onSendMessage(msgString);
    }

    function hangup()
    {
        me.isActive = false;

        if(typeof(remoteVideoStream) != "undefined" && remoteVideoStream)
        {
            remoteVideoStream.stop();
            remoteVideoStream = null;
        }

        if(typeof(onRemoteVideoStopped) != "undefined" && onRemoteVideoStopped)
            onRemoteVideoStopped();

        if(localPeerConnection)
        {
            localPeerConnection.close();
            localPeerConnection = null;
        }

        offerReceived = false;
    }

/////////////////

    function mergeConstraints(cons1, cons2) {
        var merged = cons1;
        for (var name in cons2.mandatory) {
            merged.mandatory[name] = cons2.mandatory[name];
        }
        merged.optional.concat(cons2.optional);
        return merged;
    }


	function maybePreferAudioSendCodec(sdp) {
	  if (options.audio_send_codec == '') {
	    return sdp;
	  }
	  return preferAudioCodec(sdp, options.audio_send_codec);
	}

	function maybePreferAudioReceiveCodec(sdp) {
	  if (options.audio_receive_codec == '') {
	    return sdp;
	  }
	  return preferAudioCodec(sdp, options.audio_receive_codec);
	}

	// Set |codec| as the default audio codec if it's present.
	// The format of |codec| is 'NAME/RATE', e.g. 'opus/48000'.
	function preferAudioCodec(sdp, codec) {
	  var fields = codec.split('/');
	  if (fields.length != 2) {
	    return sdp;
	  }
	  var name = fields[0];
	  var rate = fields[1];
	  var sdpLines = sdp.split('\r\n');

	  // Search for m line.
	  for (var i = 0; i < sdpLines.length; i++) {
	      if (sdpLines[i].search('m=audio') !== -1) {
		var mLineIndex = i;
		break;
	      }
	  }
	  if (mLineIndex === null)
	    return sdp;

	  // If the codec is available, set it as the default in m line.
	  for (var i = 0; i < sdpLines.length; i++) {
	    if (sdpLines[i].search(name + '/' + rate) !== -1) {
	      var regexp = new RegExp(':(\\d+) ' + name + '\\/' + rate, 'i');
	      var payload = extractSdp(sdpLines[i], regexp);
	      if (payload)
		sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
		                                       payload);
	      break;
	    }
	  }

	  // Remove CN in m line and sdp.
	  sdpLines = removeCN(sdpLines, mLineIndex);

	  sdp = sdpLines.join('\r\n');
	  return sdp;
	}


	// Set Opus in stereo if stereo is enabled.
	function addstereo(sdp) {
	  var sdpLines = sdp.split('\r\n');

	  // Find opus payload.
	  for (var i = 0; i < sdpLines.length; i++) {
	    if (sdpLines[i].search('opus/48000') !== -1) {
	      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
	      break;
	    }
	  }

	  // Find the payload in fmtp line.
	  for (var i = 0; i < sdpLines.length; i++) {
	    if (sdpLines[i].search('a=fmtp') !== -1) {
	      var payload = extractSdp(sdpLines[i], /a=fmtp:(\d+)/ );
	      if (payload === opusPayload) {
		var fmtpLineIndex = i;
		break;
	      }
	    }
	  }
	  // No fmtp line found.
	  if (fmtpLineIndex === null)
	    return sdp;

	  // Append stereo=1 to fmtp line.
	  sdpLines[fmtpLineIndex] = sdpLines[fmtpLineIndex].concat(' stereo=1');

	  sdp = sdpLines.join('\r\n');
	  return sdp;
	}

	function extractSdp(sdpLine, pattern) {
	  var result = sdpLine.match(pattern);
	  return (result && result.length == 2)? result[1]: null;
	}

	function setDefaultCodec(mLine, payload) {
	  var elements = mLine.split(' ');
	  var newLine = new Array();
	  var index = 0;
	  for (var i = 0; i < elements.length; i++) {
	    if (index === 3) // Format of media starts from the fourth.
	      newLine[index++] = payload; // Put target payload to the first.
	    if (elements[i] !== payload)
	      newLine[index++] = elements[i];
	  }
	  return newLine.join(' ');
	}

	// Strip CN from sdp before CN constraints is ready.
	function removeCN(sdpLines, mLineIndex) {
	  var mLineElements = sdpLines[mLineIndex].split(' ');
	  // Scan from end for the convenience of removing an item.
	  for (var i = sdpLines.length-1; i >= 0; i--) {
	    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
	    if (payload) {
	      var cnPos = mLineElements.indexOf(payload);
	      if (cnPos !== -1) {
		// Remove CN payload from m line.
		mLineElements.splice(cnPos, 1);
	      }
	      // Remove CN line in sdp
	      sdpLines.splice(i, 1);
	    }
	  }

	  sdpLines[mLineIndex] = mLineElements.join(' ');
	  return sdpLines;
	}


}

