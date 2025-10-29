// Ecole_frontend/src/Ecoliers/Inscription.jsx
import { useState, useEffect } from 'react';
import './Mes_CSS/InscriptionE.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import * as XLSX from 'xlsx';
import { pdfjs } from 'react-pdf';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import 'pdfjs-dist/build/pdf.worker.entry'; 
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import api from '../api';

// Configuration du worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
export function InscriptionE() {
    const generateId = () => {
        const timestamp = Date.now().toString();
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `MAT-${timestamp}-${randomStr}`;
    };

    const initialState = {
        nom: '',
        prenom: '',
        datedeNaissance:'',
        lieudeNaissance: '',
        sexe: '',
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
    const [fileError, setFileError] = useState('');
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [matriculeFound, setMatriculeFound] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();


    const getFilteredClasses = () => {
        if (!classes.length) return [];
        
        switch (utilisateur.role) {
            case 'eleve':
                return classes.filter(classe => {
                    const nom = classe.nom_classe.toLowerCase();
                    return nom.includes('maternelle') || 
                        nom.includes('maternelle 2') || nom.includes('maternelle 1')|| 
                        nom.includes('ci')|| nom.includes('cp') || nom.includes('ce1') || 
                        nom.includes('ce2') || nom.includes('cm1') || nom.includes('cm2') ||
                        nom.includes('6ème')  || nom.includes('5ème') || nom.includes('4ème') || 
                        nom.includes('3ème') || nom.includes('2nde') || nom.includes('2nd') || nom.includes('1ère') || 
                        nom.includes('terminale') || nom.includes('tle') || nom.includes('seconde') || 
                        nom.includes('première');
                });
            
            case 'enseignementM':
                return classes.filter(classe => {
                    const nom = classe.nom_classe.toLowerCase();
                    return nom.includes('petite section') || nom.includes('moyenne section') || 
                        nom.includes('grande section') || nom.includes('ps') || 
                        nom.includes('ms') || nom.includes('gs') || nom.includes('maternelle') || 
                        nom.includes('maternelle 2') || nom.includes('maternelle 1');
                });
            
            case 'enseignementP':
                return classes.filter(classe => {
                    const nom = classe.nom_classe.toLowerCase();
                    return nom.includes('ci')|| nom.includes('cp') || nom.includes('ce1') || 
                        nom.includes('ce2') || nom.includes('cm1') || nom.includes('cm2') || 
                        nom.includes('primaire') || nom.includes('cours préparatoire') || 
                        nom.includes('cours élémentaire') || nom.includes('cours moyen');
                });
            
            case 'enseignement':
                return classes.filter(classe => {
                    const nom = classe.nom_classe.toLowerCase();
                    return nom.includes('6ème') || nom.includes('5ème') || nom.includes('4ème') || 
                        nom.includes('3ème') || nom.includes('2nde') || nom.includes('2nd') || nom.includes('1ère') || 
                        nom.includes('terminale') || nom.includes('tle') || nom.includes('seconde') || 
                        nom.includes('première');
                });
            
            default:
                return classes;
        }
    };

    const getFilteredSeries = () => {
        if (!series.length || !utilisateur.classe) return [];
        
        const classeNom = utilisateur.classe.toLowerCase();

         const niveauxMap = {
        'ci': 'ci',
        'maternelle 2': 'maternelle 2',
        'maternelle 1': 'maternelle 1',
        'cp': 'cp',
        'ce1': 'ce1',
        'ce2': 'ce2',
        'cm1': 'cm1',
        'cm2': 'cm2',
        '6ème': '6ème',
        '5ème': '5ème',
        '4ème': '4ème',
        '3ème': '3ème'
    };
        
        if ( classeNom.includes('ci') ){
            
            
            return series.filter(serie => serie.nom.toLowerCase().includes('ci'));
        }else if (classeNom.includes('maternelle 2') ) {
            return series.filter(serie => 
                
                serie.nom.toLowerCase().includes('maternelle 2')  
                
            );
        }else if (classeNom.includes('maternelle 1') ) {
            return series.filter(serie => 
                
                serie.nom.toLowerCase().includes('maternelle 1')  
                
            );
        }
        else if (classeNom.includes('cp') ) {
            return series.filter(serie => 
                
                serie.nom.toLowerCase().includes('cp')  
                
            );
        }else if (classeNom.includes('ce1') ) {
            return series.filter(serie => 
                
                serie.nom.toLowerCase().includes('ce1')  
                
            );
        }else if (classeNom.includes('ce2') ) {
            return series.filter(serie => 
                
                serie.nom.toLowerCase().includes('ce2')  
                
            );
        }else if (classeNom.includes('cm1') ) {
            return series.filter(serie =>
                serie.nom.toLowerCase().includes('cm1')
            )
        }else if (classeNom.includes('cm2') ) {
            return series.filter(serie =>
                serie.nom.toLowerCase().includes('cm2')
            )
        }
        else if (classeNom.includes('6ème') ) {
            return series.filter(serie =>
                serie.nom.toLowerCase().includes('6ème')
            )
        }else if (classeNom.includes('5ème') ) {
            return series.filter(serie =>
                serie.nom.toLowerCase().includes('5ème')
            )
        }else if (classeNom.includes('4ème') ) {
            return series.filter(serie =>
                serie.nom.toLowerCase().includes('4ème')
            )
        }else if (classeNom.includes('3ème') ) {
            return series.filter(serie =>
                serie.nom.toLowerCase().includes('3ème')
            )
        }
        else if (classeNom.includes('2nde') ||classeNom.includes('2nd') || classeNom.includes('seconde') ||
                classeNom.includes('1ère') || classeNom.includes('première') ||
                classeNom.includes('terminale') || classeNom.includes('tle')) {
            
                // Pour le secondaire, exclure les séries du niveauxMap
                const seriesExclues = Object.values(niveauxMap).map(s => s.toLowerCase());
                const filteredSeries = series.filter(serie => !seriesExclues.includes(serie?.nom?.toLowerCase()));
                console.log("Séries filtrées pour le secondaire:", filteredSeries);
                return filteredSeries;
            
        }
        
        return series;
    };

    

    const getFilteredMatieres = () => {
        if (!matieres.length) return [];
        
        switch (utilisateur.role) {
            case 'enseignementM':
                return matieres.filter(matiere => {
                    const nom = matiere.nom.toLowerCase();
                    return nom.includes('éveil') || nom.includes('psychomotricité') || 
                        nom.includes('langage') || nom.includes('découverte') ||
                        nom.includes('graphisme') || nom.includes('comptines') ||
                        nom.includes('activités') || nom.includes('maternelle');
                });
            
            case 'enseignementP':
                return matieres.filter(matiere => {
                    const nom = matiere.nom.toLowerCase();
                    return nom.includes('français') || nom.includes('mathématiques') || 
                        nom.includes('morale') || nom.includes('expression ecrite') || 
                        nom.includes('lecture') || nom.includes('mathématiques') || 
                        nom.includes('histoire') || nom.includes('civisme') ||
                        nom.includes('géographie') || nom.includes('dessein') ||
                        nom.includes('es') || nom.includes('musique') || nom.includes('est') ||
                        nom.includes('eps') || nom.includes('éducation physique') ||
                        nom.includes('primaire');
                });
            
            case 'enseignement':
                return matieres.filter(matiere => {
                    const nom = matiere.nom.toLowerCase();
                    return nom.includes('mathématiques') || nom.includes('français') || 
                        nom.includes('anglais') || nom.includes('espagnol') ||
                        nom.includes('physique') || nom.includes('chimie') ||
                        nom.includes('svt') || nom.includes('biologie') ||
                        nom.includes('histoire') || nom.includes('géographie') ||
                        nom.includes('philosophie') || nom.includes('économie') ||
                        nom.includes('littérature') || nom.includes('allemand') ||
                        nom.includes('italien') || nom.includes('arts') ||
                        nom.includes('eps') || nom.includes('technologie') ||
                        nom.includes('informatique') || nom.includes('secondaire');
                });
            
            default:
                return matieres;
        }
    };
    // Fonction pour normaliser les chaînes de caractères (enlève accents, majuscules et espaces superflus)
// Fonction de normalisation des chaînes
// Fonction de normalisation améliorée
const normalizeString = (str) => {
    if (!str) return '';
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprime tous les accents
        .replace(/[^A-Za-z\s]/g, ' ')   // Garde uniquement lettres et espaces
        .toUpperCase()
        .replace(/\s+/g, ' ')           // Réduit les espaces multiples
        .trim();
};

const findStudent = (students, nom, prenom) => {
    if (!students || students.length === 0) {
        console.log('Aucun étudiant dans la base de données');
        return null;
    }

    const normalizedSearchNom = normalizeString(nom);
    const normalizedSearchPrenom = normalizeString(prenom);

    console.log('Recherche de:', { 
        nom: nom, 
        prenom: prenom,
        normalisé: {
            nom: normalizedSearchNom,
            prenom: normalizedSearchPrenom
        }
    });

    // Recherche exacte d'abord
    let foundStudent = students.find(student => {
        const normalizedStudentNom = normalizeString(student.nom);
        const normalizedStudentPrenom = normalizeString(student.prenoms);

        const nomMatch = normalizedStudentNom === normalizedSearchNom;
        const searchPrenomParts = normalizedSearchPrenom.split(' ').filter(p => p.length > 0);
        const studentPrenomParts = normalizedStudentPrenom.split(' ').filter(p => p.length > 0);
        
        // Vérifier que tous les prénoms recherchés sont présents
        const prenomMatch = searchPrenomParts.length > 0 && 
            searchPrenomParts.every(part => 
                studentPrenomParts.some(studentPart => 
                    studentPart.includes(part) || part.includes(studentPart)
                )
            );

        if (nomMatch && prenomMatch) {
            console.log('Correspondance exacte trouvée:', {
                matricule: student.numero_matricule,
                nomComplet: `${student.nom} ${student.prenoms}`,
                recherché: `${nom} ${prenom}`
            });
            return true;
        }
        return false;
    });

    // Si pas de correspondance exacte, recherche approximative
    if (!foundStudent) {
        foundStudent = students.find(student => {
            const normalizedStudentNom = normalizeString(student.nom);
            const normalizedStudentPrenom = normalizeString(student.prenoms);

            // Recherche approximative du nom (contient ou est contenu)
            const nomSimilar = normalizedStudentNom.includes(normalizedSearchNom) || 
                             normalizedSearchNom.includes(normalizedStudentNom);
            
            // Recherche approximative des prénoms
            const searchPrenomParts = normalizedSearchPrenom.split(' ').filter(p => p.length > 1);
            const studentPrenomParts = normalizedStudentPrenom.split(' ').filter(p => p.length > 1);
            
            const prenomSimilar = searchPrenomParts.length > 0 && 
                searchPrenomParts.some(part => 
                    studentPrenomParts.some(studentPart => 
                        studentPart.includes(part) || part.includes(studentPart)
                    )
                );

            if (nomSimilar && prenomSimilar) {
                console.log('Correspondance approximative trouvée:', {
                    matricule: student.numero_matricule,
                    nomComplet: `${student.nom} ${student.prenoms}`,
                    recherché: `${nom} ${prenom}`
                });
                return true;
            }
            return false;
        });
    }

    return foundStudent || null;
};


const processPdfFile = async () => {
    try {
        const pdfPath = '/matricules/Matricule.pdf';
        
        // Vérifier si le fichier existe
        const response = await fetch(pdfPath);
        if (!response.ok) {
            throw new Error('Fichier PDF des matricules introuvable');
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        const students = [];

        console.log(`PDF chargé avec ${pdf.numPages} pages`);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Extraire le texte ligne par ligne
            const items = textContent.items;
            let currentLine = '';
            let lines = [];
            
            // Regrouper les éléments de texte par ligne
            items.forEach((item, index) => {
                const nextItem = items[index + 1];
                currentLine += item.str;
                
                // Si l'élément suivant est sur une nouvelle ligne ou si c'est le dernier
                if (!nextItem || Math.abs(item.transform[5] - nextItem.transform[5]) > 5) {
                    lines.push(currentLine.trim());
                    currentLine = '';
                }
            });

            console.log(`Page ${pageNum}: ${lines.length} lignes trouvées`);
            
            // Traiter chaque ligne (ignorer les en-têtes)
            lines.forEach((line, index) => {
                if (index === 0 || !line.trim()) return; // Ignorer la première ligne et les lignes vides
                
                // Méthode plus robuste pour extraire les données
                // Supposer un format : [autres colonnes] MATRICULE NOM PRÉNOM(S)
                const parts = line.split(/\s+/); // Diviser sur tous les espaces
                
                if (parts.length >= 3) {
                    // Chercher le pattern matricule (généralement des chiffres/lettres)
                    let matriculeIndex = -1;
                    for (let i = 0; i < parts.length; i++) {
                        // Le matricule contient généralement des chiffres
                        if (/\d/.test(parts[i]) && parts[i].length >= 12) {
                            matriculeIndex = i;
                            break;
                        }
                    }
                    
                    if (matriculeIndex !== -1 && matriculeIndex + 2 < parts.length) {
                        const matricule = parts[matriculeIndex];
                        const nom = parts[matriculeIndex + 1];
                        const prenoms = parts.slice(matriculeIndex + 2).join(' ');
                        
                        if (matricule && nom && prenoms) {
                            students.push({
                                numero_matricule: matricule.trim(),
                                nom: nom.trim(),
                                prenoms: prenoms.trim()
                            });
                            
                            console.log(`Étudiant trouvé: ${nom} ${prenoms} - ${matricule}`);
                        }
                    }
                }
            });
        }

        console.log(`Total d'étudiants extraits: ${students.length}`);
        return students;
        
    } catch (error) {
        console.error('Erreur lors de l\'extraction PDF:', error);
        throw new Error(`Impossible de lire le fichier des matricules: ${error.message}`);
    }
};

useEffect(() => {
    const timer = setTimeout(async () => {
        // Nettoyer les messages précédents
        setFileError('');
        setMatriculeFound(false);

        if (utilisateur.role !== 'eleve' || !utilisateur.nom?.trim() || !utilisateur.prenom?.trim()) {
            return;
        }

        // Vérifier que nom et prénom ont au moins 2 caractères
        if (utilisateur.nom.trim().length < 2 || utilisateur.prenom.trim().length < 2) {
            return;
        }

        setIsProcessingFile(true);
        
        try {
            console.log('Début de traitement du fichier PDF...');
            const students = await processPdfFile();
            
            if (!students || students.length === 0) {
                setFileError('Aucune donnée trouvée dans le fichier des matricules');
                return;
            }

            console.log(`Recherche parmi ${students.length} étudiants...`);
            const foundStudent = findStudent(students, utilisateur.nom, utilisateur.prenom);
            
            if (foundStudent) {
                setUtilisateur(prev => ({
                    ...prev,
                    numero_matricule: foundStudent.numero_matricule
                }));
                setMatriculeFound(true);
                setFileError(''); // Nettoyer l'erreur
                console.log('Matricule mis à jour:', foundStudent.numero_matricule);
            } else {
                setFileError(`Aucun élève trouvé pour "${utilisateur.nom} ${utilisateur.prenom}". Vérifiez l'orthographe.`);
                // Ne pas effacer le matricule existant, au cas où l'utilisateur l'aurait saisi manuellement
            }
        } catch (err) {
            console.error('Erreur lors du traitement:', err);
            setFileError(`Erreur: ${err.message}`);
        } finally {
            setIsProcessingFile(false);
        }
    }, 1000); // Augmenter le délai à 1 seconde pour éviter trop d'appels

    return () => clearTimeout(timer);
}, [utilisateur.nom, utilisateur.prenom, utilisateur.role]);

useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [classesRes, matieresRes, seriesRes] = await Promise.all([
                    api.get(`/classes`),
                    api.get(`/matieres`),
                    api.get(`/series`),
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
                nom: utilisateur.nom,
                datedeNaissance: utilisateur.datedeNaissance,
                lieudeNaissance: utilisateur.lieudeNaissance,
                sexe: utilisateur.sexe,
                prenom: utilisateur.prenom,
                numero_de_telephone: utilisateur.numero_de_telephone,
                password1: utilisateur.password1,
                [name]: value,
                identifiant: generateId()
            });
            setConfirmationPassword('');
        } 
        else if (name === 'classe') {
            setUtilisateur(prev => ({
                ...prev,
                classe: value,
                serie: ''
            }));
        } 
        else if (name === 'serie') {
            setUtilisateur(prev => ({
                ...prev,
                serie: value,
            }));
        }
        else if (name === 'matiere') {
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
        setError(false);
        setMessage('');

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

        if (!utilisateur.datedeNaissance) {
            setError(true);
            setMessage('La date de naissance est requise');
            return false;
        };

        if(!utilisateur.lieudeNaissance?.trim()) {
            setError(true);
            setMessage('Le lieu de naissance est requis');
            return false;
        }

        if(!utilisateur.sexe?.trim()) {
            setError(true);
            setMessage('Le sexe est requis');
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

        if (utilisateur.password1.length < 8) {
            setError(true);
            setMessage('Le mot de passe doit contenir au moins 6 caractères');
            return false;
        }

        if (utilisateur.password1 !== confirmationPassword) {
            setError(true);
            setMessage('Les mots de passe ne correspondent pas');
            return false;
        }

        if (utilisateur.role === 'eleve') {
            if (!utilisateur.serie) {
                setError(true);
                setMessage('Veuillez sélectionner une série');
                return false;
            }
            if (!utilisateur.classe) {
            setError(true);
            setMessage('Veuillez sélectionner une classe');
            return false;
            }

            if (!utilisateur.numero_matricule?.trim()) {
                setError(true);
                setMessage('Le numéro matricule est requis');
                return false;
            }
            if (!matriculeFound) {
            setError(true);
            setMessage('Veuillez vérifier votre nom et prénom pour trouver votre matricule');
            return false;
        }
        }

        if (['enseignement', 'enseignementM', 'enseignementP'].includes(utilisateur.role)) {
            if (!utilisateur.email?.trim()) {
                setError(true);
                setMessage('L\'email est obligatoire pour les enseignants');
                return false;
            }

            if (!utilisateur.classe) {
            setError(true);
            setMessage('Veuillez sélectionner une classe');
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
        if (['parent'].includes(utilisateur.role)) {
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
            const dataToSend = {
                nom: utilisateur.nom.trim(),
                prenom: utilisateur.prenom.trim(),
                datedeNaissance: utilisateur.datedeNaissance?.trim(),
                lieudeNaissance: utilisateur.lieudeNaissance?.trim(),
                sexe: utilisateur.sexe?.trim(),
                classe: utilisateur.classe?.trim() || null, // Gérer le cas undefined
                serie: utilisateur.role === 'eleve' ? utilisateur.serie?.trim() : null,
                matiere: ['enseignement'].includes(utilisateur.role) ? utilisateur.matiere?.trim() : null,
                numero_de_telephone: utilisateur.numero_de_telephone.trim(),
                email: utilisateur.email?.trim() || null,
                numero_matricule: utilisateur.numero_matricule?.trim() || null,
                password1: utilisateur.password1, // Renommer en password pour correspondre peut-être au back
                role: utilisateur.role,
                identifiant: utilisateur.identifiant
            };

            console.log('Données envoyées pour l\'inscription:', dataToSend);

            const response = await api.post(`/inscription`, dataToSend);

            if (response.data?.message) {
                setMessage(response.data.message);
                
                setTimeout(() => {
                    navigate('/connexion', { 
                        replace: true,
                        state: { message: 'Inscription réussie ! Veuillez vous connecter.' }
                    });
                }, 2000);
            } else {
                throw new Error('Erreur lors de l\'inscription');
                setIsLoading(false);
            }
        } catch (err) {
            
            setError(true);
            let errorMessage = 'Erreur lors de l\'inscription';
            
            if (err.response) {
                // Afficher les erreurs de validation du serveur
                if (err.response.status === 422 && err.response.data.errors) {
                    errorMessage = Object.values(err.response.data.errors).join('\n');
                    setIsLoading(false);
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                    setIsLoading(false);
                }
            } else {
                errorMessage = err.message;
            }
            
            setMessage(errorMessage);
            console.error('Détails de l\'erreur:', err.response?.data || err);
            setIsLoading(false);}
        };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

    const getRoleLabel = (role) => {
        const labels = {
            'eleve': 'Élève',
            'parent': 'Parent',
            'enseignementM': 'Enseignant Maternelle',
            'enseignementP': 'Enseignant Primaire',
            'enseignement': 'Enseignant Secondaire'
        };
        return labels[role] || role;
    };

    const filteredClasses = getFilteredClasses();
    const filteredMatieres = getFilteredMatieres();
    const filteredSeries = getFilteredSeries();

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
                        <option value="parent">Parent</option>
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
                        placeholder="Votre Nom  "
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
                        placeholder="Votre/vos Prénom(s)  "
                        disabled={isLoading}
                        required
                        minLength="2"
                    />
                </div>

                

                <div className="toust">
                    <input
                        type="date"
                        className="tous"
                        name="datedeNaissance"
                        value={utilisateur.datedeNaissance}
                        onChange={handleChange}
                        placeholder="Date de naissance"
                        disabled={isLoading}
                        required
                        minLength="2"
                    />
                </div>

                <div className="toust">
                    <input
                        type="text"
                        className="tous"
                        name="lieudeNaissance"
                        value={utilisateur.lieudeNaissance}
                        onChange={handleChange}
                        placeholder="Lieu de naissance"
                        disabled={isLoading}
                        required
                        minLength="2"
                    />
                </div>

                <div className="toust">
                    <select 
                        name="sexe"
                        className="tous"
                        value={utilisateur.sexe}
                        onChange={handleChange}
                        /*disabled={isLoading}*/
                        required
                    >
                        <option value="">selectionnez votre sexe</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>

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
                            disabled={isLoading || isProcessingFile}
                            required
                        />
                    </div>

                    <div className="messages-container">
                        {isProcessingFile && (
                            <div className="loading-message">
                                🔍 Recherche du matricule en cours...
                            </div>
                        )}
                        {fileError && !isProcessingFile && (
                            <div className="error-message">
                                ❌ {fileError}
                            </div>
                        )}
                        {matriculeFound && !isProcessingFile && (
                            <div className="success-message">
                                ✓ Matricule trouvé : {utilisateur.numero_matricule}
                            </div>
                        )}
                    </div>

                        <div className="toust">
                            <select
                                name="classe"
                                className="tous"
                                value={utilisateur.classe}
                                onChange={handleChange}
                                disabled={isLoading || filteredClasses.length === 0}
                                required
                            >
                                <option value="">
                                    {filteredClasses.length === 0 
                                        ? `Aucune classe disponible pour ${getRoleLabel(utilisateur.role)}`
                                        : `Sélectionnez une classe (${getRoleLabel(utilisateur.role)})`
                                    }
                                </option>
                                {filteredClasses.map(classe => (
                                    <option key={classe.id} value={classe.nom_classe}>
                                        {classe.nom_classe}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="toust">
                            <select
                                name="serie"
                                className="tous"
                                value={utilisateur.serie}
                                onChange={handleChange}
                                disabled={isLoading || filteredSeries.length === 0 || !utilisateur.classe}
                                required
                            >
                                <option value="">
                                    {!utilisateur.classe 
                                        ? "Sélectionnez d'abord une classe"
                                        : filteredSeries.length === 0 
                                            ? "Aucune série disponible pour cette classe"
                                            : "Sélectionnez une série"
                                    }
                                </option>
                                {filteredSeries.map(serie => (
                                    <option key={serie.id} value={serie.nom}>
                                        {serie.nom}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                {utilisateur.role === 'parent' && (<div className="toust">
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

                        <div className="toust">
                            <select
                                name="classe"
                                className="tous"
                                value={utilisateur.classe}
                                onChange={handleChange}
                                disabled={isLoading || filteredClasses.length === 0}
                                required
                            >
                                <option value="">
                                    {filteredClasses.length === 0 
                                        ? `Aucune classe disponible pour ${getRoleLabel(utilisateur.role)}`
                                        : `Sélectionnez une classe (${getRoleLabel(utilisateur.role)})`
                                    }
                                </option>
                                {filteredClasses.map(classe => (
                                    <option key={classe.id} value={classe.nom_classe}>
                                        {classe.nom_classe}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {utilisateur.role === 'enseignement' && (
                            <div className="toust">
                                <select
                                    name="matiere"
                                    className="tous"
                                    value={utilisateur.matiere}
                                    onChange={handleChange}
                                    disabled={isLoading || filteredMatieres.length === 0}
                                    required
                                >
                                    <option value="">
                                        {filteredMatieres.length === 0 
                                            ? "Aucune matière disponible pour le secondaire"
                                            : "Sélectionnez une matière (Secondaire)"
                                        }
                                    </option>
                                    {filteredMatieres.map(matiere => (
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