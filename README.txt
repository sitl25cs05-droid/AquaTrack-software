AQUATRACK DEMO — WINDOWS SETUP
IMPORTANT: Software-only demonstration. All readings are simulated. No physical ESP32/sensors are connected.

1. Extract this ZIP to Desktop.
2. Open the AquaTrack_Demo folder.
3. Click the folder address bar, type cmd, press Enter.
4. Run:
   py -m venv venv
   venv\Scripts\activate
   py -m pip install -r requirements.txt
   py app.py
5. Keep the terminal open. Open Chrome:
   http://127.0.0.1:5000

DEMO:
- Normal condition: creates a normal sample.
- Simulate suspected leak: high vibration/acoustic values trigger a demo leak alert.
- Simulate quality warning: high TDS/turbidity values trigger a demo warning.
- Dashboard refreshes and shows records saved in SQLite.

API:
GET  /api/health
GET  /api/status
GET  /api/readings
GET  /api/alerts
POST /api/readings   (accepts JSON: device_id, tds, turbidity, vibration, acoustic)
POST /api/simulate   (scenario: normal, leak, quality)

Thresholds are demonstration rules only, not calibrated leak thresholds or drinking-water safety limits.
