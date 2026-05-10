from flask import Flask, request, jsonify
import joblib
from flask_cors import CORS
from flask import send_from_directory
import os

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(app)

model = joblib.load("risk_model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    gpa = float(data["gpa"])
    attendance = float(data["attendance"])

    prediction = model.predict([[gpa, attendance]])

    if prediction[0] == 0:
        risk = "SAFE"
    else:
        risk = "AT RISK"

    return jsonify({"risk": risk})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":

    app.run(port=5001, debug=True)