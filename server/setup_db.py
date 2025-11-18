import sqlite3
import os

DB_NAME = "library.db"

def create_tables(cursor):
    # 1. Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Users (
        UserID INTEGER PRIMARY KEY AUTOINCREMENT,
        Username TEXT UNIQUE NOT NULL,
        Email TEXT UNIQUE NOT NULL,
        PasswordHash TEXT NOT NULL,
        FirstName TEXT,
        LastName TEXT,
        MemberType TEXT, -- 'Student' or 'Faculty'
        AccountStatus TEXT NOT NULL DEFAULT 'Active'
    );
    """)

    # 2. ItemTypes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ItemTypes (
        ItemTypeID INTEGER PRIMARY KEY AUTOINCREMENT,
        TypeName TEXT UNIQUE NOT NULL,
        DefaultLoanPeriodDays INTEGER NOT NULL
    );
    """)

    # 3. Items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Items (
        ItemID INTEGER PRIMARY KEY AUTOINCREMENT,
        ItemTypeID INTEGER NOT NULL,
        Title TEXT NOT NULL,
        Author TEXT,
        ISBN TEXT UNIQUE,
        PublicationDate TEXT,
        Status TEXT NOT NULL DEFAULT 'Available',
        FOREIGN KEY (ItemTypeID) REFERENCES ItemTypes(ItemTypeID)
    );
    """)

    # 4. Loans
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Loans (
        LoanID INTEGER PRIMARY KEY AUTOINCREMENT,
        UserID INTEGER NOT NULL,
        ItemID INTEGER NOT NULL,
        CheckoutDate TEXT NOT NULL,
        DueDate TEXT NOT NULL,
        ReturnDate TEXT,
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
        FOREIGN KEY (ItemID) REFERENCES Items(ItemID)
    );
    """)

    # 5. Fines
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Fines (
        FineID INTEGER PRIMARY KEY AUTOINCREMENT,
        LoanID INTEGER NOT NULL,
        Amount REAL NOT NULL,
        DateIssued TEXT NOT NULL,
        Status TEXT NOT NULL DEFAULT 'Pending',
        FOREIGN KEY (LoanID) REFERENCES Loans(LoanID)
    );
    """)

def seed_data(cursor):
    print("Seeding data...")
    
    # 1. Insert values into Users table 
    users = [
        ('john_doe', 'john@uni.edu', 'hash123', 'John', 'Doe', 'Student', 'Active'),
        ('jane_smith', 'jane@uni.edu', 'hash456', 'Jane', 'Smith', 'Faculty', 'Active'),
        ('mike_brown', 'mike@uni.edu', 'hash789', 'Mike', 'Brown', 'Student', 'Suspended'),
        ('sarah_j', 'sarah@uni.edu', 'hash101', 'Sarah', 'Jones', 'Student', 'Active'),
        ('prof_davis', 'davis@uni.edu', 'hash202', 'Alan', 'Davis', 'Faculty', 'Active'),
        ('emily_w', 'emily@uni.edu', 'hash303', 'Emily', 'White', 'Student', 'Active'),
        ('chris_p', 'chris@uni.edu', 'hash404', 'Chris', 'Paul', 'Student', 'Active'),
        ('lisa_m', 'lisa@uni.edu', 'hash505', 'Lisa', 'Miller', 'Faculty', 'Active'),
        ('tom_h', 'tom@uni.edu', 'hash606', 'Tom', 'Hanks', 'Student', 'Active'),
        ('admin_user', 'admin@uni.edu', 'adminpass', 'Admin', 'User', 'Staff', 'Active')
    ]
    cursor.executemany("INSERT OR IGNORE INTO Users (Username, Email, PasswordHash, FirstName, LastName, MemberType, AccountStatus) VALUES (?,?,?,?,?,?,?)", users)

    # 2. Insert values into ItemTypes table
    types = [
        ('Course Textbook', 120),
        ('Fiction Novel', 14),
        ('Journal', 7),
        ('Ebook', 30),
        ('Reference Book', 3),
        ('Magazine', 7), 
        ('DVD', 3), 
        ('Audiobook', 14), 
        ('Thesis', 14), 
        ('Map', 1)
    ]
    cursor.executemany("INSERT OR IGNORE INTO ItemTypes (TypeName, DefaultLoanPeriodDays) VALUES (?,?)", types)

    # 3. Insert values into Items table
    items = [
        (1, 'Database Systems', 'Navathe', '978-013397558', '2016-01-01', 'Available'),
        (1, 'Intro to Algorithms', 'Cormen', '978-026203384', '2009-01-01', 'On Loan'),
        (2, 'The Great Gatsby', 'Fitzgerald', '978-074327356', '1925-04-10', 'Available'),
        (2, '1984', 'Orwell', '978-045152493', '1949-06-08', 'On Loan'),
        (3, 'Nature Journal Vol 1', 'Nature', 'N/A', '2023-01-01', 'Available'),
        (4, 'Clean Code Ebook', 'Robert Martin', '978-013235088', '2008-08-01', 'Available'),
        (1, 'Operating Systems', 'Silberschatz', '978-111806333', '2012-01-01', 'In-Repair'),
        (2, 'Harry Potter 1', 'Rowling', '978-059035342', '1997-06-26', 'On Loan'),
        (5, 'Oxford Dictionary', 'Oxford', '978-019957112', '2010-01-01', 'Available'),
        (1, 'Computer Networks', 'Tanenbaum', '978-013212695', '2010-01-01', 'Available')
    ]
    cursor.executemany("INSERT OR IGNORE INTO Items (ItemTypeID, Title, Author, ISBN, PublicationDate, Status) VALUES (?,?,?,?,?,?)", items)

    # 4. Insert values into Loans table
    loans = [
        (1, 2, '2023-10-01', '2023-12-30', '2023-10-15'), # Returned
        (2, 4, '2023-11-01', '2023-11-15', None), # Still out
        (3, 7, '2023-09-01', '2023-12-30', '2023-09-05'), # Returned
        (4, 8, '2023-11-05', '2023-11-19', None), # Still out
        (1, 1, '2023-08-01', '2023-12-30', '2023-08-10'), # Returned
        (6, 2, '2023-11-10', '2024-03-10', None), # Still out
        (7, 3, '2023-10-05', '2023-10-19', '2023-10-18'), # Returned
        (8, 9, '2023-11-01', '2023-11-04', '2023-11-03'), # Returned
        (9, 5, '2023-09-20', '2023-09-27', '2023-09-25'), # Returned
        (5, 6, '2023-10-01', '2023-10-31', '2023-10-15')  # Returned
    ]
    cursor.executemany("INSERT OR IGNORE INTO Loans (UserID, ItemID, CheckoutDate, DueDate, ReturnDate) VALUES (?,?,?,?,?)", loans)

    # 5. Insert values into Fines table
    fines = [
        (1, 5.00, '2023-10-16', 'Paid'),
        (2, 10.00, '2023-11-16', 'Pending'),
        (3, 2.50, '2023-09-06', 'Paid'),
        (4, 15.00, '2023-11-20', 'Pending'),
        (5, 0.00, '2023-08-10', 'Paid'), # No fine actually
        (6, 50.00, '2023-11-12', 'Pending'), # Damaged book fee
        (7, 1.00, '2023-10-19', 'Paid'),
        (8, 2.00, '2023-11-05', 'Paid'),
        (9, 5.00, '2023-09-28', 'Paid'),
        (10, 0.00, '2023-10-16', 'Paid')
    ]
    cursor.executemany("INSERT OR IGNORE INTO Fines (LoanID, Amount, DateIssued, Status) VALUES (?,?,?,?)", fines)

def main():
    # Remove old DB if exists so we start fresh
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    create_tables(cursor)
    seed_data(cursor)
    
    conn.commit()
    conn.close()
    print(f"Database {DB_NAME} created and populated successfully.")

if __name__ == "__main__":
    main()