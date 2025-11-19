from flask import Flask,jsonify,request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
app.secret_key = "faraz"
CORS(app)

DB_NAME = "library.db"

def db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

@app.route("/api/login",methods=["POST"])

def login():
    data=request.get_json()
    if not data:
        return jsonify({"status":"error","message":"No data provided"}),400
    username = data.get('username')
    password = data.get('password')

    conn = db_connection()
    user = conn.execute('SELECT * from Users WHERE Username = ?',(username,)).fetchone()
    conn.close()

    if user and user['PasswordHash'] == password:
        return jsonify({"status":"success","user_id":user['UserID'],"username":user['Username']})
    else:
        return jsonify({"status":"error","message":"Invalid credentials"}),401
    
if __name__ == '__main__':
    app.run(debug=True, port=5000)