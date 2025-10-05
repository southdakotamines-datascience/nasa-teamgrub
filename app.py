from flask import Flask, send_from_directory, jsonify, request
from dotenv import load_dotenv
from datetime import datetime, timedelta
from python.meteor_calculator import find_positions
from math import pi, sin, radians
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

@app.route('/api/neos/<string:neo_id>/positions')
def get_neo_positions(neo_id):
    if not NASA_API_KEY:
        return jsonify({"error": "NASA API key not found."}), 500

    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    resolution = int(request.args.get('resolution', 1000))

    if not start_date_str or not end_date_str:
        return jsonify({"error": "start_date and end_date are required in YYYY-MM-DD format."}), 400

    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    # Fetch NEO data by ID
    api_url = f"https://api.nasa.gov/neo/rest/v1/neo/{neo_id}?api_key={NASA_API_KEY}"
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        neo_data = response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return jsonify({"error": f"Near Earth Object with ID '{neo_id}' not found."}), 404
        return jsonify({"error": f"Failed to retrieve data from NASA API: {e}"}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to retrieve data from NASA API: {e}"}), 500

    orbital_data = neo_data.get("orbital_data")
    if not orbital_data:
        return jsonify({"error": "Orbital data not found for this NEO."}), 404

    positions = find_positions(orbital_data, start_date, end_date, resolution)
    return jsonify({"neo_id": neo_id, "positions": positions})

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


# ***********************************************************************************************************
@app.route('/impact')
def impact_page():
    # serves /static/impact.html
    return send_from_directory('static', 'impact.html')

def mass_from_diameter(diameter_m: float, density_kg_m3: float) -> float:
    # sphere volume * density
    return density_kg_m3 * (4.0/3.0) * pi * (diameter_m/2.0)**3

@app.post('/api/impact')
def impact_api():
    p = request.get_json(force=True)
    try:
        d = float(p["diameter_m"])
        rho = float(p["density_kg_m3"])
        v = float(p["velocity_m_s"])
        ang = float(p["angle_deg"])
        lat = float(p["lat"])
        lon = float(p["lon"])
    except (KeyError, ValueError):
        return jsonify({"error":"Bad inputs. Required: lat, lon, diameter_m, density_kg_m3, velocity_m_s, angle_deg"}), 400

    ang = max(1.0, min(89.0, ang))
    m = mass_from_diameter(d, rho)
    E_total = 0.5 * m * v**2

    # Toy atmospheric loss model (tunable)
    L_base = 0.4
    L = max(0.0, min(0.95, L_base / sin(radians(ang))))
    E_atm_loss = E_total * L
    E_ground = E_total - E_atm_loss

    return jsonify({
        "lat": lat, "lon": lon,
        "mass_kg": m,
        "E_total": E_total,
        "E_atm_loss": E_atm_loss,
        "E_ground": E_ground,
        "assumptions": {
            "density_kg_m3": rho,
            "angle_deg": ang,
            "loss_model": "L = clamp(L_base/sin(angle),0..0.95), L_base=0.4"
        }
    })
# ***********************************************************************************************************



if __name__ == '__main__':
    app.run(debug=True)
