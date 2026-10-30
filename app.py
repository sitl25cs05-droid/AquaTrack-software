from flask import Flask, render_template, jsonify, request
import sqlite3, random
from datetime import datetime
app=Flask(__name__); DB="aquatrack.db"
def db():
 c=sqlite3.connect(DB); c.row_factory=sqlite3.Row; return c
def classify(t,vib,ac):
 return ("SUSPECTED LEAK" if vib>=.75 or ac>=65 else "NORMAL",
         "WATER QUALITY WARNING" if t>=500 else "NORMAL")
def save(d):
 t=float(d.get("tds",320)); u=float(d.get("turbidity",1.8)); v=float(d.get("vibration",.12)); a=float(d.get("acoustic",32))
 leak,water=classify(t,v,a); now=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
 with db() as c:
  c.execute("INSERT INTO readings(device_id,tds,turbidity,vibration,acoustic,leak_status,water_status,created_at) VALUES(?,?,?,?,?,?,?,?)",("AT-01",t,u,v,a,leak,water,now))
  if leak!="NORMAL": c.execute("INSERT INTO alerts(category,message,severity,created_at) VALUES(?,?,?,?)",("Leak","Abnormal vibration/acoustic reading. Inspect pipeline.","Warning",now))
  if water!="NORMAL" or u>=5: c.execute("INSERT INTO alerts(category,message,severity,created_at) VALUES(?,?,?,?)",("Water quality","TDS/turbidity crossed a demo threshold. Further testing required.","Warning",now))
 return dict(device_id="AT-01",tds=t,turbidity=u,vibration=v,acoustic=a,leak_status=leak,water_status=water,created_at=now)
def init():
 with db() as c:
  c.execute("CREATE TABLE IF NOT EXISTS readings(id INTEGER PRIMARY KEY,device_id TEXT,tds REAL,turbidity REAL,vibration REAL,acoustic REAL,leak_status TEXT,water_status TEXT,created_at TEXT)")
  c.execute("CREATE TABLE IF NOT EXISTS alerts(id INTEGER PRIMARY KEY,category TEXT,message TEXT,severity TEXT,created_at TEXT)")
  if c.execute("SELECT COUNT(*) FROM readings").fetchone()[0]==0:
   for _ in range(3): 
    now=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute("INSERT INTO readings(device_id,tds,turbidity,vibration,acoustic,leak_status,water_status,created_at) VALUES(?,?,?,?,?,?,?,?)",("AT-01",320,1.8,.12,32,"NORMAL","NORMAL",now))
@app.route("/")
def home(): return render_template("index.html")
@app.get("/api/health")
def health(): return jsonify(ok=True,service="AquaTrack Flask API")
@app.get("/api/status")
def status():
 with db() as c: r=c.execute("SELECT * FROM readings ORDER BY id DESC LIMIT 1").fetchone()
 return jsonify(server="online",device_status="SIMULATED DEVICE",latest=dict(r) if r else None)
@app.get("/api/readings")
def readings():
 with db() as c: rows=c.execute("SELECT * FROM readings ORDER BY id DESC LIMIT 25").fetchall()
 return jsonify([dict(x) for x in rows][::-1])
@app.get("/api/alerts")
def alerts():
 with db() as c: rows=c.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT 20").fetchall()
 return jsonify([dict(x) for x in rows])
@app.post("/api/readings")
def receive():
 try: return jsonify(success=True,reading=save(request.get_json(force=True))),201
 except Exception as e: return jsonify(success=False,error=str(e)),400
@app.post("/api/simulate")
def simulate():
 s=(request.get_json(silent=True) or {}).get("scenario","normal")
 d=({"tds":321,"turbidity":1.9,"vibration":.92,"acoustic":74} if s=="leak" else
    {"tds":620,"turbidity":7.2,"vibration":.13,"acoustic":33} if s=="quality" else
    {"tds":random.randint(310,330),"turbidity":round(random.uniform(1.5,2.2),1),"vibration":round(random.uniform(.08,.2),2),"acoustic":random.randint(28,38)})
 return jsonify(success=True,scenario=s,reading=save(d))
if __name__=="__main__":
 init(); print("AquaTrack Flask API running at http://127.0.0.1:5000"); app.run(host="127.0.0.1",port=5000)
