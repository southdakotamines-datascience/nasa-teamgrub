from flask import Flask, send_from_directory, jsonify, request
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import requests

load_dotenv(override=True)
NASA_API_KEY = os.getenv("NASA_API_KEY")

app = Flask(__name__, static_folder='static')
MAX_NEOS = 100  # Maximum number of NEOs to return in date range queries

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


from flask import Flask, send_from_directory, jsonify, request
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import requests

# ... (other code remains unchanged)

@app.route('/api/neos/range')
def get_neos_by_date_range():
    if not NASA_API_KEY:
        return jsonify({"error": "NASA API key not found."}), 500

    center_date_str = request.args.get('center_date')
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    if center_date_str:
        try:
            center_date = datetime.strptime(center_date_str, "%Y-%m-%d")
        except ValueError:
            return jsonify({"error": "Invalid center_date format. Use YYYY-MM-DD."}), 400
        start_date = center_date - timedelta(days=3)
        end_date = center_date + timedelta(days=3)
        api_url = (
            f"https://api.nasa.gov/neo/rest/v1/feed"
            f"?start_date={start_date.strftime('%Y-%m-%d')}"
            f"&end_date={end_date.strftime('%Y-%m-%d')}"
            f"&api_key={NASA_API_KEY}"
        )
        try:
            response = requests.get(api_url)
            response.raise_for_status()
            neo_data = response.json()
            all_neos = []
            for day in neo_data.get('near_earth_objects', {}).values():
                all_neos.extend(day)
            return jsonify({"neos": all_neos, "start_date": start_date.strftime('%Y-%m-%d'), "end_date": end_date.strftime('%Y-%m-%d')})
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"Failed to retrieve data from NASA API: {e}"}), 500

    # Fallback to original batching logic if center_date is not provided
    if not start_date_str or not end_date_str:
        return jsonify({"error": "Please provide either center_date or both start_date and end_date in YYYY-MM-DD format."}), 400

    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    all_neos = []
    current_date = start_date

    while current_date <= end_date and len(all_neos) < MAX_NEOS:
        batch_end = min(current_date + timedelta(days=6), end_date)
        api_url = (
            f"https://api.nasa.gov/neo/rest/v1/feed"
            f"?start_date={current_date.strftime('%Y-%m-%d')}"
            f"&end_date={batch_end.strftime('%Y-%m-%d')}"
            f"&api_key={NASA_API_KEY}"
        )
        try:
            response = requests.get(api_url)
            response.raise_for_status()
            neo_data = response.json()
            for day in neo_data.get('near_earth_objects', {}).values():
                for neo in day:
                    if len(all_neos) < MAX_NEOS:
                        all_neos.append(neo)
                    else:
                        break
            if len(all_neos) >= MAX_NEOS:
                break
        except requests.exceptions.RequestException as e:
            return jsonify({"error": f"Failed to retrieve data from NASA API: {e}"}), 500

        current_date = batch_end + timedelta(days=1)

    return jsonify({"neos": all_neos})


@app.route('/api/neos/<string:neo_id>')
def get_neo_id(neo_id):
    if not NASA_API_KEY:
        return jsonify({"error": "NASA API key not found."}), 500

    api_url = f"https://api.nasa.gov/neo/rest/v1/neo/{neo_id}?api_key={NASA_API_KEY}"

    try:
        response = requests.get(api_url)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx or 5xx)
        neo_data = response.json()
        return jsonify(neo_data)
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return jsonify({"error": f"Near Earth Object with ID '{neo_id}' not found."}), 404
        return jsonify({"error": f"Failed to retrieve data from NASA API: {e}"}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to retrieve data from NASA API: {e}"}), 500
    

@app.route('/api/ehp')
def get_ehp():
    api_url = f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=2.5&limit=100&orderby=time"

    try:
        response = requests.get(api_url)
        response.raise_for_status()
        ehp_data = response.json()
        return jsonify(ehp_data)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to retrieve data from USGS Earthquake API: {e}"}), 500



if __name__ == '__main__':
    app.run(debug=True)
