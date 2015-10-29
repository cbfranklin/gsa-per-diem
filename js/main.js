var perDiemSwiper,
    perDiemSearch = {
        rates: {},
        query: {}
    },
    apiRoot = 'http://dev.oagov.com:3334/proxy'

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

    $('#start-date-group').datetimepicker({
        format: 'MM/DD/YYYY'
    });
    $('#end-date-group').datetimepicker({
        format: 'MM/DD/YYYY'
    });

    $('#perdiem-swiper').on('click', '#next:not(.disabled)', function() {
        perDiemSwiper.slideNext()
    })
    $('#perdiem-swiper').on('click', '#prev:not(.disabled)', function() {
        perDiemSwiper.slidePrev()
    })
    $('#perdiem-swiper').on('click', '#perdiem-multiple-rates-check', checkForMultipleRates);
    $('#perdiem-current-location').on('click', useMyCurrentLocation);

    $('#perdiem-swiper').on('click', '#perdiem-rates-selected', ratesSelected);

    $('#perdiem-city,#perdiem-zip').on('keyup', validateLocationParams)
    $('#perdiem-state').on('change', validateLocationParams)

    $('#perdiem-look-up-rates').on('click', function() {
        perDiemSwiper.slideTo(3)
    })
    $('#perdiem-to-step-2').on('click', function() {
        perDiemSwiper.slideTo(1)
    })
    $('#perdiem-to-date-range').on('click', function() {
        perDiemSwiper.slideTo(2)
    })
    $('#perdiem-look-up-rates-submit').on('click', lookUpRatesSubmit);
})

function validateLocationParams() {
    if ($('#perdiem-city').val() === '' && $('#perdiem-state').val() === '' && $('#perdiem-zip').val().length < 5) {
        $('.perdiem-step-1 #next').addClass('disabled').attr('disabled', 'disabled');
    } else {
        $('.perdiem-step-1 #next').removeClass('disabled').removeAttr('disabled');
    }
}

