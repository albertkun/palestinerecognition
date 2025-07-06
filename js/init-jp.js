// set the year to the latest current year in YYYY format
let currentYear = new Date().getFullYear();


class TimeSliderControl {
    constructor(chartControl) {
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl';
        this.container.style.display = 'flex';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';

		this.slider = document.createElement('div');
		this.slider.id = 'map-slider';
		
		// Adjust the width of the slider based on the screen size
		if (window.innerWidth <= 850) {
			this.slider.style.width = '250px';
		} else {
			this.slider.style.width = '450px';
		}
		
		// Add an event listener to adjust the width of the slider when the window is resized
		window.addEventListener('resize', () => {
			if (window.innerWidth <= 850) {
				this.slider.style.width = '300px';
			} else {
				this.slider.style.width = '500px';
			}
		});
		this.slider.style.margin = '10px';

        this.container.appendChild(this.slider);
		this.onTimeSliderChange = this.debounce(this.onTimeSliderChange, 200);
        // Use the existing ChartControl object
        this.chartControl = chartControl;
		
    }

	onAdd(map) {
		this.map = map;

		const default_start_date = 'Jan 1,1990';
		const default_end_date = Date.now();

		// Calculate the years for every 5 years between the start and end dates
		const startYear = new Date(default_start_date).getFullYear();
		const endYear = new Date(default_end_date).getFullYear();
        const years = [];
        for (let year = startYear; year <= endYear; year += 5) {
            years.push(Date.parse(`Jan 1,${year}`));
        }

		// Make sure the start and end dates are included
		if (!years.includes(Date.parse(default_start_date))) {
			years.unshift(Date.parse(default_start_date));
		}
        const lastYearMs = Date.parse(`Jan 1,${endYear}`);
        if (!years.includes(lastYearMs)) {
            years.push(lastYearMs);
        }

		this.timeSlider = noUiSlider.create(this.slider, {
			behaviour: 'tap-drag',
			connect: false, // Single handle
			range: {
				min: Date.parse(default_start_date),
				max: default_end_date
			},
			direction: 'ltr',
			step: 24 * 60 * 60 * 1000 * 365.2425, // Step size of one year
			start: [default_end_date], // Single handle at the end date
			format: wNumb({
				decimals: 0
			}),
			pips: {
				mode: 'values',
				values: years, // Specify the values where pips should appear
				format: {
					to: function (value) {
						return new Date(value).getFullYear(); // Convert the value to a year for display
					},
					from: function (value) {
						return value;
					}
				}
			}
		});

        this.timeSlider.on('update', (values, handle) => {
            let date = new Date(+values[handle]);
            this.onTimeSliderChange(date);
        });

        return this.container;
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }

    onTimeSliderChange(date) {
        console.log('Time slider changed');
        let filteredData = filterDataByTime(date);
        // Clear the existing chart
        while (this.chartControl.container.firstChild) {
            this.chartControl.container.removeChild(this.chartControl.container.firstChild);
        }
		
        // Update the chart data
		let stats = calculateStatistics(filteredData);
		this.chartControl.updateData(stats);
    }
	// Debounce function
	debounce(func, wait) {
		let timeout;
		return function(...args) {
			const context = this;
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(context, args), wait);
		};
	}
}

function filterDataByTime(date) {
    // Convert date to ISO string
    date = new Date(date).toISOString();
	currentYear = new Date(date).getFullYear();

    // Set the filter on the countries layer
    map.setFilter('countries-layer', [
        'any',
        ['!', ['has', 'date']], // if date property does not exist
        ['<=', ['get', 'date'], date] // if date is before or on the specified date
    ]);

    // Update the color of the countries based on the filter result
    map.setPaintProperty('countries-layer', 'fill-color', [
        'case',
        ['all', ['==', ['get', 'recognition'], 'yes'], ['<=', ['get', 'date'], date]], 'green', // if recognition is 'yes' and date is before or on the specified date
        ['all', ['==', ['get', 'recognition'], 'yes'], ['>', ['get', 'date'], date]], 'lightgreen', // if recognition is 'yes' and date is after the specified date
        '' // default color
    ]);
	let filteredData = mapData.features.filter(feature => {
		let featureDate = feature.properties.date;

		// If date is 'unknown', set it to the earliest date
		if (featureDate === 'unknown') {
			featureDate = '1988-01-01';  // This is the earliest date representable in JavaScript
		}

		if (feature.properties.recognition === 'yes' && featureDate) {
			return new Date(featureDate).toISOString() <= date;
		}
		return true;
	});
	return filteredData;
}

