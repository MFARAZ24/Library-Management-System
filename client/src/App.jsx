import React,{ useState,useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:5000/api'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


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
    } else{
      setError('Login failed: ', response.daat.message)
    }}
    catch (err) {
      setError('Invalid username or password. Check console for  details')
      console.error("Login API Error:",err)
    }
    finally{
      setLoading(false)
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
        <button onClick={() => setUser(null)} style={styles.logoutButton}>
          Log Out
        </button>
      </div>

      <p style={{fontSize: '1.2em', color: '#007bff'}}>
        User authentication successful. This view is now protected.
      </p>
      
      <p style={{marginTop: '20px', color: '#ebe8e8ff'}}>
        
      </p>
      
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
};
export default App
