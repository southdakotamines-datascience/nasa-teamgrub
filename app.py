from flask import Flask, send_from_directory, jsonify
from dotenv import load_dotenv
import os
import requests

load_dotenv(override=True)
NASA_API_KEY = os.getenv("NASA_API_KEY")

app = Flask(__name__, static_folder='static')

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/neos')
def get_neos():
    if not NASA_API_KEY:
        return jsonify({"error": "NASA API key not found."}), 500

    api_url = f"https://api.nasa.gov/neo/rest/v1/feed/today?api_key={NASA_API_KEY}"

    try:
        response = requests.get(api_url)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
        neo_data = response.json()
        return jsonify(neo_data)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to retrieve data from NASA API: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
