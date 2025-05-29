import { useState } from 'react';
import './Mes_CSS/Connexion.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function Connexion() {
    const [eleve, SetEleve] = useState({
        identifiant: '',
        password: '',
    });

    const [Conf, SetConf] = useState('');
    const [error, SetError] = useState(false);
    const [message, SetMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const { setAuthData } = useAuth();

    const HandleChange = (e) => {
        SetEleve({ ...eleve, [e.target.name]: e.target.value });
        // Effacer les messages d'erreur lors de la saisie
        if (error) {
            SetError(false);
            SetMessage('');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const validateForm = () => {
        if (!eleve.identifiant || !eleve.password) {
            SetError(true);
            SetMessage('Tous les champs sont requis');
            return false;
        }

        if (eleve.identifiant.length < 3) {
            SetError(true);
            SetMessage('L\'identifiant doit contenir au moins 3 caractères');
            return false;
        }

        if (eleve.password.length < 6) {
            SetError(true);
            SetMessage('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }

        return true;
    };

    const HandleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        SetError(false);
        SetMessage('');

        try {
            const response = await axios.post('http://localhost:8000/api/connexion', eleve, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // Timeout de 10 secondes
            });

            if (response.status === 200) {
                // Stocker dans le contexte d'authentification
                if (response.data.user && response.data.token) {
                    setAuthData({
                        user: response.data.user,
                        token: response.data.token
                    });
                    
                    // Stocker le token pour les requêtes futures
                    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                    
                } else if (response.data.role) {
                    setAuthData({
                        user: { role: response.data.role }
                    });
                }

                SetMessage('Connexion réussie! Redirection en cours...');
                SetError(false);
                
                // Nettoyer le formulaire
                SetEleve({ identifiant: '', password: '' });
                SetConf('');

                // Redirection côté client avec un petit délai pour afficher le message de succès
                setTimeout(() => {
                    if (response.data.redirect_to) {
                        navigate(response.data.redirect_to, { replace: true });
                    } else {
                        // Redirection par défaut selon le rôle
                        const userRole = response.data.user?.role || response.data.role;
                        switch(userRole) {
                            case 'admin':
                                navigate('/admin/dashboard', { replace: true });
                                break;
                            case 'teacher':
                                navigate('/teacher/dashboard', { replace: true });
                                break;
                            case 'student':
                                navigate('/student/dashboard', { replace: true });
                                break;
                            default:
                                navigate('/dashboard', { replace: true });
                        }
                    }
                }, 1500);
            }
        } catch (err) {
            SetError(true);
            
            if (err.code === 'ECONNABORTED') {
                SetMessage('Délai de connexion dépassé. Veuillez réessayer.');
            } else if (err.response) {
                // Erreur de réponse du serveur
                switch(err.response.status) {
                    case 401:
                        SetMessage('Identifiants incorrects.');
                        break;
                    case 403:
                        SetMessage('Accès refusé. Votre compte pourrait être suspendu.');
                        break;
                    case 429:
                        SetMessage('Trop de tentatives. Veuillez patienter avant de réessayer.');
                        break;
                    case 500:
                        SetMessage('Erreur serveur. Veuillez réessayer plus tard.');
                        break;
                    default:
                        SetMessage(err.response.data?.message || 'Une erreur est survenue.');
                }
            } else if (err.request) {
                SetMessage('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
            } else {
                SetMessage('Une erreur inattendue est survenue.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password');
    };

    const handleGoToRegister = () => {
        navigate('/inscription');
    };

    return (
        <div className="container">
            <form className="corps" onSubmit={HandleSubmit}>
                <h2 className="H2">Connectez-vous ici</h2>

                {message && (
                    <div className={error ? 'error' : 'success'}>
                        {message}
                    </div>
                )}

                <div className="toust">
                    <input
                        type="text"
                        className="tous"
                        name="identifiant"
                        value={eleve.identifiant}
                        onChange={HandleChange}
                        placeholder="Votre identifiant"
                        disabled={isLoading}
                        autoComplete="username"
                        required
                    />
                </div>

                <div className="toust password-field">
                    <input
                        type={showPassword ? "text" : "password"}
                        className="tous password-input"
                        name="password"
                        value={eleve.password}
                        onChange={HandleChange}
                        placeholder="Votre mot de passe"
                        disabled={isLoading}
                        autoComplete="current-password"
                        required
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={togglePasswordVisibility}
                        disabled={isLoading}
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                        {showPassword ? "🙈" : "👁️"}
                    </button>
                </div>

                <button 
                    className="bi" 
                    type="submit" 
                    disabled={isLoading}
                >
                    {isLoading ? 'Connexion en cours...' : 'Connexion'}
                </button>

                <div className="form-links">
                    <button
                        type="button"
                        className="link-button"
                        onClick={handleForgotPassword}
                        disabled={isLoading}
                    >
                        Mot de passe oublié ?
                    </button>
                    
                    <button
                        type="button"
                        className="link-button"
                        onClick={handleGoToRegister}
                        disabled={isLoading}
                    >
                        Pas encore de compte ? S'inscrire
                    </button>
                </div>
            </form>
        </div>
    );
}