import { useState, useEffect } from 'react';
import './Mes_CSS/Connexion.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api'; 
import { urlBase } from '../api';
import EcoleManagement from '../components/EcoleManagement';


export function ConnexionU() {
    const [eleve, SetEleve] = useState({
        ecole_id: '',
        identifiant: '',
        password: '',
    });

    const [error, SetError] = useState(false);
    const [message, SetMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [ecoles, setEcoles] = useState([]);

    const navigate = useNavigate();
    const { login } = useAuth(); // Utilisez la fonction login du contexte

    const HandleChange = (e) => {
        SetEleve({ ...eleve, [e.target.name]: e.target.value });
        if (error) {
            SetError(false);
            SetMessage('');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/ecoles');
                const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
                setEcoles(data);
            } catch (err) {
                console.error('Erreur de chargement des données:', err);
                setEcoles([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

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

        if (!eleve.ecole_id) {  
            SetError(true);
            SetMessage('Veuillez sélectionner une école');
            return false;
        }

        return true;
    };

    const HandleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        SetError(false);
        SetMessage('');

        try {
            // Stocker ecole_id avant la connexion
            localStorage.setItem('ecole_id', eleve.ecole_id);
            
            const response = await axios.post(
                'http://localhost:8000/api/connexion', 
                eleve,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Réponse du serveur:', response.data);

            if (response.data.token || response.data.role) {
                // Préparer les données utilisateur
                const userData = response.data.user || {
                    ecole_id: eleve.ecole_id,
                    identifiant: eleve.identifiant,
                    nom: response.data.user?.nom || 'Utilisateur',
                    prenom: response.data.user?.prenom || 'Spécial',
                    role: response.data.role
                };

                // Utiliser la fonction login du contexte
                login({
                    user: userData,
                    token: response.data.token || null
                });

                SetMessage('Connexion réussie ! Redirection...');

                setTimeout(() => {
                    const redirectPath = response.data.redirect_to || '/';
                    navigate(redirectPath, { replace: true });
                }, 1500);
            } else {
                throw new Error('Réponse inattendue du serveur');
            }
        } catch (err) {
            console.error('Erreur de connexion:', err);
            SetError(true);
            SetMessage(err.response?.data?.message || 'Identifiants incorrects');
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
                    <select
                        name="ecole_id"
                        className="tous"
                        value={eleve.ecole_id}
                        onChange={HandleChange}
                        disabled={isLoading || ecoles.length === 0}
                        required
                    >
                        <option value="">
                            {ecoles.length === 0 
                            ? 'Aucune école disponible'
                            : 'Sélectionnez une école'
                            }
                        </option>
                        {Array.isArray(ecoles) && ecoles.map(ecole => (
                            <option key={ecole.id} value={ecole.id}>
                                {ecole.nom}
                            </option>
                        ))}
                    </select>
                </div>

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

                <div className='BI'>
                    <button 
                        className="bi" 
                        type="submit" 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Connexion en cours...' : 'Connexion'}
                    </button>
                </div>
                

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
