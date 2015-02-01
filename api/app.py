from flask import Flask, jsonify, request, make_response
import requests
import secrets
from collections import Counter

app = Flask(__name__)

opendata_url = 'http://data.cityofnewyork.us/resource/erm2-nwe9.json'

@app.route('/')
def home():
	return make_response(open('static/index.html').read())

@app.route('/categories')
def categories():
	zipcode = request.args.get('zipcode')
	parameters = {'$select': 'complaint_type', 'incident_zip': zipcode}
	complaints = requests.get(opendata_url, params=parameters).json()
	complaints = [c['complaint_type'] for c in complaints]

	unique_complaints = list(set(complaints))
	count = dict(Counter(complaints))
	frequency = [{'label': label, 'value': value} for label, value in count.iteritems()]
	return jsonify(categories=unique_complaints, frequency=frequency)

@app.route('/complaints')
def complaints():
	zipcode = request.args.get('zipcode')
	complaint_type = request.args.get('complaint_type')
	parameters = {
		'$select': 'latitude,longitude',
		'incident_zip': zipcode,
		'complaint_type': complaint_type
	}
	complaints = requests.get(opendata_url, params=parameters).json()

	locations = [(c['latitude'], c['longitude']) for c in complaints if 'latitude' in c]

	return jsonify(locations=locations)

@app.route('/username')
def username():
	return secrets.USERNAME