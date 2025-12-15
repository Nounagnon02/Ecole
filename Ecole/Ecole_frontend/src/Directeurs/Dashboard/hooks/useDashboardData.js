g/**
 * useDashboardData - Hook optimisé pour charger les données du dashboard
 * 
 * Ce hook consolide tous les appels API initiaux en un seul point
 * avec chargement parallèle pour optimiser les performances.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../../api';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache simple en mémoire
const cache = {
    data: null,
    timestamp: null
};

export const useDashboardData = (options = {}) => {
    const { skipCache = false } = options;

    const [data, setData] = useState({
        classes: [],
        classes1: [], // Classes avec effectif
        eleves: [],
        matieres: [],
        matieresSeries: [],
        series: [],
        studentData: [],
        gradeData: [],
        notifications: [],
        evenements: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingStates, setLoadingStates] = useState({
        classes: true,
        eleves: true,
        matieres: true,
        series: true,
        stats: true
    });

    // Fonction pour charger toutes les données en parallèle
    const fetchAllData = useCallback(async () => {
        // Vérifier le cache
        if (!skipCache && cache.data && cache.timestamp) {
            const isValid = Date.now() - cache.timestamp < CACHE_DURATION;
            if (isValid) {
                setData(cache.data);
                setLoading(false);
                setLoadingStates({
                    classes: false,
                    eleves: false,
                    matieres: false,
                    series: false,
                    stats: false
                });
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            // Charger toutes les données en parallèle
            const [
                classesRes,
                classes1Res,
                classeSeriesRes,
                elevesRes,
                matieresRes,
                matieresSeriesRes,
                seriesRes,
                studentDataRes,
                gradeDataRes
            ] = await Promise.allSettled([
                api.get('/classes'),
                api.get('/classes/effectifParClasse'),
                api.get('/classes-with-series'),
                api.get('/eleves'),
                api.get('/matieres'),
                api.get('/matieres-with-series'),
                api.get('/series'),
                api.get('/stats/effectifs'),
                api.get('/stats/repartition-notes')
            ]);

            // Traiter les résultats
            const newData = {
                classes: classeSeriesRes.status === 'fulfilled' ? classeSeriesRes.value.data : [],
                classes1: classes1Res.status === 'fulfilled' ? classes1Res.value.data : [],
                eleves: elevesRes.status === 'fulfilled' ? elevesRes.value.data : [],
                matieres: matieresRes.status === 'fulfilled' ? matieresRes.value.data : [],
                matieresSeries: matieresSeriesRes.status === 'fulfilled' ? matieresSeriesRes.value.data : [],
                series: seriesRes.status === 'fulfilled' ? seriesRes.value.data : [],
                studentData: studentDataRes.status === 'fulfilled' ? studentDataRes.value.data : [],
                gradeData: gradeDataRes.status === 'fulfilled' ? gradeDataRes.value.data : [],
                notifications: [], // Initialisé vide, à charger si nécessaire ou via un endpoint dédié consolidé
                evenements: []     // Idem
            };

            // Ajouter les appels pour notifications et événements si disponibles dans l'API consolidée ou faire des appels séparés
            // Pour l'instant, nous allons faire des appels séparés si ces endpoints existent

            try {
                const [notifRes, eventRes] = await Promise.all([
                    api.get('/notifications'),
                    api.get('/evenements')
                ]);

                if (notifRes.data.success || Array.isArray(notifRes.data)) {
                    newData.notifications = notifRes.data.data || notifRes.data;
                }

                if (eventRes.data.success || Array.isArray(eventRes.data)) {
                    newData.evenements = eventRes.data.data || eventRes.data;
                }
            } catch (e) {
                console.warn("Impossible de charger les notifications ou événements", e);
            }

            // Mettre à jour le cache
            cache.data = newData;
            cache.timestamp = Date.now();

            setData(newData);
            setLoadingStates({
                classes: false,
                eleves: false,
                matieres: false,
                series: false,
                stats: false
            });

        } catch (err) {
            console.error('Erreur lors du chargement des données:', err);
            setError('Erreur lors du chargement des données. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    }, [skipCache]);

    // Charger les données au montage
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Fonction pour rafraîchir une section spécifique
    const refreshSection = useCallback(async (section) => {
        setLoadingStates(prev => ({ ...prev, [section]: true }));

        try {
            let response;
            switch (section) {
                case 'classes':
                    response = await api.get('/classes-with-series');
                    setData(prev => ({ ...prev, classes: response.data }));
                    break;
                case 'classes1':
                    response = await api.get('/classes/effectifParClasse');
                    setData(prev => ({ ...prev, classes1: response.data }));
                    break;
                case 'eleves':
                    response = await api.get('/eleves');
                    setData(prev => ({ ...prev, eleves: response.data }));
                    break;
                case 'matieres':
                    response = await api.get('/matieres');
                    setData(prev => ({ ...prev, matieres: response.data }));
                    break;
                case 'series':
                    response = await api.get('/series');
                    setData(prev => ({ ...prev, series: response.data }));
                    break;
                default:
                    break;
            }

            // Invalider le cache après une mise à jour
            cache.timestamp = null;

        } catch (err) {
            console.error(`Erreur lors du rafraîchissement de ${section}:`, err);
        } finally {
            setLoadingStates(prev => ({ ...prev, [section]: false }));
        }
    }, []);

    // Fonction pour invalider le cache et recharger
    const invalidateAndRefresh = useCallback(() => {
        cache.data = null;
        cache.timestamp = null;
        fetchAllData();
    }, [fetchAllData]);

    // Utilitaires dérivés
    const utils = useMemo(() => ({
        // Obtenir la catégorie d'une classe
        getClasseCategorie: (classeId) => {
            const classe = data.classes.find(c => c.id === parseInt(classeId));
            return classe?.categorie_classe || '';
        },

        // Obtenir les matières d'une série
        getMatieresBySerie: (serieId) => {
            if (!serieId) return [];
            const serie = data.series.find(s => s.id == serieId);
            return serie && serie.matieres ? serie.matieres : [];
        },

        // Obtenir la série par classe
        getSerieByClasse: (classeId) => {
            const classe = data.classes.find(c => c.id == classeId);
            return classe ? classe.serie_id : '';
        },

        // Trouver un élève
        findEleve: (eleveId) => {
            return data.eleves.find(e => e.id == eleveId);
        },

        // Trouver une classe
        findClasse: (classeId) => {
            return data.classes.find(c => c.id == classeId);
        },

        // Filtrer les élèves par classe
        getElevesByClasse: (classeId) => {
            return data.eleves.filter(e => e.class_id == classeId);
        }
    }), [data.classes, data.series, data.eleves]);

    return {
        // Données
        ...data,

        // États
        loading,
        loadingStates,
        error,

        // Actions
        refresh: invalidateAndRefresh,
        refreshSection,

        // Utilitaires
        ...utils
    };
};

export default useDashboardData;
