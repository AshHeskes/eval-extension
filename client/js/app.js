window.addEventListener('DOMContentLoaded', function(){
(function(){

	var global = this;

	// Taken from MDN https://developer.mozilla.org/en-US/docs/DOM/window.btoa
	// utf8 to Base64 encoder.
	function utf8_to_b64( str ) {
		return window.btoa(unescape(encodeURIComponent( str )));
	}
	// Base64 to utf8 decoder.
	function b64_to_utf8( str ) {
		return decodeURIComponent(escape(window.atob( str )));
	}

	// String reversal
	String.prototype.reverse = function(){ return this.split('').reverse().join(''); };

	// make the first radio button the default method of eval.
	var evalMethod = document.querySelector('input[type="radio"]').id;

	for ( var i = 0, els; i < (els = document.querySelectorAll('input[type="radio"]')).length; i++) {
		els[i].addEventListener('click', function(e){
			if (e.currentTarget.checked) evalMethod = e.currentTarget.id;
		});
	}

	// listen to change events on the textarea and fire the selected `eval` `method`.
	document.getElementById('code-input').addEventListener('input', function(e){
		var code = e.currentTarget.value;
		methods[evalMethod](code);
	});

	// Keep a reference to the error container.
	var errCont = document.getElementById('error-cont');

	// Handle displaying of the error.
	function errorHandler(err){
		errCont.innerText = err.message;
		console.log(err);
		errCont.style.opacity = 1;
	}

	// Fade the error element out after it has been displayed.
	errCont.addEventListener('webkitTransitionEnd', function(){
		setTimeout(function(){
			errCont.style.opacity = 0;
		},1000);
	});

	function base64ScriptEval(code){
		var script = document.createElement('script'),
			wrapper = '(function(){ try{ @@ }catch(err){ errorHandler(err); } })()',
			dataURI;
		// Make sure the string has a trailing semicolon.
		code = code.reverse().replace(/[\s\;]+/, ';').reverse();
		dataURI = 'data:application/javascript;base64,' + utf8_to_b64(wrapper.replace('@@', code));
		script.setAttribute('src', dataURI);
		document.body.appendChild(script);
		setTimeout(function(){
			document.body.removeChild(script);
		},100);
	}

	// Keep a reference to the current iframe so we can remove it, once the eval has finished.
	var currFrame = null;

	function iframeEval(code){
		var frame = document.createElement('iframe'),
			handler = 'window.addEventListener("message",' + iframeInnerHandler.toString() + ')',
			content = '<html><head><script>' + handler + '</script></head><body></body></html>',
			dataURI = 'data:text/html;base64,' + utf8_to_b64(content),
			timer;

		frame.setAttribute('src', dataURI);
		document.body.appendChild(frame);
		timer = setInterval(function(){
			if ( currFrame === frame ) return;
			clearInterval(timer);
			frame.contentWindow.postMessage(code,'*');
			currFrame = frame;
		},0);
	}

	// This will never get called, it's just nicer to write and call `toString()` on.
	function iframeInnerHandler(message){
		try {
			eval(message.data);
		}
		catch(err){
			return message.source.postMessage({ message: err.message }, message.origin);
		}
		message.source.postMessage({ success: true }, message.origin);
	}

	// listen to events coming from iframes.
	window.addEventListener('message', function(message){
		if ( message.data.success ) {
			document.body.removeChild(currFrame);
			currFrame = null;
		}
		else {
			errorHandler(message.data);
			document.body.removeChild(currFrame);
			currFrame = null;
		}
	});

	var methods = {
		base64ScriptEval: base64ScriptEval,
		iframeEval: iframeEval
	};

})();
});