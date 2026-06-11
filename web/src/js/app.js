$(document).ready(function () {
    // execute this code only if page contains a calendar
    if ($('#calendarGrid').length > 0 && window.exploreData) {
        initExplorePage();
    }
});


// initialize the page contains a calendar
function initExplorePage() {
    const recommendations = window.exploreData.recommendations;
    const selectedMonth = window.exploreData.selectedMonth;
    const duration = window.exploreData.duration;

    let selectedRecommendationIndex = 0;
    let selectedStartDate = null;

    displayRecommendation(0);

    // display the recommendation is clicked
    $('.recommendations-item').on('click', function () {
        const index = parseInt($(this).data('index'));
        displayRecommendation(index);
    });

    // function display recommendation according to index
    function displayRecommendation(index) {
        selectedRecommendationIndex = index;
        selectedStartDate = null;

        const recommendation = recommendations[index];

        $('.recommendations-item').removeClass('active');
        $('.recommendations-item[data-index="' + index + '"]').addClass('active');

        $('#topRecommendationName').text(recommendation.name);
        $('#topRecommendationRegion').text(recommendation.region + ', France');

        $('#topRecommendationImage').css(
            'background-image',
            "linear-gradient(rgba(7, 19, 46, 0.2), rgba(7, 19, 46, 0.75)), url('" + recommendation.image_url + "')"
        );

        $('#topMonth').text(recommendation.month);
        $('#topAverageTemp').text(recommendation.averageTemp + '°');
        $('#topPrecipitation').text(recommendation.precipitation);
        $('#topSunHours').text(recommendation.sunHours);

        $('#selectedCityId').val(recommendation.id);
        $('#selectedStartDate').val('');
        $('#submitBooking').prop('disabled', true);

        renderCalendar(recommendation);
    }

    // function to create and display a calendar associated with selectionned datas
    function renderCalendar(recommendation) {
        $('#calendarGrid').empty();

        // if date is on format : selectedMonth = "2026-07"
        const parts = selectedMonth.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);  // The day 0 of next month = last day of previous month

        const numberOfDaysInMonth = lastDayOfMonth.getDate();
        const firstWeekDay = getMondayBasedDay(firstDayOfMonth);

        const emptyCellsBefore = firstWeekDay - 1;

        const minimumCells = emptyCellsBefore + numberOfDaysInMonth + duration - 1;
        const totalCells = Math.ceil(minimumCells / 7) * 7;

        const firstCellDate = new Date(year, month - 1, 1);
        firstCellDate.setDate(firstCellDate.getDate() - emptyCellsBefore);

        // loop buttons creation
        for (let i = 0; i < totalCells; i++) {
            const currentDate = new Date(firstCellDate);
            currentDate.setDate(firstCellDate.getDate() + i);

            const dateString = formatDate(currentDate);
            const score = findScoreForDate(recommendation, dateString);
            const scoreClass = getScoreClass(score);

            // creation of button
            const dayButton = $('<button></button>');

            dayButton.attr('type', 'button');
            dayButton.addClass('calendar-day');
            dayButton.addClass(scoreClass);
            dayButton.attr('data-date', dateString);

            if (currentDate.getMonth() !== month - 1) {
                dayButton.addClass('outside-month');
            }

            dayButton.html(
                '<span class="calendar-day-number">' + currentDate.getDate() + '</span>'
            );

            // if user click on a day of calendar
            dayButton.on('click', function () {
                selectedStartDate = $(this).data('date');

                $('#selectedStartDate').val(selectedStartDate); // hidden field on form
                $('#submitBooking').prop('disabled', false); // activate the booking button

                updateSelectedDuration();
            });

            $('#calendarGrid').append(dayButton);
        }
    }

    // function to color selectionned day's buttons according to duration
    function updateSelectedDuration() {
        $('.calendar-day').removeClass('selected-start selected-range');

        if (selectedStartDate === null) {
            return;
        }

        const start = new Date(selectedStartDate);

       

        for (let i = 0; i < duration; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);

            const dateString = formatDate(currentDate);
            const cell = $('.calendar-day[data-date="' + dateString + '"]');

            console.log('i =', i, 'dateString =', dateString, 'cell trouvée =', cell.length);



            if (cell.length > 0) {
                if (i === 0) {
                    cell.addClass('selected-start');
                } else {
                    cell.addClass('selected-range');
                }
            }
        }
    }

    // if travelScoreByDay: [
    // { date: "2026-07-01", score: 85 },
    // { date: "2026-07-02", score: 70 }]
    // return the associated score
    function findScoreForDate(recommendation, dateString) {
        if (!recommendation.travelScoreByDay) {
            return null;
        }

        const day = recommendation.travelScoreByDay.find(function (item) {
            return item.date === dateString;
        });

        if (!day) {
            return null;
        }

        return day.score;
    }

    // return a class css for score rating
    // 0 --> 45 --> 55 +
    function getScoreClass(score) {
        if (score === null) {
            return 'score-unknown';
        }

        if (score >= 55) {
            return 'score-high';
        }

        if (score >= 45) {
            return 'score-medium';
        }

        return 'score-low';
    }

    // return the index of day in week in french calendar
    function getMondayBasedDay(date) {
        const day = date.getDay();

        if (day === 0) {
            return 7;
        }

        return day;
    }

    // update a date into format YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return year + '-' + month + '-' + day;
    }
}