function checkForMultipleRates() {

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

    console.log('Start Date:', perDiemSearch.startDate.format('MM-DD-YYYY'), 'End Date:', perDiemSearch.endDate.format('MM-DD-YYYY'))
    console.log('Start FY:', perDiemSearch.startFY, 'End FY:', perDiemSearch.endFY)


    perDiemSearch.query.zip = $('#perdiem-zip').val();
    perDiemSearch.query.state = $('#perdiem-state').val();
    perDiemSearch.query.city = $('#perdiem-city').val();

    if (perDiemSearch.query.zip !== '') {
        //zip is available
        console.log('Using ZIP')
        var req = apiRoot + '/api/rs/perdiem/zip/' + perDiemSearch.query.zip;
    } else {
        if (perDiemSearch.query.city !== '') {
            //city and state available
            console.log('Using City & State')
            var req = apiRoot + '/api/rs/perdiem/city/' + perDiemSearch.query.city + '/state/' + perDiemSearch.query.state;
        } else {
            //state only
            console.log('Using State Only')
            var req = apiRoot + '/api/rs/perdiem/state/' + perDiemSearch.query.state;
        }
    }

    var fy1req = req + '/year/' + perDiemSearch.startFY;

    function getStartFY() {
        console.log('FY1 AJAX Call...')
        return $.ajax({
            url: fy1req,
        }).done(function(data) {
            //data = JSON.parse(data)
            var rates = data.rates[0].rate;
            if (rates.length > 1) {
                //multiple rates are available for FY1
                for (i in rates) {
                    if (rates[i].county === ' ') {
                        rates[i].county = 'Standard Rate'
                    }
                }
                perDiemSearch.rates.fy1 = {
                    year: perDiemSearch.startFY,
                    multiple: true,
                    rates: rates
                }
                console.log('Available Rates for FY1:', perDiemSearch.startFY, ':', rates)
            } else {
                console.log('Available Rate for FY1:', perDiemSearch.startFY, ':', rates[0])
                perDiemSearch.rates.fy1 = {
                    year: perDiemSearch.startFY,
                    multiple: false,
                    rate: rates[0]
                }
            }
        });
    }

    //if search includes 2 fiscal years
    function getEndFY() {
        if (perDiemSearch.startFY !== perDiemSearch.endFY) {
            console.log('FY2 AJAX Call...')
            var fy2req = req + '/year/' + perDiemSearch.endFY;
            return $.ajax({
                url: fy2req,
            }).done(function(data) {
                //data = JSON.parse(data)
                var rates = data.rates[0].rate;
                if (rates.length > 1) {
                    for (i in rates) {
                        if (rates[i].county === ' ') {
                            rates[i].county = 'Standard Rate'
                        }
                    }
                    perDiemSearch.rates.fy2 = {
                        year: perDiemSearch.endFY,
                        multiple: true,
                        rates: rates
                    }
                    console.log('Available Rates for FY2:', perDiemSearch.endFY, ': ', rates)
                } else {
                    console.log('Available Rate for FY2:', perDiemSearch.endFY, ':', rates[0])
                    perDiemSearch.rates.fy2 = {
                        year: perDiemSearch.endFY,
                        multiple: false,
                        rate: rates[0]
                    }
                }
            });
        } else {
            return true
        }
    }

    console.log('Checking available rates...')

    $.when(getStartFY(), getEndFY()).done(function() {
        console.log('AJAX Calls Complete!')
            //if multiple rates available, show multiple rates UI
        if (perDiemSearch.rates.fy1.multiple || perDiemSearch.rates.fy2.multiple) {
            //sort rates, cause the API doesn't
            function countyAlpha(a, b) {
                return a.county > b.county;
            }
            if (perDiemSearch.rates.fy1.multiple) {
                perDiemSearch.rates.fy1.rates = perDiemSearch.rates.fy1.rates.sort(countyAlpha);
            }
            if (perDiemSearch.rates.fy2.multiple) {
                perDiemSearch.rates.fy2.rates = perDiemSearch.rates.fy2.rates.sort(countyAlpha);

            }
            //render template
            var template = $('#templates .multiple-rates').html();
            var rendered = Mustache.render(template, {
                rates: perDiemSearch.rates
            });
            $('.perdiem-step-4').html(rendered);
            perDiemSwiper.slideTo(4)
        }
    });

}


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
        console.log('Reverse Geocoding: ', position)
        var latitude = position.coords.latitude,
            longitude = position.coords.longitude;

        var latlong = new google.maps.LatLng(latitude, longitude);

        geocoder.geocode({
            'latLng': latlong
        }, function(results, status) {
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
                console.log('Geocode Error!')
                $btn.button('reset')
            }
        });
    }

    function populateForm() {
        console.log('Populating Form With Reverse Geocode Results...')
        $('#perdiem-zip').val(geocodeResult.zip)
        $('#perdiem-city').val(geocodeResult.city)
        $('#perdiem-state option').each(function() {
            if ($(this).val() === geocodeResult.state) {
                $(this).attr('selected', 'selected');
            }
        })
    }

    function currentPositionError() {
        console.log('Current Position Error!')
    }
}