class ChartControl {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl';
        this.container.style.width = '200px';
        this.container.style.height = '150px';
        this.container.style.backgroundColor = '#ddd';
    }

    onAdd(map) {
        this.map = map;
        return this.container;
    }

    onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
	updateData(data) {
		// Style the container to look like a card
		this.container.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // White background with 80% opacity
		this.container.style.borderRadius = '15px'; // Rounded corners
		this.container.style.padding = '10px'; // Padding
		this.container.style.width = '250px'; // Width
		this.container.style.boxShadow = '0 4px 6px 0 hsla(0, 0%, 0%, 0.2)'; // Subtle shadow
		this.container.style.display = 'flex'; // Enable Flexbox
		this.container.style.flexDirection = 'column'; // Stack the children vertically
		this.container.style.alignItems = 'center'; // Center the children horizontally
	

		// Add a title (Japanese)
		let title = document.createElement('h2');
		title.id = 'chartTitle';  // Add an ID to the title element
		title.textContent = currentYear + "年にパレスチナを承認した国"; // Set the title text in Japanese
		title.style.fontFamily = "'Noto Sans JP', sans-serif"; // Use Japanese font
		title.style.textAlign = 'center';
		this.container.appendChild(title);

		let chartContainer = createBarChart(data);
		this.container.appendChild(chartContainer);

		// Add a source (Japanese)
		let source = document.createElement('p');
		source.style.fontFamily = "'Noto Sans JP', sans-serif"; // Use Japanese font
		source.style.textAlign = 'center';
		source.innerHTML = 'データ元: <a href="https://en.wikipedia.org/wiki/International_recognition_of_the_State_of_Palestine" target="_blank">Wikipedia</a>';
		this.container.appendChild(source);

		// Create a link to your GitHub repository
		let githubLink = document.createElement('a');
		githubLink.href = 'https://github.com/albertkun/palestinerecognition';
		githubLink.target = '_blank';

		// Create a FontAwesome GitHub icon and add it to the link
		let githubIcon = document.createElement('i');
		githubIcon.className = 'fab fa-github';
		githubLink.appendChild(githubIcon);

		// Add the link to the container
		this.container.appendChild(githubLink);
	}
}
let mapData;
function createBarChart(data) {
    // Calculate the total number of responses
    let total = data.yes + data.no;

    // Create the 'yes' part of the bar (Japanese)
    let yesBar = document.createElement('div');
    yesBar.style.height = '100%';
    yesBar.style.width = `${data.yes / total * 100}%`;
    yesBar.style.backgroundColor = '#008000';
    yesBar.style.color = '#ffffff'; // Ensure contrast
    yesBar.textContent = `承認: ${data.yes}`; // Add the number of 'yes' countries in Japanese
    yesBar.style.fontFamily = "'Noto Sans JP', sans-serif"; // Use Japanese font
    yesBar.style.textAlign = 'center';
    yesBar.setAttribute('role', 'img'); // Non-text content
    yesBar.setAttribute('aria-label', `承認: ${data.yes}`); // Non-text content in Japanese

    // Create the 'no' part of the bar (Japanese)
    let noBar = document.createElement('div');
    noBar.style.height = '100%';
    noBar.style.width = `${data.no / total * 100}%`;
    noBar.style.backgroundColor = '#DD2222';
    noBar.style.color = '#ffffff'; // Ensure contrast
    noBar.textContent = `非承認: ${data.no}`; // Add the number of 'no' countries in Japanese
    noBar.style.fontFamily = "'Noto Sans JP', sans-serif"; // Use Japanese font
    noBar.style.textAlign = 'center';
    noBar.setAttribute('role', 'img'); // Non-text content
    noBar.setAttribute('aria-label', `非承認: ${data.no}`); // Non-text content in Japanese

    // Create a container for the bar chart
    let chartContainer = document.createElement('div');
    chartContainer.style.display = 'flex';
    chartContainer.style.width = '200px';
    chartContainer.style.height = '20px';
    chartContainer.appendChild(yesBar);
    chartContainer.appendChild(noBar);

    return chartContainer;
}
document.addEventListener('DOMContentLoaded', (event) => {
    // Fetch the GeoJSON data
    fetch('data/countries.geojson')
        .then(response => response.json())
        .then(data => {
            mapData = data;
        });
});



