import { useState, useEffect } from 'react';
import './Mes_CSS/InscriptionE.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export function InscriptionE() {
    const generateId = () => {
        const timestamp = Date.now().toString();
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `MAT-${timestamp}-${randomStr}`;
    };

    const initialState = {
        nom: '',
        prenom: '',
        classe: '',
        numero_de_telephone: '',
        password1: '',
        numero_matricule: '',
        serie: '',
        email: '',
        matiere: '',
        role: 'eleve',
        identifiant: generateId(),
    };

    const [utilisateur, setUtilisateur] = useState(initialState);
    const [confirmationPassword, setConfirmationPassword] = useState('');
    const [error, setError] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [classes, setClasses] = useState([]);
    const [matieres, setMatieres] = useState([]);
    const [series, setSeries] = useState([]);

    const navigate = useNavigate();

    // Chargement des données initiales
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(false);
            try {
                const [classesRes, matieresRes, seriesRes] = await Promise.all([
                    axios.get('http://localhost:8000/api/classes'),
                    axios.get('http://localhost:8000/api/matieres'),
                    axios.get('http://localhost:8000/api/series'),
                ]);

                setClasses(classesRes.data);
                setMatieres(matieresRes.data);
                setSeries(seriesRes.data);
            } catch (err) {
                console.error('Erreur de chargement des données:', err);
                setError(true);
                setMessage('Erreur lors du chargement des données initiales');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'role') {
            setUtilisateur({ 
                ...initialState,
                [name]: value,
                identifiant: generateId()
            });
        } 
        else if (name === 'classe') {
            
            setUtilisateur(prev => ({
                ...prev,
                classe: value,
            }));
        } 
        else if (name === 'serie') {
            const selectedSerie = series.find(s => s.nom === value);
            setUtilisateur(prev => ({
                ...prev,
                serie: value,
            }));
        }
        else if (name === 'matiere') {
            const selectedMatiere = matieres.find(m => m.nom === value);
            setUtilisateur(prev => ({
                ...prev,
                matiere: value,
            }));
        }
        else {
            setUtilisateur(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^[0-9]{8,15}$/;
        return phoneRegex.test(phone);
    };

    const validateForm = () => {
        // Réinitialiser les erreurs
        setError(false);
        setMessage('');

        // Validation de base
        if (!utilisateur.nom?.trim()) {
            setError(true);
            setMessage('Le nom est requis');
            return false;
        }

        if (!utilisateur.prenom?.trim()) {
            setError(true);
            setMessage('Le prénom est requis');
            return false;
        }

        if (!utilisateur.classe) {
            setError(true);
            setMessage('Veuillez sélectionner une classe');
            return false;
        }

        if (!utilisateur.numero_de_telephone?.trim()) {
            setError(true);
            setMessage('Le numéro de téléphone est requis');
            return false;
        }

        if (!validatePhone(utilisateur.numero_de_telephone)) {
            setError(true);
            setMessage('Format de numéro de téléphone invalide (8-15 chiffres)');
            return false;
        }

        if (!utilisateur.password1?.trim()) {
            setError(true);
            setMessage('Le mot de passe est requis');
            return false;
        }

        if (utilisateur.password1.length < 6) {
            setError(true);
            setMessage('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }

        if (utilisateur.password1 !== confirmationPassword) {
            setError(true);
            setMessage('Les mots de passe ne correspondent pas');
            return false;
        }

        // Validation spécifique au rôle
        if (utilisateur.role === 'eleve') {
            if (!utilisateur.serie) {
                setError(true);
                setMessage('Veuillez sélectionner une série');
                return false;
            }

            if (!utilisateur.numero_matricule?.trim()) {
                setError(true);
                setMessage('Le numéro matricule est requis');
                return false;
            }
        }

        if (['enseignement', 'enseignementM', 'enseignementP'].includes(utilisateur.role)) {
            if (!utilisateur.email?.trim()) {
                setError(true);
                setMessage('L\'email est obligatoire pour les enseignants');
                return false;
            }

            if (!validateEmail(utilisateur.email)) {
                setError(true);
                setMessage('Format d\'email invalide');
                return false;
            }

            if (utilisateur.role === 'enseignement' && !utilisateur.matiere) {
                setError(true);
                setMessage('La matière est obligatoire pour un enseignant du secondaire');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsLoading(true);
        setError(false);
        setMessage('');

        try {
            // Formatage des données pour l'API
            const dataToSend = {
                nom: utilisateur.nom.trim(),
                prenom: utilisateur.prenom.trim(),
                classe: utilisateur.classe.trim(),
                serie: utilisateur.role === 'eleve' ? utilisateur.serie : null,
                matiere: utilisateur.role === 'enseignement' ? utilisateur.matiere : null,
                numero_de_telephone: utilisateur.numero_de_telephone.trim(),
                email: utilisateur.email?.trim(),
                numero_matricule: utilisateur.numero_matricule?.trim(),
                password1: utilisateur.password1,
                role: utilisateur.role,
                identifiant: utilisateur.identifiant
            };

            console.log('Données envoyées:', dataToSend);

            const response = await axios.post('http://localhost:8000/api/inscription', dataToSend);

            setMessage('Inscription réussie ! Redirection...');
            setTimeout(() => navigate('/connexion'), 2000);
        } catch (err) {
            setError(true);
            console.error('Erreur:', err.response?.data);
            
            if (err.response?.data?.errors) {
                const errorMessages = Object.values(err.response.data.errors)
                    .flat()
                    .join(', ');
                setMessage(errorMessages);
            } else {
                setMessage(err.response?.data?.message || 'Erreur lors de l\'inscription');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    const getRoleLabel = (role) => {
        const labels = {
            'eleve': 'Élève',
            'enseignementM': 'Enseignant Maternelle',
            'enseignementP': 'Enseignant Primaire',
            'enseignement': 'Enseignant Secondaire'
        };
        return labels[role] || role;
    };

    return (
        <div className="container">
            <form className="corps" onSubmit={handleSubmit}>
                <h2 className="H2">Inscrivez-vous ici</h2>

                {message && (
                    <div className={error ? 'error' : 'success'}>
                        {message}
                    </div>
                )}

                
                <div className="toust">
                    <select 
                        name="role" 
                        className='tous' 
                        value={utilisateur.role} 
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                    >
                        <option value="eleve">Élève</option>
                        <option value="enseignementM">Enseignant Maternelle</option>
                        <option value="enseignementP">Enseignant Primaire</option>
                        <option value="enseignement">Enseignant Secondaire</option>
                    </select>
                </div>

                <div className="role-info">
                    <small>Rôle sélectionné : <strong>{getRoleLabel(utilisateur.role)}</strong></small>
                    <small>Voilà l'Identifiant généré avec lequel vous allez vous connectez : <strong>{utilisateur.identifiant}</strong></small>
                </div>

                <div className="toust">
                    <input
                        type="text"
                        className="tous"
                        name="nom"
                        value={utilisateur.nom}
                        onChange={handleChange}
                        placeholder="Votre Nom *"
                        disabled={isLoading}
                        required
                        minLength="2"
                    />
                </div>

                <div className="toust">
                    <input
                        type="text"
                        className="tous"
                        name="prenom"
                        value={utilisateur.prenom}
                        onChange={handleChange}
                        placeholder="Votre/vos Prénom(s) *"
                        disabled={isLoading}
                        required
                        minLength="2"
                    />
                </div>

                <div className="toust">
                    <select
                        name="classe"
                        className="tous"
                        value={utilisateur.class}
                        onChange={handleChange}
                        disabled={isLoading || classes.length === 0}
                        required
                    >
                        <option value="">Sélectionnez une classe</option>
                        {classes.map(classe => (
                            <option key={classe.id} value={classe.nom_classe}>
                                {classe.nom_classe}
                            </option>
                        ))}
                    </select>
                </div>

                {utilisateur.role === 'eleve' && (
                    <>
                        <div className="toust">
                            <input
                                type="text"
                                className="tous"
                                name="numero_matricule"
                                value={utilisateur.numero_matricule}
                                onChange={handleChange}
                                placeholder="Votre numéro matricule *"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="toust">
                            <select
                                name="serie"
                                className="tous"
                                value={utilisateur.serie}
                                onChange={handleChange}
                                disabled={isLoading || series.length === 0}
                                required
                            >
                                <option value="">Sélectionnez une série</option>
                                {series.map(serie => (
                                    <option key={serie.id} value={serie.nom}>
                                        {serie.nom}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                {['enseignement', 'enseignementM', 'enseignementP'].includes(utilisateur.role) && (
                    <>
                        <div className="toust">
                            <input
                                type="email"
                                className="tous"
                                name="email"
                                value={utilisateur.email}
                                onChange={handleChange}
                                placeholder="Votre adresse email *"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {utilisateur.role === 'enseignement' && (
                            <div className="toust">
                                <select
                                    name="matiere"
                                    className="tous"
                                    value={utilisateur.matiere}
                                    onChange={handleChange}
                                    disabled={isLoading || matieres.length === 0}
                                    required
                                >
                                    <option value="">Sélectionnez une matière</option>
                                    {matieres.map(matiere => (
                                        <option key={matiere.id} value={matiere.nom}>
                                            {matiere.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </>
                )}

                <div className="toust">
                    <input
                        type="tel"
                        className="tous"
                        name="numero_de_telephone"
                        value={utilisateur.numero_de_telephone}
                        onChange={handleChange}
                        placeholder="Numéro de téléphone *"
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="toust password-field">
                    <input
                        type={showPassword ? "text" : "password"}
                        className="tous password-input"
                        name="password1"
                        value={utilisateur.password1}
                        onChange={handleChange}
                        placeholder="Votre mot de passe *"
                        disabled={isLoading}
                        required
                        minLength="6"
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={togglePasswordVisibility}
                        disabled={isLoading}
                    >
                        {showPassword ? "🙈" : "👁️"}
                    </button>
                </div>

                <div className="toust password-field">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="tous password-input"
                        value={confirmationPassword}
                        onChange={(e) => setConfirmationPassword(e.target.value)}
                        placeholder="Confirmer votre mot de passe *"
                        disabled={isLoading}
                        required
                        minLength="6"
                    />
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={toggleConfirmPasswordVisibility}
                        disabled={isLoading}
                    >
                        {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                </div>

                <div className="form-info">
                    <small>* Champs obligatoires</small>
                </div>

                <button 
                    className="bi" 
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? 'Inscription en cours...' : "S'inscrire"}
                </button>

                <div className="form-links">
                    <button
                        type="button"
                        className="link-button"
                        onClick={() => navigate('/connexion')}
                        disabled={isLoading}
                    >
                        Déjà un compte ? Se connecter
                    </button>
                </div>
            </form>
        </div>
    );
}