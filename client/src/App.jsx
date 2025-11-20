import React,{ useState,useEffect } from 'react'
import './App.css'
import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:5000/api'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState(null)
  const [loans,setLoans] = useState([])
  const [books, setBooks] = useState([])


  useEffect(() => {
  const loggedInUser = localStorage.getItem("user");
  const loggedInUserId = localStorage.getItem("userId");
  
  if (loggedInUser && loggedInUserId) {
    setUser(loggedInUser);
    setUserId(loggedInUserId);
    setUsername(loggedInUser);
  }
}, []);

  useEffect(() => {
    if (userId) {
        fetchLoans();
        fetchCatalog(); 
    }
  }, [userId])
  
  const fetchLoans = () => {
    axios.get(`${API_BASE_URL}/my_loans/${userId}`)
         .then(res => setLoans(res.data))
         .catch(err => console.error(err));
  }

  const fetchCatalog = () => {
      axios.get(`${API_BASE_URL}/catalogue`)
        .then(res => setBooks(res.data))
        .catch(err => console.error("Error fetching catalog:", err));
  }
  
  
  const handleLogin = async(e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
  
    try{
      const response = await axios.post(`${API_BASE_URL}/login`,{
        username: username,
        password: password,
      })
    if (response.data.status == 'success'){
      setUser(response.data.username)
      setUserId(response.data.user_id)
      localStorage.setItem("user", response.data.username);
      localStorage.setItem("userId", response.data.user_id);
    } else{
      setError('Login failed: ', response.data.message)
    }}
    catch (err) {
      setError('Invalid username or password. Check console for  details')
      console.error("Login API Error:",err)
    }
    finally{
      setLoading(false)
    }
  }

  const handleLogout = () =>{
    setUser(null)
    setUserId(null)
    setLoans([])
    setUsername('')
    setBooks([])
    setPassword('')
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
  }


  const updateReturn = async(loan_id,command,item_id) =>{
    setError('')  
    try{
      const response = await axios.post(`${API_BASE_URL}/CRUD/admin_user`,{
        command: command,
        loan_id: loan_id,
        item_id: item_id
      })
    if (response.data.status == 'success'){
      alert("Book returned!")
      const newDate = response.data.current_date;
      setLoans(prevLoans => prevLoans.map(loan => {
            if (loan.LoanID === loan_id) {
                return { ...loan, ReturnDate: newDate };
            }
            return loan;
        }))
        fetchCatalog();
        fetchLoans();
      }else{
            setError(`Update failed:${response.data.message}`)
          }
        }
        catch (err) {
          setError('Update Failed. Check the console.')
          console.error("Update API Error:",err)
        }
      }

  const handleBorrow = async(item_id,default_period) => {
      try {
          const res = await axios.post(`${API_BASE_URL}/checkout`, { user_id: userId, item_id: item_id,default_period:default_period});
          if (res.data.status === 'success') {
              alert("Book Borrowed Successfully!");
              fetchLoans(); 
              fetchCatalog(); 
          }
      } catch (err) { alert("Checkout failed") }
  }


  const handleDeleteBook = async(item_id) => {
      if(!confirm("Are you sure you want to delete this book?")) return;
      try {
          const res = await axios.delete(`${API_BASE_URL}/books/${item_id}`);
          if (res.data.status === 'success') {
              alert("Book Deleted!");
              fetchCatalog();
              //if (username === 'admin_user') fetchStats();
          }
      } catch (err) { 
          alert(err.response?.data?.message || "Delete failed");
      }
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <h1 style={styles.header}>Library System Login</h1>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            disabled={loading}
            required
          />
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={loading}
            required
          />
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p style={{marginTop: '10px', color: '#666'}}>Hint: Use <b>john_doe</b> and <b>hash123</b></p>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  }
  
  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.dashboardHeader}>
        <h1 style={styles.header}>Welcome, {user}!</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Log Out
        </button>
      </div>
      {username!=="admin_user" ? (
        <><p style={{ fontSize: '1.2em', color: '#007bff' }}>
          Your Active Rental.
        </p><div style={{ marginTop: '20px' }}>
            {loans.length === 0 ? (
              <p style={{ color: '#f5f1f1ff' }}>No items currently checked out.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Title</th> 
                    <th style={styles.th}>Author</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Due Date</th>
                    <th style={styles.th}>Return Date</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Amount Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{loan.Title}</td>
                      <td style={styles.td}>{loan.Author}</td>
                      <td style={styles.td}>{loan.TypeName}</td>
                      <td style={styles.td}>{loan.DueDate}</td>
                      <td style={styles.td}>{loan.ReturnDate}</td>
                      <td style={styles.td}>{loan.Amount}</td>
                      <td style={styles.td}>{loan.Status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
            <p style={{ fontSize: '1.2em', color: '#007bff', marginTop: '40px' }}>Available Books</p>
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {books.length === 0 ? <p style={{ color: '#666' }}>No books available.</p> : (
                    books.map((book, i) => (
                        <div key={i} style={styles.bookCard}>
                            <h4 style={{margin: '0 0 10px 0'}}>{book.Title}</h4>
                            <p style={{fontSize: '0.9em', color: '#666'}}>{book.Author}</p>
                            <p style={{fontSize: '0.8em'}}>{book.TypeName}</p>
                            <button onClick={() => handleBorrow(book.ItemID,book.DefaultLoanPeriodDays)} style={styles.updateButton}>Borrow</button>
                        </div>
                    ))
                )}
            </div>
           
           
          </>
            ):(
        // --- ADMIN VIEW ---
        <>
            <p style={{ fontSize: '1.2em', color: '#007bff' }}>Total Active Rentals</p>
            <div style={{ marginTop: '20px' }}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Title</th>
                            <th style={styles.th}>Author</th>
                            <th style={styles.th}>Type</th>
                            <th style={styles.th}>Due Date</th>
                            <th style={styles.th}>Return Date</th>
                            <th style={styles.th}>Amount</th>
                            <th style={styles.th}>Amount Status</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.map((loan, i) => (
                            <tr key={i}>
                                <td style={styles.td}>{loan.Title}</td>
                                <td style={styles.td}>{loan.Author}</td>
                                <td style={styles.td}>{loan.TypeName}</td>
                                <td style={styles.td}>{loan.DueDate}</td>
                                <td style={styles.td}>
                                          {loan.ReturnDate ? (
                                              <span style={{color: 'green', fontWeight: 'bold'}}>{loan.ReturnDate}</span>
                                          ) : (
                                              <span style={{color: '#d9534f'}}>Pending</span>
                                          )}
                                </td>
                                <td style={styles.td}>{loan.Amount}</td>
                                <td style={{...styles.td, color: loan.Status === 'Paid' ? 'green' : 'red'}}>
                                    {loan.Status}
                                </td>
                                <td style={styles.td}>
                                  {!loan.ReturnDate ? (
                                      <button 
                                        onClick={() => updateReturn(loan.LoanID, "Return",loan.ItemID)} 
                                        style={styles.updateButton}
                                      >
                                        Return
                                      </button>
                                  ) : (
                                      <span style={{color: '#888'}}>Locked</span>
                                  )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ADMIN DELETE BOOKS */}
            <p style={{ fontSize: '1.2em', color: '#d9534f', marginTop: '40px' }}>Manage Inventory (Delete Books)</p>
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {books.map((book, i) => (
                    <div key={i} style={styles.bookCard}>
                        <h4 style={{margin: '0 0 10px 0'}}>{book.Title}</h4>
                        <p style={{fontSize: '0.9em', color: '#666'}}>{book.Author}</p>
                        <button onClick={() => handleDeleteBook(book.ItemID)} style={{...styles.updateButton, backgroundColor: '#d9534f'}}>Delete</button>
                    </div>
                ))}
            </div>
        </>
      )}
    </div>
  );
}
// Simple inline styles for better visuals
const styles = {

  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '30px',
    boxShadow: '0 4px 8px rgba(255, 243, 243, 0.1)',
    borderRadius: '10px',
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
  header: {
    color: '#ffffffff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  button: {
    padding: '12px 20px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  error: {
    color: 'red',
    marginTop: '15px',
  },
  dashboardContainer: {
    padding: '30px',
    fontFamily: 'sans-serif',
  },
  dashboardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
    marginBottom: '20px',
  },
  logoutButton: {
    padding: '8px 15px',
    borderRadius: '5px',
    border: '1px solid #6c3838ff',
    backgroundColor: '#007bff',
    cursor: 'pointer',
  },
  updateButton: {
    padding: '8px 15px',
    borderRadius: '5px',
    border: '1px solid #6c3838ff',
    backgroundColor: '#007bff',
    cursor: 'pointer',
  },
  bookCard: { 
    border: '1px solid #eee', 
    padding: '15px', 
    borderRadius: '8px', 
    textAlign: 'center', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }
}
export default App;