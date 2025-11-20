from flask import Flask,jsonify,request
from flask_cors import CORS
from datetime import datetime
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
    
@app.route("/api/my_loans/<int:user_id>", methods=["GET"])
def my_loans(user_id):
    conn = db_connection()
    user = conn.execute("SELECT Username from Users WHERE UserID = ?",(user_id,)).fetchone()
    username = user['Username']
    if(username!="admin_user"):

        try:
            loans = conn.execute("""
                SELECT
                    I.Title,
                    I.Author,
                    T.TypeName,
                    L.CheckoutDate,
                    L.DueDate
                    L.ReturnDate 
                FROM Loans L
                JOIN Items I ON L.ItemID = I.ItemID
                JOIN ItemTypes T ON I.ItemTypeID = T.ItemTypeID
                WHERE L.UserID = ? AND L.ReturnDate IS NULL
                ORDER BY L.DueDate ASC
            """, (user_id,)).fetchall()
            
            loans_list = [dict(row) for row in loans]
            
            return jsonify(loans_list)

        except sqlite3.OperationalError as e:
            print(f"Database error: {e}")
            return jsonify({"error": "Database query failed"}), 500
        finally:
            conn.close()
    else:
        try:
            loans = conn.execute("""
                SELECT
                    L.LoanID,
                    I.Title,
                    I.Author,
                    T.TypeName,
                    L.CheckoutDate,
                    L.DueDate,
                    L.ReturnDate                
                FROM Loans L
                JOIN Items I ON L.ItemID = I.ItemID
                JOIN ItemTypes T ON I.ItemTypeID = T.ItemTypeID
                ORDER BY L.DueDate ASC
            """)
            
            loans_list = [dict(row) for row in loans]
            
            return jsonify(loans_list)

        except sqlite3.OperationalError as e:
            print(f"Database error: {e}")
            return jsonify({"error": "Database query failed"}), 500
        finally:
            conn.close()

@app.route("/api/CRUD/admin_user",methods=['POST'])
def CRUD():
    data = request.get_json()
    if not data:
        return jsonify({"status":"error","message":"No data provided"}),400
    conn = db_connection()
    #data = request.get("data_changes")
    command = data.get("command")
    loan_id = data.get("loan_id")
    current_date = datetime.today().strftime('%Y-%m-%d')
    
   
    try:

        if command == "UPDATE":
            update = conn.execute("""
                                  UPDATE Loans
                                  SET ReturnDate = ?
                                  WHERE LoanID = ?
                                  
                                  """,(current_date,loan_id))
            conn.commit()
            if update.rowcount == 0:
                return jsonify({"status":"error","message":"LoanID invalid or Already returned Book","returned_date": current_date}),404
            return jsonify({"status":"success","message":"Return Date Has been updated"})
    except sqlite3.OperationalError as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database query failed"}), 500
    finally:
        conn.close()

    

if __name__ == '__main__':
    app.run(debug=True, port=5000)