from flask import Flask,jsonify,request
from flask_cors import CORS
from datetime import datetime,timedelta
import sqlite3
import random

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
                    L.UserID,
                    I.ItemID,
                    I.Title,
                    I.Author,
                    T.TypeName,
                    L.CheckoutDate,
                    L.DueDate,
                    L.ReturnDate,
                    F.Amount,
                    F.Status 
                FROM Loans L
                JOIN Items I ON L.ItemID = I.ItemID
                JOIN ItemTypes T ON I.ItemTypeID = T.ItemTypeID
                LEFT JOIN Fines F ON L.LoanID = F.LoanID
                WHERE L.UserID = ? AND (L.ReturnDate IS NULL OR F.Status = "Pending")
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
                    L.UserID,
                    I.ItemID,
                    L.LoanID,
                    I.Title,
                    I.Author,
                    T.TypeName,
                    L.CheckoutDate,
                    L.DueDate,
                    L.ReturnDate,
                    F.Amount,
                    F.Status                             
                FROM Loans L
                JOIN Items I ON L.ItemID = I.ItemID
                JOIN ItemTypes T ON I.ItemTypeID = T.ItemTypeID
                LEFT JOIN Fines F ON L.LoanID = F.LoanID
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
    item_id = data.get("item_id")
    current_date = datetime.today().strftime('%Y-%m-%d')
    
   
    try:

        if command == "Return":
            update = conn.execute("""
                                  UPDATE Loans
                                  SET ReturnDate = ?
                                  WHERE LoanID = ?
                                  
                                  """,(current_date,loan_id))
            if item_id:
                conn.execute("UPDATE Items SET Status = 'Available' WHERE ItemID = ?", (item_id,))
                conn.execute("UPDATE Fines SET Status = 'Paid' WHERE LoanID = ?", (loan_id,))

            conn.commit()
            return jsonify({"status": "success", "returned_date": current_date})
        return jsonify({"status": "error", "message": "Invalid command"}), 400
    except sqlite3.OperationalError as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database query failed"}), 500
    finally:
        conn.close()

@app.route("/api/catalogue", methods=["GET"])
def available_books():
    conn = db_connection()
    try:
        books = conn.execute("""
                            SELECT I.ItemID, I.Title, I.Author, T.TypeName, T.DefaultLoanPeriodDays 
                            FROM Items I
                            JOIN ItemTypes T ON I.ItemTypeID = T.ItemTypeID
                            WHERE I.Status = 'Available'
                    """).fetchall()
        books_list = [dict(row) for row in books]
        #print("I reached here")
        #print(f"books_list:{books_list}")
        return jsonify(books_list)
        
    
    except sqlite3.OperationalError as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database query failed"}), 500
    finally:
        conn.close()

@app.route("/api/checkout", methods=['POST'])
def checkout():
    data = request.get_json()
    user_id = data.get('user_id')
    item_id = data.get('item_id')
    loan_id = data.get('loan_id')

    default_loan_period = int(data.get("default_period"))

    if default_loan_period>30:
        fine = random.randint(10, 30)
    else:
        fine = random.randint(0,10)
    
    today = datetime.now().strftime('%Y-%m-%d')
    due_date = (datetime.now() + timedelta(days=int(default_loan_period))).strftime('%Y-%m-%d') 

    conn = db_connection()
    try:
        cursor = conn.execute("INSERT INTO Loans (UserID, ItemID, CheckoutDate, DueDate) VALUES (?, ?, ?, ?)",
                     (user_id, item_id, today, due_date))
        new_loan_id = cursor.lastrowid
        
        conn.execute("UPDATE Items SET Status = 'On Loan' WHERE ItemID = ?", (item_id,))

        conn.execute("INSERT INTO Fines (LoanID, Amount, DateIssued, Status) VALUES (?, ?, ?, ?)", 
                     (new_loan_id, fine, today, 'Pending'))
        
        conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()


@app.route("/api/books/<int:item_id>", methods=['DELETE'])
def delete_book(item_id):
    conn = db_connection()
    try:

        status = conn.execute("SELECT Status FROM Items WHERE ItemID = ?", (item_id,)).fetchone()
        if status and status['Status'] == 'On Loan':
            return jsonify({"status": "error", "message": "Cannot delete book while it is on loan."}), 400

        conn.execute("DELETE FROM Items WHERE ItemID = ?", (item_id,))
        conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route("/api/stats", methods=['GET'])
def book_chart():
    conn = db_connection()
    try:

        status = conn.execute("""SELECT Status, COUNT(ItemID) as Count
                                 FROM Items 
                                 GROUP BY Status""").fetchall()
        conn.commit()
        stats_list = [{"label":row["Status"], "value":row["Count"]} for row in status]
        return jsonify(stats_list)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=5000)