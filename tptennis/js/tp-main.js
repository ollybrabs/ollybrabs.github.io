$.fn.tpParallax = function( a ) {
	var y = $(this);
	var x = $(document).scrollTop();
	var g = $(document).height();

	$(y).css({ 'background-position': '0px ' + ((x / a)) + 'px' });
		
	$(document).scroll(function() {
		x = $(document).scrollTop();
		$(y).css({ 'background-position': '0px ' + ((x / a)) + 'px' })
	});
}

$.fn.tpSlideControls = function() {
	$(this).prepend(
	"<div class='slide-controls'>"
			+ "<i class='fa fa-chevron-left'></i>"
			 + "<i class='fa fa-chevron-right'></i>"
		+ "</div>"
	);
		
	$('.fa-chevron-right').click(function() {
		$('.slidesjs-next').click();
	});
		
	$('.fa-chevron-left').click(function() {
		$('.slidesjs-previous').click();
	});
	
	$('.slide-container').on("mouseenter", function() {
		console.info("mouseenter");
		$('.slidesjs-stop').click();
	});
	
	$('.slide-container').on("mouseleave", function() {
		console.info("mouseleave");
		
		//for lack of a better way of resetting plugin_slidesjs.options.play.interval
		setTimeout(function() { $('.slidesjs-play').click() }, 10000);
	});
}

$.fn.tpPullMenu = function() {
	var pull   = $(".pull")
		menu       = $(".tp-navbar ul")
		menuHeight = menu.height();
	
	$(pull).on('click', function(e) {
		e.preventDefault();
		menu.slideToggle();
	});
		
	$(window).resize(function() {
		var w = $(window).width();
		if(w > 320 && menu.is(':hidden')) {
			menu.removeAttr('style');
		}
	});
}

$(window).load(function() {

	$('.loading').hide();
	
});
	
$(function() {
	if( $('.test-div').length ) {
		$('.test-div').slidesjs({
			autoHeight: true,
			navigation: {
				active: false,
				effect: "slide"
			},
			pagination: false,
			effect: {
				fade: {
					speed: 100
				}
			}, 
			play: {
				active: true, //create controls
				auto: true,
				interval: 10000,
				pauseOnHover: false, //for workaround
			}
		});
		
	}
});

//-------  data validation functions
$.fn.validatePassword = function() {}