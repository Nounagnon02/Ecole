import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import EcoleSelector from './EcoleSelector';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '', role: '', ecole_id: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { value: 'directeur', label: 'Directeur' },
    { value: 'enseignant', label: 'Enseignant' },
    { value: 'eleve', label: 'Élève' },
    { value: 'parent', label: 'Parent' },
    { value: 'comptable', label: 'Comptable' },
    { value: 'surveillant', label: 'Surveillant' },
    { value: 'censeur', label: 'Censeur' },
    { value: 'infirmier', label: 'Infirmier' },
    { value: 'bibliothecaire', label: 'Bibliothécaire' },
    { value: 'secretaire', label: 'Secrétaire' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!credentials.ecole_id) {
      setError('Veuillez sélectionner une école');
      setLoading(false);
      return;
    }

    // Stocker ecole_id avant la connexion
    localStorage.setItem('ecole_id', credentials.ecole_id);

    const result = await login(credentials);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Connexion</h1>
        {error && <div className="error-message"><AlertCircle size={16} />{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <EcoleSelector 
            selectedEcoleId={credentials.ecole_id}
            onSelect={(ecoleId) => setCredentials({...credentials, ecole_id: ecoleId})}
          />

          <div className="form-group">
            <label>Email</label>
            <div className="input-with-icon">
              <User size={20} />
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <div className="input-with-icon">
              <Lock size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Rôle</label>
            <select
              name="role"
              value={credentials.role}
              onChange={(e) => setCredentials({...credentials, role: e.target.value})}
              required
            >
              <option value="">Sélectionnez votre rôle</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;