function calculateRates() {
    perDiemSearch.results = {
        breakdown: [],
        total: 0
    };
    console.log('Calculating...')
    var start = moment(perDiemSearch.startDate);
    var end = moment(perDiemSearch.endDate);
    var startDate = moment(perDiemSearch.startDate);
    var endDate = moment(perDiemSearch.endDate);
    //single day trip
    if (perDiemSearch.startDate === perDiemSearch.endDate) {
        console.log('One Day Trip (No Overnight):', 'MIE:', perDiemSearch.rates.fy1.rate.meals * 0.75)
            //mie only, at 75%
        var total = perDiemCalculator.rates.fy1.rate.meals * 0.75;
    }
    //multi-day trip
    else {
        var total = 0;
        var months = [];
        for (var date = start; !date.isAfter(end); date.add(1, 'days')) {

            var rateMonth = date.format('M');
            var rateYear = date.format('YYYY');

            if (rateMonth > 9) {
                var fy = parseFloat(rateYear) + 1
            } else {
                var fy = parseFloat(rateYear);
            }

            var fys = Object.keys(perDiemSearch.rates);
            for (i in fys) {
                if (perDiemSearch.rates[fys[i]].year === fy) {
                    var rate = perDiemSearch.rates[fys[i]].rate;
                }
            }

            console.log('=========\n', 'Adding Date:', date.format('MM-DD-YYYY'), 'Fiscal Year:', fy)




            //add perdiem rate for month
            var lodgingRate = rate.months.month[date.format('M')].value;
            //add mie at 75% for first and last day (using first two days since it's only a sum)
            var pdsd = moment(perDiemSearch.startDate).format('MM-DD-YYYY');
            var pded = moment(perDiemSearch.endDate).format('MM-DD-YYYY');
            //first day
            if (date.format('MM-DD-YYYY') === pdsd) {
                var mieRate = rate.meals * 0.75;
                total += mieRate;
                console.log('MIE at 75%:', mieRate)
                total += lodgingRate;
                console.log('Rate:', lodgingRate)
                perDiemSearch.results.breakdown.push({
                    date: 'First Day',
                    lodging: lodgingRate,
                    mie: mieRate,
                    isFirstLast: true,
                    total: lodgingRate + mieRate
                })
            }
            //last day
            else if (date.format('MM-DD-YYYY') === pded) {
                var mieRate = rate.meals * 0.75;
                total += mieRate;
                console.log('MIE at 75%:', mieRate)
                perDiemSearch.results.breakdown.push({
                    date: 'Last Day',
                    mie: mieRate,
                    lodging: 0,
                    isFirstLast: true,
                    total: mieRate
                })
            }
            //all other days
            else {
                total += lodgingRate;
                console.log('Rate:', lodgingRate)
                    //mie at 100%
                var mieRate = rate.meals;
                total += mieRate;
                console.log('MIE:', mieRate)
                var breakdown = perDiemSearch.results.breakdown;
                var month = date.format('MMMM');
                for (i in breakdown) {
                    if (breakdown[i].date === month) {
                        var monthAlreadyExists = true;
                    }
                }
                if (!monthAlreadyExists) {
                    perDiemSearch.results.breakdown.push({
                        isRate: true,
                        date: date.format('MMMM'),
                        lodging: lodgingRate,
                        mie: mieRate,
                        total: lodgingRate + mieRate
                    })
                }

            }
        }
    }
    perDiemSearch.results.total = total;
    console.log('=========\n', 'Total:', perDiemSearch.results.total);
    console.log('=========\n', 'Breakdown:')
    console.table(perDiemSearch.results.breakdown)
    //if more than one FY, are FYs using same rate?
    if(perDiemSearch.rates.fy1.rate.county === perDiemSearch.rates.fy2.rate.county){
        var sameRate = true;
    }
    var template = $('#templates .calculator-results').html();
    var rendered = Mustache.render(template, {
        perDiemSearch: perDiemSearch,
        sameRate: sameRate
    });
    $('.perdiem-step-5').prepend(rendered);
    perDiemSwiper.slideTo(5)
};

function ratesSelected() {
    var m = $('#perdiem-fiscal-year-1 option:selected').index();
    var n = $('#perdiem-fiscal-year-2 option:selected').index();
    console.log('User Selected:', $('#perdiem-fiscal-year-1 option:selected').text(), 'For FY', perDiemSearch.rates.fy1.year)
    perDiemSearch.rates.fy1.rate = perDiemSearch.rates.fy1.rates[m]
    if (perDiemSearch.rates.fy2) {
        perDiemSearch.rates.fy2.rate = perDiemSearch.rates.fy2.rates[n]
        console.log('User Selected:', $('#perdiem-fiscal-year-2 option:selected').text(), 'For FY', perDiemSearch.rates.fy2.year)
    }
    //temp
    calculateRates()
}

function updateProgress(n) {
    $('.progress-bar').attr('aria-valuenow', n).css('width', n + '%')
}

function lookUpRatesSubmit() {
    $('input[name="perdiemSearchVO.year"]').val($('#perdiem-rate-lookup-fiscal-year').val())
    $('input[name="perdiemSearchVO.city"').val($('#perdiem-city').val())
    $('input[name="perdiemSearchVO.state"').val($('#perdiem-state').val())
    $('input[name="perdiemSearchVO.zip"').val($('#perdiem-zip').val())
    $('#perdiem-find-rates-form').submit();
}
