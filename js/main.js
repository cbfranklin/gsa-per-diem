var perDiemSwiper;
$(function() {
    perDiemSwiper = new Swiper('#perdiem-swiper', {
        //onlyExternal: true,
        a11y: true
    });
    $('#perdiem-swiper').on('click', '#next', function() {
        perDiemSwiper.slideNext()
    })
    $('#perdiem-swiper').on('click', '#prev', function() {
        perDiemSwiper.slidePrev()
    })
    $('#start-date-group').datetimepicker({
        format: 'MM/DD/YYYY'
    });
    $('#end-date-group').datetimepicker({
        format: 'MM/DD/YYYY'
    });
    $('#perdiem-current-location').on('click',useMyCurrentLocation);
})

function useMyCurrentLocation() {
	var $btn = $(this).button('loading')
    var geocodeResult = {
        city: '',
        state: '',
        zip: ''
    };
    //get location
    navigator.geolocation.getCurrentPosition(reverseGeocode, currentPositionError);
    geocoder = new google.maps.Geocoder();

    function reverseGeocode(position) {
    	console.log('reverse geocoding: ',position)
        var latitude = position.coords.latitude,
            longitude = position.coords.longitude;

        var latlong = new google.maps.LatLng(latitude, longitude);

        geocoder.geocode({
            'latLng': latlong
        }, function(results, status) {
        	console.log(google.maps.GeocoderStatus, results[0].address_components)
            if (status == google.maps.GeocoderStatus.OK) {
                var addressComponents = results[0].address_components;
                //ZIP
                for (i in addressComponents) {
                    if (addressComponents[i].types[0] === 'postal_code') {
                        geocodeResult.zip = addressComponents[i].long_name;
                    }
                }
                //CITY
                for (i in addressComponents) {
                    if (addressComponents[i].types.indexOf('locality') > -1) {
                        geocodeResult.city = addressComponents[i].long_name;
                    }
                }
                //STATE
                for (i in addressComponents) {
                    if (addressComponents[i].types.indexOf('administrative_area_level_1') > -1) {
                        geocodeResult.state = addressComponents[i].short_name;
                    }
                }
                console.log(geocodeResult)
                populateForm();
                $btn.button('reset')
                $('.perdiem-step-1 #next').removeClass('disabled');
            } else {
                //error
                console.log('error')
                $btn.button('reset')
            }
        });
    }
    function populateForm(){
    	console.log('populateForm')
    	$('#perdiem-zip').val(geocodeResult.zip)
    	$('#perdiem-state option').each(function(){
    		if($(this).val() === geocodeResult.state){
    			$(this).attr('selected','selected');
    		}
    	})
    	$('#perdiem-city').val(geocodeResult.city)
    }
    function currentPositionError(){
    	console.log('currentPositionError')
    }
}