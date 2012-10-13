/******************************************************************************
*
* -- jsTouch   - is a small and clean utility to write nice applications
*                for touch devices (iPhone, iPad, iPod Touch, Android, etc.)
* -- License   - Dual licenses MIT and GPL
* -- Developer - vitmalina@gmail.com
*
* -- UPDATES:
*				2012-09-01 toddwprice ~line 396: updated animate function to check if script tag type === "text/javascript" so templates stored in script tags as "text/template" aren't reloaded as scripts
*/

var jsTouch = {

	init: function(name, params) {
		var tmpTouch = new jsTouchBox(name, params);
		if (params && typeof(params) == 'object' && params['page']) tmpTouch.loadPage(params['page']);
		return tmpTouch;
	},
	
	loadPage: function(url, params, callBack) {
		if (window.event) { var currObj = this.getCurrentBox(window.event.target); }
		// if target is defined - open there
		if (params && typeof(params) == 'object' && params['target']) {
			window.elements[params['target']].loadPage(url, params, callBack);
		} else {
			currObj.loadPage(url, params, callBack);
		}
	},
	
	loadContent: function(url, params, callBack) {
		if (window.event) { var currObj = this.getCurrentBox(window.event.target); }
		// if target is defined - open there
		if (params && typeof(params) == 'object' && params['target']) {
			window.elements[params['target']].loadContent(url, params, callBack);
		} else {
			if (currObj) {
				currObj.loadContent(url, params, callBack); 
			} else {
				// no current object -> loading into last current
				this.lastCurrObj.loadContent(url, params, callBack); 
			}
		}
	},
	
	overlayHTML: function(HTML, params, callBack) {
		// parse parameters
		var left		= null;
		var top			= null;
		var width  		= 300;
		var height 		= 300;
		var modal 		= false;
		var opacity 	= 0.3;		
		var bgcolor		= 'black';
		if (typeof(params) == 'object') {
			if (String(params['left']) 		!= 'undefined') left		= parseInt(params['left']);
			if (String(params['top']) 		!= 'undefined') top			= parseInt(params['top']);
			if (String(params['width']) 	!= 'undefined') width		= parseInt(params['width']);
			if (String(params['height']) 	!= 'undefined') height		= parseInt(params['height']);
			if (String(params['modal']) 	!= 'undefined') modal 		= params['modal'];
			if (String(params['opacity']) 	!= 'undefined') opacity		= params['opacity'];
			if (String(params['bgcolor']) 	!= 'undefined') bgcolor		= params['bgcolor'];
		}
		if (width  > window.innerWidth -10) width  = window.innerWidth - 10; 
		if (height > window.innerHeight-10) height = window.innerHeight- 10;
		// lock secreen
		var lock = document.createElement('div');
		lock.id = 'overlay_lock';
		lock.style.cssText = 'z-Index: 9; background-color: '+ bgcolor +'; opacity: 0; '+
			'position: absolute; left: '+ parseInt(document.body.scrollLeft) +'px; top: '+ parseInt(document.body.scrollTop) +'px; '+
			'-webkit-tap-highlight-color: rgba(0,0,0,0); -webkit-transition: all .4s ease-in-out; '+
			'width: '+ window.innerWidth +'px; height: '+ window.innerHeight +'px;';
		if (!modal) {
			lock.onclick = function (e) { jsTouch.overlayClose(); };
		} else {
			// if modal flash red background
			lock.ontouchstart = function (e) { $('#overlay_lock')[0].style.cssText += '-webkit-transition: none; background-color: white;'; };
			lock.ontouchend   = function (e) { $('#overlay_lock')[0].style.cssText += '-webkit-transition: all .4s ease-in-out; background-color: black;'; };
		}
		$(document.body).append(lock);	
		setTimeout("$('#overlay_lock').css('opacity', '"+ opacity +"');", 1); // otherwise transition is not working
		
		window.onscroll = function () {
			var winTop 	= parseInt(document.body.scrollTop) + (parseInt(window.innerHeight) - height) / 2;
			var winLeft = parseInt(document.body.scrollLeft) + (parseInt(window.innerWidth) - width) / 2;
			$('#overlay_lock')[0].style.cssText += 'top: '+ parseInt(document.body.scrollTop)+'px; left: '+ parseInt(document.body.scrollLeft)+'px;'+
				'width: '+ parseInt(window.innerWidth) +'px; height: '+ parseInt(window.innerHeight) +'px';  
			$('#overlay_box').css('top', winTop+'px');
			$('#overlay_box').css('left', winLeft+'px');
		}
		window.onresize = function () { window.onscroll(); }
		
		// create overlay
		var div = document.createElement('div');
		var winTop 	= parseInt(document.body.scrollTop) + (parseInt(window.innerHeight) - height) / 2;
		var winLeft = parseInt(document.body.scrollLeft) + (parseInt(window.innerWidth) - width) / 2;
		div.id = 'overlay_box';
		div.className = 'overlay';
		div.style.cssText += 'left: '+ winLeft +'px; top: '+ winTop +'px; width: '+ width +'px; height: '+ height +'px; -webkit-border-radius: 5px; '+
			'-webkit-transition: all .4s ease-in-out; opacity: 0;';
		div.innerHTML = HTML;
		$(document.body).append(div);			
		setTimeout("$('#overlay_box').css('opacity', '1');", 1); // otherwise transition is not working
		// add clicked class when clicked on the link
		$('#overlay_box a').click(new Function(
			"$('#overlay_box a').removeClass('clicked');"+
			"$(this).addClass('clicked');"));
	},
	
	overlayPage: function(url, params, callBack) {
		// create HTML overlay
		this.overlayHTML('<div class="content"></div>', params, callBack);
		// load overlay content
		$.get(url, {}, function (data) {
			$('#overlay_box').html(data);
			// isert another DIV (needed for iScroll)
			var tmp = $('.content', $('#overlay_box'))[0];
			if (tmp) tmp.innerHTML = '<div>' + tmp.innerHTML + '</div>';
			
			// check presens of footer and toolbar
			var isToolbar = ($('div.overlay div.toolbar').length > 0 ? true : false);
			var isFooter  = ($('div.overlay div.footer').length > 0 ? true : false);		
			if (isToolbar) $('div.overlay div.content').css('top', '45px');
			if (isFooter) $('div.overlay div.content').css('bottom', '60px');
			// init scroll
			if (jsTouch.overlay_scroll) { jsTouch.overlay_scroll.destroy(); jsTouch.overlay_scroll.scroll = null; }
			jsTouch.overlay_scroll = new iScroll($('div.overlay div.content')[0], { desktopCompatibility: true, zoom: false });
			// for buttons on top do it on touch start
			$('#overlay_box a.button').bind('touchstart', new Function(
				"$('#overlay_box a').removeClass('clicked');"+
				"$(this).addClass('clicked');"));
			// add clicked class when clicked on the link
			$('#overlay_box a').click(new Function(
				"$('#overlay_box a').removeClass('clicked');"+
				"$(this).addClass('clicked');"));
		});		
	},
	
	overlayClose: function() {
		$('#overlay_box').remove();
		$('#overlay_lock')[0].style.opacity = 0;
		setTimeout("$('#overlay_lock').remove();", 400);
	},
	
	resize: function() {
		for (el in window.elements) {
			window.elements[el].resize();
		}
	},
	
	getCurrentBox: function(el) {
		var currObj = null;
		var tmp 	= el;
		while (tmp && tmp.tagName != 'BODY') {
			if (tmp.tagName == 'DIV' && window.elements[tmp.id]) {
				currObj = window.elements[tmp.id];
				break;
			}
			tmp = tmp.parentNode;
		}
		if (currObj != null) this.lastCurrObj = currObj; // remember last real current
		return currObj;
	}
}

