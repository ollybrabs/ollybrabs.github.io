$('html').removeClass('no-js');


//---- SCROLLING ANIMATIONS ----//
function onScrollInit(elems, trigger) {
	elems.each(function() {
		var osElement = $(this),
			osAnimationClass = osElement.attr('data-animation'),
			osAnimationDelay = osElement.attr('data-animation-delay');
			
		osElement.css({
			'-webkit-animation-delay': 	osAnimationDelay,
			'-moz-animation-delay': 	osAnimationDelay,
			'animation-delay': 			osAnimationDelay
		});
		
		var osTrigger = (trigger) ? trigger : osElement;
		
		osTrigger.waypoint(function() {
			osElement.addClass('animated').addClass(osAnimationClass);
		}, {
			triggerOnce: true,
			offset: '90%'	
		});
	});
}

//---- ELEMENT EXISTS? ----//
function exists(name, num) {
	return ( ($(name).length >= 1) ? ((num) ? $(name).length : true) : (false) );
}

//---- PARALLAX FUNCTION ----//
$.fn.tpParallax = function(a) {
	$win = $(window);
	$doc = $(document);
	
	$(this).each(function(index) {
		var $this = $(this);
		
		$doc.scroll(function() {
			var sAmnt = $win.scrollTop();
			var oT = $this.offset().top;
			var oH = $this.outerHeight();
			
			$this.css({ 'background-position': '50% ' + ((oT - sAmnt) * 0.35).toFixed(2) + 'px' });
		});
	
	});
}

$(document).ready(function() {
	$(window).resize(function() {
		var x = $(window).width();
		
		if(x >= 940) {
			if( $('.nav-overlay-test').is(':visible') ) {
				$('.nav-overlay-test').fadeOut(500);
				$('.new-navbar-test').addClass('collapsed');
			}
			
			$('.side-menu').css({ zIndex: '-1' });
			$('.navbar-toggle').addClass('collapsed');
			
			$('.main').animate({ left: '0px', paddingRight: '0' }, 500, function() {
				$('.side-menu').hide();
			});
		}
	});
	
	$('.new-navbar').click(function() {
		if($(this).hasClass('collapsed')) {
			$(this).removeClass('collapsed');
			$('.nav-overlay').fadeIn(500);
		} else {
			$(this).addClass('collapsed');
			$('.nav-overlay').fadeOut(500);
		}	
	});
	
	onScrollInit( $('.animate-scroll') );
});