let map = new maplibregl.Map({
    container: 'map',
    style: 'https://openmaptiles.github.io/positron-gl-style/style-cdn.json',
    center: [0, 0],
    zoom: 1
});

map.on('load', function () {
    // Add the GeoJSON data to the map as a source
    map.addSource('countries', {
        type: 'geojson',
        data: mapData
    });

    // Add a base layer with a static color
	map.addLayer({
		'id': 'countries-base-layer',
		'type': 'fill',
		'source': 'countries',
		'layout': {},
		'paint': {
			'fill-color': [
				'case',
				['==', ['get', 'recognition'], 'yes'], 'lightgreen', // faded green/gray color for 'yes'
				['==', ['get', 'recognition'], 'no'], 'red', // red color for 'no'
				'transparent' // default color
			],
			'fill-opacity': 0.5
		},
		'filter': ['any', ['==', ['get', 'recognition'], 'yes'], ['==', ['get', 'recognition'], 'no']] // include features where 'recognition' is 'yes' or 'no'
	});
    // Add a top layer with colors based on the 'recognition' property
    map.addLayer({
        'id': 'countries-layer',
        'type': 'fill',
        'source': 'countries',
        'layout': {},
        'paint': {
            'fill-color': [
                'match',
                ['get', 'recognition'],
                'yes', '#008000', // green for 'yes'
                'no', 'transparent', // transparent for 'no'
                'transparent' // default color
            ],
            'fill-opacity': 0.5
        }
    });

    // Create a popup, but don't add it to the map yet.
    let popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false
    });

    map.on('mousemove', 'countries-layer', function(e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';
		// Initialize the html variable
		let html = '';
        // Single out the first found feature.
        let feature = e.features[0];
		// Add the flag emoji if the country code is available
		if (feature.properties.country_code) {
			let flagEmoji = String.fromCodePoint(...feature.properties.country_code.toUpperCase().split('').map(c => c.charCodeAt(0) + 127397));
			html = '<h3>'+flagEmoji+ " " + feature.properties.name +'</h3>';
		}
		// Display a popup with the name of the country (Japanese)
		if (feature.properties.recognition === 'yes') {
			html += '<br>承認年: ' + new Date(feature.properties.date).getFullYear();
		}



		popup.setLngLat(e.lngLat)
			.setHTML(html)
			.addTo(map);
    });

    map.on('mouseleave', 'countries-layer', function() {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
});

map.once('idle', function() {
    // Find the min and max dates
    let minDate = Infinity;
    let maxDate = -Infinity;

    for (let feature of mapData.features) {
        let date = new Date(feature.properties.date).getTime();
        minDate = Math.min(minDate, date);
        maxDate = Math.max(maxDate, date);
		console.log(minDate);
    }

    // Create the time slider control

    // Create a new instance of the control and add it to the map
    let chartControl = new ChartControl();
    map.addControl(chartControl, 'bottom-right');
	let timeSliderControl = new TimeSliderControl(chartControl);

    // Add the control to the map
    map.addControl(timeSliderControl, 'top-left');

    let stats = calculateStatistics(mapData.features);
    chartControl.updateData(stats);
});

function loadMap(allData) {

    allData.forEach(function(data) {
        // console.log(data.properties);

		// console.log(stats);
    });
}
function calculateStatistics(data) {
    let statistics = {
        total: new Set(),
        yes: new Set(),
        no: new Set()
    };

    data.forEach(function(country) {
        statistics.total.add(country.properties.name);
        if (country.properties.recognition === 'yes') {
            statistics.yes.add(country.properties.name);
        } else if (country.properties.recognition === 'no') {
            statistics.no.add(country.properties.name);
        }
    });

    return {
        total: 171, // Hardcoded total number of countries in the world
        yes: statistics.yes.size,
        no: 171 - statistics.yes.size
    };
}


// Function to be called when the time slider changes
function onTimeSliderChange(start, end) {

}


// Assuming 'map' is the id of your map element
let thismap = document.getElementById('map');

// Add a small delay then simulate a small jiggle
setTimeout(() => {
    const center = map.getCenter();
    const jiggleLat = center.lat + 0.0001;
    const jiggleLng = center.lng + 0.0001;

    map.setCenter([jiggleLng, jiggleLat]);

    // Or, simulate a pan event
    map.panBy([0.0001, 0.0001]);
}, 1000);