function jsTouchBox(name, params) {
	// -- variables
	this.name		 = name;	// - unique name for the element
	this.width		 = ''; 	    // - if empty - then full screen
	this.height		 = ''; 	    // - if empty - then full screen	
	// -- init function
	this.loadPage	 = jsTouch_loadPage;
	this.loadContent = jsTouch_loadContent;
	this.animate	 = jsTouch_animate;
	this.initScroll	 = jsTouch_initScroll;
	this.initTabs	 = jsTouch_initTabs;
	this.initLinks	 = jsTouch_initLinks;
	this.resize		 = jsTouch_resize;	
	// -- swipes
	this.onSwipeLeft = null;	// should be objects
	this.onSwipeRight= null;
	// -- internal variables
	this._tmpCallBack;
	this._tmpTimer;
	this._lastDiv;
		
	function jsTouch_loadPage(url, params, callBack) {
		// -- save some temp variables		
		this._tmpCallBack	= callBack;
		// -- get the page
		this._tmpTimer = window.setTimeout(new Function("$('#"+ this.name +"').append('<div class=\"progress\">Loading...</div>')"), 200);		
		$.get(url, {}, new Function("data", 
			"$('#"+ this.name +" > .progress').remove(); "+
			"var obj = window.elements['"+ ((typeof(params) == 'object' && params['target']) ? params['target'] : this.name) +"']; "+ 
			"if (obj && typeof(obj) == 'object') { "+
			"	clearTimeout(obj._tmpTimer); "+
			"	obj.animate(data, '"+ ((typeof(params) == 'object' && params['transition']) ? params['transition'] : "") +"'); "+
			"	obj.initTabs();"+
			"	obj.initLinks();"+
			"	if (obj._tmpCallBack && obj._tmpCallBack == 'function') { obj._tmpCallBack(); } "+
			"}")
		);
	}
	
	function jsTouch_loadContent(url, params, callBack) {
		// -- save some temp variables		
		this._tmpCallBack	= callBack;
		// -- get the page
		this._tmpTimer = window.setTimeout(new Function("$('#"+ this.name +"').append('<div class=\"progress\">Loading...</div>')"), 200);		
		$.get(url, {}, new Function("data", 
			"$('#"+ this.name +" > .progress').remove();"+
			"var obj = window.elements['"+ ((typeof(params) == 'object' && params['target']) ? params['target'] : this.name) +"']; "+ 
			"if (obj && typeof(obj) == 'object') { "+
			"	clearTimeout(obj._tmpTimer); "+
			"	if (obj._lastDiv) {"+
			"		$('#"+ this.name +" > .jsTouch.div1 > div.content').html('<div>'+ data +'</div>');"+
			"	} else { "+
			"		$('#"+ this.name +" > .jsTouch.div2 > div.content').html('<div>'+ data +'</div>');"+
			"	}"+
			"	obj.initLinks();"+
			"	obj.initScroll();"+
			"	if (obj._tmpCallBack && obj._tmpCallBack == 'function') { obj._tmpCallBack(); } "+
			"}")
		);
	}
	
	function jsTouch_animate(HTML, transition) {
		// get width and height of the div
		var width  = this.width;
		var height = this.height;
		if (width == '')  width  = window.innerWidth;
		if (height == '') height = window.innerHeight;
		if (parseInt(width) < 0)  width = window.innerWidth + width;
		if (parseInt(height) < 0) height = window.innerHeight + height;
		// find two divs
		if (this._lastDiv) {
			var div_old = $('#'+ this.name +' > .jsTouch.div1')[0];
			var div_new = $('#'+ this.name +' > .jsTouch.div2')[0];
			this._lastDiv = false;
		} else {
			var div_old = $('#'+ this.name +' > .jsTouch.div2')[0];
			var div_new = $('#'+ this.name +' > .jsTouch.div1')[0];
			this._lastDiv = true;
		}
		$('#'+this.name)[0].style.cssText += '-webkit-perspective: 700px; overflow: hidden;';
		
		var comcss = ' width: '+ width +'px; height: '+ height +'px; overflow: hidden;';
		div_old.style.cssText = 'position: absolute; z-index: 0; -webkit-backface-visibility: hidden;';
		div_new.style.cssText = 'position: absolute; z-index: 1; -webkit-backface-visibility: hidden;';
		
		switch (transition) {
			case 'slide-left':
				// init divs
				div_old.style.cssText += comcss +'-webkit-transform: translate3d(0, 0, 0);';
				div_new.style.cssText += comcss +'-webkit-transform: translate3d('+ width +'px, 0, 0);';
				div_new.innerHTML = HTML;
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += '-webkit-transition: .5s; -webkit-transform: translate3d(0px, 0, 0);';
					div_old.style.cssText += '-webkit-transition: .5s; -webkit-transform: translate3d(-'+ width +'px, 0, 0);';
				}, 1);
				break;
				
			case 'slide-right':
				// init divs
				div_old.style.cssText += comcss +'-webkit-transform: translate3d(0, 0, 0);';
				div_new.style.cssText += comcss +'-webkit-transform: translate3d(-'+ width +'px, 0, 0);';
				div_new.innerHTML = HTML;
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += '-webkit-transition: .5s; -webkit-transform: translate3d(0px, 0, 0);';
					div_old.style.cssText += '-webkit-transition: .5s; -webkit-transform: translate3d('+ width +'px, 0, 0);';
				}, 1);
				break;
							
			case 'slide-down':
				// init divs
				div_old.style.cssText += comcss +'z-index: 1; -webkit-transform: translate3d(0, 0, 0);';
				div_new.style.cssText += comcss +'z-index: 0; -webkit-transform: translate3d(0, 0, 0);';
				div_new.innerHTML = HTML;
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += '-webkit-transition: .5s; -webkit-transform: translate3d(0, 0, 0);';
					div_old.style.cssText += '-webkit-transition: .5s; -webkit-transform: translate3d(0, '+ height +'px, 0);';
				}, 1);
				break;
			
			case 'slide-up':
				// init divs
				div_old.style.cssText += comcss +'-webkit-transform: translate3d(0, 0, 0);';
				div_new.style.cssText += comcss +'-webkit-transform: translate3d(0, '+ height +'px, 0);';
				div_new.innerHTML = HTML;
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += '-webkit-transition: .5s; -webkit-transform: translate3d(0, 0, 0);';
					div_old.style.cssText += '-webkit-transition: .5s; -webkit-transform: translate3d(0, 0, 0);';
				}, 1);
				break;
				
			case 'flip-left':
				// init divs
				div_old.style.cssText += comcss +'-webkit-transform: rotateY(0deg);';
				div_new.style.cssText += comcss +'-webkit-transform: rotateY(-180deg);';
				div_new.innerHTML = HTML;
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += '-webkit-transition: .5s; -webkit-transform: rotateY(0deg);';
					div_old.style.cssText += '-webkit-transition: .5s; -webkit-transform: rotateY(180deg);';
				}, 1);
				break;
				
			case 'flip-right':
				// init divs
				div_old.style.cssText += comcss +'-webkit-transform: rotateY(0deg);';
				div_new.style.cssText += comcss +'-webkit-transform: rotateY(180deg);';
				div_new.innerHTML = HTML;
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += '-webkit-transition: .5s; -webkit-transform: rotateY(0deg);';
					div_old.style.cssText += '-webkit-transition: .5s; -webkit-transform: rotateY(-180deg);';
				}, 1);
				break;
				
			case 'flip-top':
				// init divs
				div_old.style.cssText += comcss +'-webkit-transform: rotateX(0deg);';
				div_new.style.cssText += comcss +'-webkit-transform: rotateX(180deg);';
				div_new.innerHTML = HTML;
				// isert another DIV (needed for iScroll)
				var tmp = $('.content', div_new)[0];
				if (tmp) tmp.innerHTML = '<div>' + tmp.innerHTML + '</div>';
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += '-webkit-transition: .5s; -webkit-transform: rotateX(0deg);';
					div_old.style.cssText += '-webkit-transition: .5s; -webkit-transform: rotateX(-180deg);';
				}, 1);
				break;
				
			case 'flip-bottom':
				// init divs
				div_old.style.cssText += comcss +'-webkit-transform: rotateX(0deg);';
				div_new.style.cssText += comcss +'-webkit-transform: rotateX(-180deg);';
				div_new.innerHTML = HTML;
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += '-webkit-transition: .5s; -webkit-transform: rotateX(0deg);';
					div_old.style.cssText += '-webkit-transition: .5s; -webkit-transform: rotateX(180deg);';
				}, 1);
				break;
				
			case 'pop-in':
				// init divs
				div_old.style.cssText += comcss +'-webkit-transform: translate3d(0, 0, 0);';
				div_new.style.cssText += comcss +'-webkit-transform: translate3d(0, 0, 0); -webkit-transform: scale(.8); opacity: 0;';
				div_new.innerHTML = HTML;
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += '-webkit-transition: .5s; -webkit-transform: scale(1); opacity: 1;';
					div_old.style.cssText += '-webkit-transition: .5s;';
				}, 1);
				break;
				
			case 'pop-out':
				// init divs
				div_old.style.cssText += comcss +'-webkit-transform: translate3d(0, 0, 0); -webkit-transform: scale(1); opacity: 1;';
				div_new.style.cssText += comcss +'-webkit-transform: translate3d(0, 0, 0); opacity: 0;';
				div_new.innerHTML = HTML;
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += '-webkit-transition: .5s; opacity: 1;';
					div_old.style.cssText += '-webkit-transition: .5s; -webkit-transform: scale(1.7); opacity: 0;';
				}, 1);
				break;
				
			default:
				// init divs
				div_old.style.cssText += comcss +'-webkit-transform: translate3d(0, 0, 0); opacity: 1;';
				div_new.style.cssText += comcss +'-webkit-transform: translate3d(0, 0, 0); opacity: 0;';
				div_new.innerHTML = HTML;
				// -- need a timing function because otherwise not working
				window.setTimeout(function() {
					div_new.style.cssText += '-webkit-transition: .5s; opacity: 1;';
					div_old.style.cssText += '-webkit-transition: .5s; opacity: 1;';
				}, 1);
				break;
		}
		// isert another DIV (needed for iScroll)
		var tmp = $('.content', div_new)[0];
		if (tmp) tmp.innerHTML = '<div>' + tmp.innerHTML + '</div>';
		// insert <span> for back and forward buttons
		var tmp = $('.toolbar .button.back', div_new)[0];
		if (tmp) tmp.innerHTML = '<span class="s1"></span><span class="s2"></span>' + tmp.innerHTML;		
		var tmp = $('.toolbar .button.next', div_new)[0];
		if (tmp) tmp.innerHTML = '<span class="s1"></span><span class="s2"></span>' + tmp.innerHTML;		
		// execute scripts
		var d =	div_new.getElementsByTagName("script");
		var t = d.length;
		for (var x = 0; x < t; x++)
		{
			if (d[x].type === "text/javascript")
			{
				var ns = document.createElement('script');
				ns.type = "text/javascript";
				if (d[x].text != '') ns.text = d[x].text;
				if (d[x].src != '') ns.src = d[x].src;
				div_new.appendChild(ns);
			}
		}				
		// -------
		this.resize();
		this.initScroll();
		//setTimeout("window.elements['"+ this.name +"'].initScroll();", 600); // if init scroll right away, then it slides upwards
	}
	
	function jsTouch_initScroll() {
		var obj = this;
		// make sure iScroll library is loaded
		if (String(window.iScroll) == 'undefined') {
			alert('You need to include iScroll.js library');
			return;
		}
		// make divs scrollable
		if (this._lastDiv) {
			var div = $('#'+ this.name +' > .jsTouch.div1 > div.content')[0];
		} else {
			var div = $('#'+ this.name +' > .jsTouch.div2 > div.content')[0];
		}
		// init scroll		

		if ( typeof $(div).data('scroll') == 'object' ) {
			this.scroll = $(div).data('scroll');
			setTimeout(function () { window.elements[obj.name].scroll.refresh(); }, 100);
		} else {
			this.scroll = new iScroll(div, { desktopCompatibility: true, zoom: false });
			$(div).data('scroll', this.scroll);
			setTimeout(function () { window.elements[obj.name].scroll.refresh(); }, 100);
		}

		// if there is a swipe elemenet
		if ($(div).find('.swipe').length > 0) {
			if ($(div).find('div #_tmp_swipe').length == 0) {
				$(div).find('.swipe').width($(div).width());
				$(div).find('div').append('<div id="_tmp_swipe" style="height: '+ $(div).find('.swipe.current').height() + 'px;"></div>');
			}
			// show current of first
			if ($(div).find('.swipe.current').length == 0) {
				$($(div).find('.swipe')[0]).addClass('current');
			}
			// hide all
			$(div).find('.swipe').not('.swipe.current').hide();
			$(div).find('.swipe.current').show();
			// insert sizing element
			$(div).find('div #_tmp_swipe').height(1);
			$(div).find('div #_tmp_swipe').height($(div).find('.swipe.current').height());
			//$(div).find('div #_tmp_swipe').remove();
			//$(div).find('div').append('<div id="_tmp_swipe" style="height: '+ $(div).find('.swipe.current').height() + 'px;"></div>');

			// init swipe events
			var obj 	= this;
			var currX   = null, 
				currY   = null, 
				divX 	= null,
				divY 	= null,
				timer 	= null,
				status  = null;
			var curr = $(div).find('.swipe.current');
			var prev = $(div).find('.swipe.current').prev('.swipe');
			var next = $(div).find('.swipe.current').next('.swipe');

			$(div)[0].ontouchstart  = function (e) { 
				timer = (new Date()).getTime();
			}

			$(div)[0].ontouchend  = function (e) { 
				var span = (new Date()).getTime() - timer;
				currX 	= null; 
				currY 	= null; 
				if (status == 'swipe-left' && $(next).length > 0 && ((divX < -20 && span < 200) || (divX < -60))) { // swipe left
					divX 	= null;
					status	= null;
					$(curr).css({
						'-webkit-transition' 	: 'all .2s ease-in-out', 
						'-webkit-transform' 	: 'translate3d(-'+ parseInt($(div).width()) +'px, 0px, 0px)'
					});
					$(next).css({
						'-webkit-transition' 	: 'all .2s ease-in-out', 
						'-webkit-transform' 	: 'translate3d(-'+ parseInt($(div).width()) +'px, 0px, 0px)'
					});
					setTimeout(function () {
						$(curr).removeClass('current');
						$(next).addClass('current');
						// init scroll
						obj.scroll.scrollTo(0,0);
						obj.initScroll();
					}, 250);
					return;
				}
				if (status == 'swipe-right' && $(prev).length > 0 && ((divX > 20 && span < 200) || (divX > 60))) { // swipe right
					divY = null;
					status	= null;
					$(curr).css({
						'-webkit-transition' 	: 'all .2s ease-in-out', 
						'-webkit-transform' 	: 'translate3d('+ parseInt($(div).width()) +'px, 0px, 0px)'
					});
					$(prev).css({
						'-webkit-transition' 	: 'all .2s ease-in-out', 
						'-webkit-transform' 	: 'translate3d('+ parseInt($(div).width()) +'px, 0px, 0px)'
					});
					setTimeout(function () {
						$(curr).removeClass('current');
						$(prev).addClass('current');
						// init scroll
						obj.scroll.scrollTo(0,0);
						obj.initScroll();
					}, 250);
					return;
				}
				// return to previous spots
				divX	= null;
				divY	= null;
				status	= null;
				$(curr).add(next).add(prev).css({ 
					'-webkit-transition' : 'all .2s ease-in-out',
					'-webkit-transform' : 'translate3d(0px, 0px, 0px)'
				});
			}

			$(div)[0].ontouchmove = function (e) {
			 	var touch = e.touches[0];
			 	if (currX == null) { currX = touch.pageX; }
			 	if (currY == null) { currY = touch.pageY; }
			 	divX = touch.pageX - currX;
			 	divY = touch.pageY - currY;

			 	if (Math.abs(divY) > 10 && status == null) status = 'none';
			 	if (status == 'none') return;
			 	if (divX > 10) status = 'swipe-right';
			 	if (divX <-10) status = 'swipe-left';

			 	if (status != null) {
					processSwipe(divX);
					e.stopPropagation();
					e.preventDefault();
				}
			};

			function processSwipe(divX) {
				var factor = 1;
				if (divX > 0 && prev.length == 0) factor = 3;
				if (divX < 0 && next.length == 0) factor = 3;
				// current
				$(curr).css({ 
					'left' 	: '0px',
					'top' 	: '0px',
					'-webkit-transition' 	: 'none', 
					'-webkit-transform' 	: 'translate3d('+ (divX/factor) +'px, 0px, 0px)'
				});
				if (divX < 0 && $(next).length > 0) { // move left
					$(next).css({
						'left' 	: parseInt($(div).width()) + 'px',
						'top' 	: '0px',
						'-webkit-transition' 	: 'none', 
						'-webkit-transform' 	: 'translate3d('+ divX +'px, 0px, 0px)'
					}).show();
				}
				if (divX > 0) { // move right
					$(prev).css({
						'left' 	: '-' + parseInt($(div).width()) + 'px',
						'top' 	: '0px',
						'-webkit-transition' 	: 'none', 
						'-webkit-transform' 	: 'translate3d('+ divX +'px, 0px, 0px)'
					}).show();
				}
			}
		}
	}
	
	function jsTouch_initTabs() {
		// if there are tabs - show/hide them, create onclick function
		$('#'+ this.name +' div.footer a').each( function (i, el) {	
			$(el).bind('touchstart', function () { $(this).click(); });
			$(el).bind('click', function() { 
				var currObj = jsTouch.getCurrentBox(window.event.currentTarget);
				$('#'+ currObj.name +' a').removeClass('clicked');
				$(window.event.currentTarget).addClass('clicked'); 
			});
		});
	}
	
	function jsTouch_initLinks() {
		// toolbar imediate click
		$('#'+ this.name +' div.toolbar a').bind('touchstart', new Function(
			"$('#"+ this.name +" div.toolbar a, #"+ this.name +" div.content a').removeClass('clicked');"+
			"$(this).addClass('clicked');"));
		// list click when not scrolling
		$('#'+ this.name +' div.toolbar a, #'+ this.name +' div.content a').click(new Function(
			"$('#"+ this.name +" div.toolbar a, #"+ this.name +" div.content a').removeClass('clicked');"+
			"$(this).addClass('clicked');"));
	}
	
	function jsTouch_resize() {
		// get width and height of the div
		var width  = this.width;
		var height = this.height;
		if (width == '')  width  = window.innerWidth;
		if (height == '') height = window.innerHeight;
		if (parseInt(width) < 0)  width = window.innerWidth + width;
		if (parseInt(height) < 0) height = window.innerHeight + height;

		// make divs scrollable
		if (this._lastDiv) { var tmp = 'div1'; } else { var tmp = 'div2'; }

		var div = $('#'+ this.name +' > .jsTouch.'+ tmp +' > div.content')[0];
		var isToolbar = ($('#'+ this.name +' > .jsTouch.'+ tmp +' > div.toolbar').length > 0 ? true : false);
		var isFooter  = ($('#'+ this.name +' > .jsTouch.'+ tmp +' > div.footer').length > 0 ? true : false);
		if (isToolbar) $(div).css('top', '45px');
		if (isFooter) $(div).css('bottom', '50px');

		// -- apply width (toolbar and footer)
		$('#'+ this.name).css('width', width+'px');
		$('#'+ this.name +' div.div1').css('width', width+'px');
		$('#'+ this.name +' div.div2').css('width', width+'px');
		$('#'+ this.name).css('height', height+'px');
		$('#'+ this.name +' div.div1').css('height', height+'px');
		$('#'+ this.name +' div.div2').css('height', height+'px');		
		// -- toolbar and footer
		$('#'+ this.name +' div.toolbar').css('width', width+'px');
		$('#'+ this.name +' div.footer').css('width', width+'px');
		// -- set scroll to 0, 0 (in the browser it will hide url bar)
		window.scrollTo(0, 1);		
	}
	
	// -- register in elements array
    if (!window.elements) window.elements = [];
    if (window.elements[this.name]) alert('The element with this name "'+ this.name +'" is already registered.');
    window.elements[this.name] = this;
	
	// -- init all param variables
	if (params != null && typeof(params) == 'object' && String(params) == '[object Object]') { // javascript object
		for (var e in params) { this[e] = params[e]; }
	}		
	
	// -- append 2 divs into the box (needed for transitions)
	var div1 = document.createElement('DIV');
	var div2 = document.createElement('DIV');
	div1.className = 'jsTouch div1';
	div2.className = 'jsTouch div2';
	$('#'+this.name).append(div1);
	$('#'+this.name).append(div2);
	// -- resize event
	// window.addEventListener('resize', new Function("setTimeout(\"window.elements['"+ this.name +"'].resize()\", 1)"));
}

// -- few events
window.addEventListener('resize', new Function("setTimeout(\"jsTouch.resize()\", 1)"));
window.applicationCache.addEventListener('updateready', function () { window.applicationCache.swapCache(); window.location.reload(); }, false);