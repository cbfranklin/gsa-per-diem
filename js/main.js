var perDiemSwiper,
    perDiemSearch = {},
    apiRoot = 'http://localhost:3333'

$(function() {
            $('#perdiem-zip').val('')
            $('#perdiem-city').val('')
            $('#perdiem-state option').each(function() {
                if ($(this).val() === "") {
                    $(this).attr('selected', 'selected');
                }
            })
            perDiemSwiper = new Swiper('#perdiem-swiper', {
                onlyExternal: true,
                a11y: true
            });
            $('#perdiem-swiper').on('click', '#next:not(.disabled)', function() {
                perDiemSwiper.slideNext()
            })
            $('#perdiem-swiper').on('click', '#prev:not(.disabled)', function() {
                perDiemSwiper.slidePrev()
            })
            $('#perdiem-swiper').on('click', '#perdiem-multiple-rates-check', function() {

                    //what fiscal year is start date
                    perDiemSearch.startDate = moment($('#perdiem-start-date').val(), 'MM/DD/YYYY')
                    if (perDiemSearch.startDate.month() > 8) {
                        perDiemSearch.startFY = perDiemSearch.startDate.year() + 1
                    } else {
                        perDiemSearch.startFY = perDiemSearch.startDate.year()
                    }
                    //what fiscal year is end date?
                    perDiemSearch.endDate = moment($('#perdiem-end-date').val(), 'MM/DD/YYYY')
                    if (perDiemSearch.endDate.month() > 8) {
                        perDiemSearch.endFY = perDiemSearch.endDate.year() + 1
                    } else {
                        perDiemSearch.endFY = endDate.year()
                    }

                    console.log('startFY', perDiemSearch.startFY, 'endFY', perDiemSearch.endFY)
                        //one ajax call per fiscal year searched
                    if ($('#perdiem-zip').val() !== '') {
                        //zip is available
                        console.log('using zip')
                        var req = apiRoot + '/api/rs/perdiem/zip/' + $('#perdiem-zip').val();
                    } else {
                        if ($('#perdiem-city').val() !== '') {
                            //city and state available
                            console.log('using city/state')
                            var req = apiRoot + '/api/rs/perdiem/city/' + $('#perdiem-city').val(); + '/state/' + $('#perdiem-state').val();
                        } else {
                            //state only
                            console.log('using state only')
                            var req = apiRoot + '/api/rs/perdiem/state/' + $('#perdiem-state').val();
                        }
                    }

                    var fy1req = req + '/year/' + perDiemSearch.startFY;
                    $.ajax({
                        url: fy1req,
                    }).done(function(data) {
                            data = JSON.parse(data)
                            var rates = data.rates[0].rate;
                            if (rates.length > 1) {
                                //multiple rates are available for FY1
                                console.log('multiple rates for FY1')
                                console.log(rates)
                                perDiemSearch.rates.fy1 = {
                                    year: startFY,
                                    multiple: true,
                                    rates: rates
                                }
                            } else {
                                console.log(rates[0])
                                perDiemSearch.rates.fy1 = {
                                    year: startFY,
                                    multiple: false,
                                    rate: rates[0]
                                }
                            });

                        //if search includes 2 fiscal years
                        if (perDiemSearch.startFY !== perDiemSearch.endFY) {
                            var fy2req = req + '/year/' + perDiemSearch.endFY;
                            $.ajax({
                                url: fy1req,
                            }).done(function(data) {
                                data = JSON.parse(data)
                                var rates = data.rates[0].rate;
                                if (rates.length > 1) {
                                    //multiple rates are available for FY2
                                    console.log('multiple rates for FY2')
                                    console.log(rates)
                                    perDiemSearch.rates.fy2 = {
                                        year: endFY,
                                        multiple: true,
                                        rates: rates
                                    }
                                } else {
                                    console.log(rates[0])
                                    perDiemSearch.rates.fy2 = {
                                        year: endFY
                                        multiple: false,
                                        rate: rates[0]
                                    }
                                }
                            });
                        }
                        //if multiple rates available, show multiple rates UI
                        if (perDiemSearch.rates.fy1.multiple || perDiemSearch.rates.fy2.multiple)) {
                            //add choose rates UI
                            //populate template
                            //use choices to move relevant rates from fyx.rates[n] to fyx.rate
                        }

                    }); $('#start-date-group').datetimepicker({
                    format: 'MM/DD/YYYY'
                }); $('#end-date-group').datetimepicker({
                    format: 'MM/DD/YYYY'
                }); $('#perdiem-current-location').on('click', useMyCurrentLocation);
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
                console.log('reverse geocoding: ', position)
                var latitude = position.coords.latitude,
                    longitude = position.coords.longitude;

                var latlong = new google.maps.LatLng(latitude, longitude);

                geocoder.geocode({
                    'latLng': latlong
                }, function(results, status) {
                    console.log(google.maps.GeocoderStatus, results[0].address_components)
                    if (status == google.maps.GeocoderStatus.OK) {
                        var addressComponents = results[0].address_components;
                        //ZIP, use postal_code
                        for (i in addressComponents) {
                            if (addressComponents[i].types[0] === 'postal_code') {
                                geocodeResult.zip = addressComponents[i].long_name;
                            }
                        }
                        //CITY, use locality
                        for (i in addressComponents) {
                            if (addressComponents[i].types.indexOf('locality') > -1) {
                                geocodeResult.city = addressComponents[i].long_name;
                            }
                        }
                        //if no locality, use sublocality
                        if (geocodeResult.city === '') {
                            for (i in addressComponents) {
                                if (addressComponents[i].types.indexOf('sublocality') > -1) {
                                    geocodeResult.city = addressComponents[i].long_name;
                                }
                            }
                        }
                        //STATE, use administrative_area_level_1
                        for (i in addressComponents) {
                            if (addressComponents[i].types.indexOf('administrative_area_level_1') > -1) {
                                geocodeResult.state = addressComponents[i].short_name;
                            }
                        }
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

            function populateForm() {
                $('#perdiem-zip').val(geocodeResult.zip)
                $('#perdiem-city').val(geocodeResult.city)
                $('#perdiem-state option').each(function() {
                    if ($(this).val() === geocodeResult.state) {
                        $(this).attr('selected', 'selected');
                    }
                })
            }

            function currentPositionError() {
                console.log('currentPositionError')
            }
        }
