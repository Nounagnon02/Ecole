import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';

export const useEnseignantDashboardData = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enseignantData, setEnseignantData] = useState(null);
    const [classes, setClasses] = useState([]);
    const [emploiTemps, setEmploiTemps] = useState([]);
    const [devoirs, setDevoirs] = useState([]);

    // Notifications mock or API
    const [notifications, setNotifications] = useState([]);

    const fetchEnseignantData = useCallback(async () => {
        try {
            setLoading(true);
            const userId = localStorage.getItem('userId');
            if (!userId) throw new Error("ID Enseignant manquant");

            const [classesRes, emploiRes, devoirsRes] = await Promise.all([
                api.get(`/enseignants/${userId}/classes`, { params: { enseignant_id: userId } }),
                api.get(`/enseignants/${userId}/emploi-temps`, { params: { enseignant_id: userId } }),
                api.get('/devoirs', { params: { enseignant_id: userId } }) // Assuming API supports filter
            ]);

            setClasses(classesRes.data.success ? classesRes.data.data : []);
            setEmploiTemps(emploiRes.data.success ? emploiRes.data.data : []);
            setDevoirs(devoirsRes.data?.success || Array.isArray(devoirsRes.data) ? (devoirsRes.data.data || devoirsRes.data) : []);

            // Mock profile data for now if not fetched separately
            setEnseignantData({
                id: userId,
                nom: localStorage.getItem('userName') || 'Enseignant'
            });

        } catch (err) {
            console.error(err);
            setError("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEnseignantData();
    }, [fetchEnseignantData]);

    return {
        loading,
        error,
        enseignantData,
        classes,
        emploiTemps,
        devoirs,
        notifications,
        refresh: fetchEnseignantData
    };
};
