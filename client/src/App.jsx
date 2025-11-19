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

  useEffect(() => {
    if (userId) {
        axios.get(`${API_BASE_URL}/my_loans/${userId}`)
            .then(response => {
                setLoans(response.data)
            })
            .catch(err => {
                console.error("Error fetching loans:", err)
            })
    }
  }, [userId])
  
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
    setPassword('')
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
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan, index) => (
                    <tr key={index}>
                      <td style={styles.td}>{loan.Title}</td>
                      <td style={styles.td}>{loan.Author}</td>
                      <td style={styles.td}>{loan.TypeName}</td>
                      <td style={styles.td}>{loan.DueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </>
            ):(

              <>
            <p style={{ fontSize: '1.2em', color: '#007bff' }}>
              Total Active Rentals.
            </p>

            <div style={{ marginTop: '20px' }}>
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
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan, index) => (
                      <tr key={index}>
                        <td style={styles.td}>{loan.Title}</td>
                        <td style={styles.td}>{loan.Author}</td>
                        <td style={styles.td}>{loan.TypeName}</td>
                        <td style={styles.td}>{loan.DueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
  }
}
export default App;
