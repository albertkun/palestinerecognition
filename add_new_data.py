import json
import pycountry
from fuzzywuzzy import fuzz
from fuzzywuzzy import process

# Load the GeoJSON data
with open('./data/countries.geojson', 'r') as f:
    data = json.load(f)

# Get a list of all country names
country_names = [country.name for country in pycountry.countries]

# Add the country code to each feature
for feature in data['features']:
    country_name = feature['properties']['name']
    try:
        # Find the closest match to the country name
        match, score = process.extractOne(country_name, country_names)

        # Only use the match if the score is above a certain threshold
        if score > 85:  # You can adjust this threshold
            country = pycountry.countries.get(name=match)
            if country:
                feature['properties']['country_code'] = country.alpha_2
        else:
            print(f"No good match found for country: {country_name}")
    except Exception as e:
        print(f"Error processing country: {country_name}. Error: {e}")

# Save the GeoJSON data to a new file
with open('data_with_country_code.geojson', 'w') as f:
    json.dump(data, f)