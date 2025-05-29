// Register.js
import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidate');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:8000/api/register', {
        name,
        email,
        password,
        role,
      });

      if (response.status === 201) {
        // Redirection après l'inscription
        window.location.href = '/'; // Remplacez par votre route de connexion
      }
    } catch (error) {
      setError(error.response?.data.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <h2>Inscription</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" required />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" required />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="candidate">Étudiant</option>
        <option value="school">École</option>
        <option value="admin">Administrateur</option>
      </select>
      <button type="submit">S'inscrire</button>
    </form>
  );
};

export default Register;
