from flask import Flask, send_from_directory
from dotenv import load_dotenv
import os

load_dotenv()
NASA_API_KEY = os.getenv("NASA_API_KEY")

app = Flask(__name__, static_folder='static')

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


if __name__ == '__main__':
    app.run(debug=True)
