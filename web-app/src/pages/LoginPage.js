import React, { useState } from 'react';
import axiosInstance from '../api/axiosConfig';
// import './LoginPage.css'; // Si vous utilisez un fichier CSS externe

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    try {
      const response = await axiosInstance.post('/token', formData);
      // On passe l'objet de réponse entier (qui contient token ET rôle)
      onLoginSuccess(response.data); 
    } catch (err) {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  // Le JSX utilise le style en ligne (CSS-in-JS)
  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginBox}>
        <div style={styles.logoText}>SOURCE DU PAYS</div>
        <h2 style={styles.h2}>Portail de connexion</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Adresse Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input}/>
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Mot de passe</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input}/>
          </div>
          {error && <p style={styles.errorMessage}>{error}</p>}
          <button type="submit" style={styles.loginButton} disabled={isLoading}>
            {isLoading ? 'Connexion...' : 'Se Connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

// L'objet de style
const styles = {
  loginContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' },
  loginBox: { backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' },
  logoText: { fontSize: '28px', fontWeight: 'bold', color: '#005A9C', marginBottom: '25px', letterSpacing: '1px', borderBottom: '3px solid #00BFFF', paddingBottom: '10px' },
  h2: { marginTop: 0, marginBottom: '25px', color: '#333', fontWeight: 600 },
  inputGroup: { marginBottom: '20px', textAlign: 'left' },
  label: { display: 'block', marginBottom: '8px', fontWeight: 500, color: '#555' },
  input: { width: '100%', padding: '12px 15px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
  errorMessage: { color: '#dc3545', marginBottom: '15px', fontSize: '14px' },
  loginButton: { width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', color: '#ffffff', backgroundColor: '#007bff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};

export default LoginPage;