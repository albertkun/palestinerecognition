# Palestine Recognition Visualization

This project visualizes the recognition of Palestine by different countries over time using a map and a bar chart. It is built using vanilla JavaScript and MapLibre GL JS.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/palestinerecognition.git
    cd palestinerecognition
    ```

2. Open `index.html` in your browser to view the visualization.

## Usage

### Changing the Data Source

1. Replace the `data/countries.geojson` file with your own GeoJSON data file. Ensure that your data has the necessary properties (`recognition`, `date`, `country_code`, etc.).

### Customizing the Map

1. Modify the `map.on('load', function () { ... })` section in your JavaScript file to change the map layers and properties according to your data.

### Customizing the Chart

1. Update the `createBarChart(data)` function to change the appearance and data of the bar chart.

### Updating the Popup

1. Modify the `map.on('mousemove', 'countries-layer', function(e) { ... })` section to customize the popup content based on your data properties.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

This project is licensed under the DoNoHarm License. See the [LICENSE](LICENSE.md) file for details.