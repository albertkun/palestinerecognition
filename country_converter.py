import json
import pandas as pd
from fuzzywuzzy import process
import re
from datetime import datetime

# Load the JSON file
with open('data/countries.json', 'r', encoding='utf-8') as file:
	countries = json.load(file)

# Load the CSV files
yes_df = pd.read_csv('data/yes.csv')
no_df = pd.read_csv('data/no.csv')


# Get the country names and dates from the 'yes' CSV
yes_countries = [re.sub(r'\[\d+\]', '', name) for name in yes_df['Name'].tolist()]
yes_dates = [re.sub(r'\[\d+\]', '', date) for date in yes_df['Date'].tolist()]

# Remove any "*" characters from dates
yes_dates = [re.sub(r'\*', '', date) for date in yes_dates]
# Convert dates to date format without time
yes_dates = [datetime.strptime(date.strip(), '%d %B %Y').date().isoformat() if re.match(r'\d{1,2} \w+ \d{4}', date) else 'unknown' for date in yes_dates]

# Get the country names from the 'no' CSV
no_countries = [re.sub(r'\[\d+\]', '', name) for name in no_df['Name'].tolist()]


# For each country in the JSON file
for country in countries['features']:
	# Get the country name
	name = country['properties']['sovereignt']

	# Use fuzzy matching to find the closest match in the CSV files
	yes_match = process.extractOne(name, yes_countries)
	no_match = process.extractOne(name, no_countries)

	# If a match is found in the 'yes' CSV, assign 'yes' to the country and grab the date
	if yes_match[1] > 80:
		date = yes_dates[yes_countries.index(yes_match[0])]
		country['properties'] = {'sovereignt': name, 'recognition': 'yes', 'date': date}
	# If a match is found in the 'no' CSV, assign 'no'
	elif no_match[1] > 80:
		country['properties'] = {'sovereignt': name, 'recognition': 'no'}
	# If no match is found, assign 'unknown'
	else:
		country['properties'] = {'sovereignt': name, 'recognition': 'unknown'}

# Write the modified JSON object back to the file
with open('data/countries.json', 'w', encoding='utf-8') as file:
	json.dump(countries, file)