// Login.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post('http://localhost:8000/api/login', {
        email,
        password,
      });
  
      console.log(response.data); // Affiche la réponse pour confirmation
  
      if (response.status === 200) {
        localStorage.setItem('token', response.data.token); // Assurez-vous que le token est bien généré par le backend si nécessaire
        const userRole = response.data.user.role; // Accéder au rôle dans l'objet utilisateur
  
        // Rediriger selon le rôle de l'utilisateur
        if (userRole === 'admin') {
          window.location.href = '/admin-dashboard';
        } else if (userRole === 'school') {
          window.location.href = '/school-dashboard';
        } else if (userRole === 'candidate') {
          window.location.href = '/student-dashboard';
        }
      }
    } catch (error) {
      setError(error.response?.data.message || 'Erreur lors de la connexion');
    }
  };
  

  return (
    <form onSubmit={handleLogin}>
      <h2>Connexion</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" required />
      <li><Link to="/inscription">Inscription</Link></li>

      <button type="submit">Se connecter</button>
    </form>
  );
};

export default Login;
