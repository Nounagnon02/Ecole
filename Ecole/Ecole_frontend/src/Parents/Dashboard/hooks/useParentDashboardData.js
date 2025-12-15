import { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import axios from 'axios';

export const useParentDashboardData = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [parentData, setParentData] = useState(null);
    const [children, setChildren] = useState([]);
    const [bulletins, setBulletins] = useState({});
    const [bulletinLoading, setBulletinLoading] = useState({});
    const [bulletinErrors, setBulletinErrors] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [emploisDuTemps, setEmploisDuTemps] = useState({});
    const [currentPeriode, setCurrentPeriode] = useState('Semestre 1');

    // Mocks (to be replaced by API calls if available)
    const [absences] = useState({
        1: [
            { date: "2025-05-28", reason: "Maladie", justified: true },
            { date: "2025-05-15", reason: "Rendez-vous médical", justified: true }
        ],
        2: [
            { date: "2025-05-20", reason: "Maladie", justified: true }
        ]
    });

    const getParentId = useCallback(() => {
        const possibleKeys = ['parentId', 'userId', 'user_id', 'id'];
        for (const key of possibleKeys) {
            const id = localStorage.getItem(key) || sessionStorage.getItem(key);
            if (id) return id;
        }
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                if (userObj.id) return userObj.id;
            } catch (e) { console.error(e); }
        }
        return null;
    }, []);

    const fetchChildBulletin = useCallback(async (childId, periode = currentPeriode) => {
        try {
            setBulletinLoading(prev => ({ ...prev, [childId]: true }));
            setBulletinErrors(prev => ({ ...prev, [childId]: null }));

            const token = localStorage.getItem('token');
            const response = await api.get(`/eleves/${childId}/bulletin`, {
                params: { periode },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.data?.success) {
                setBulletins(prev => ({
                    ...prev,
                    [childId]: { ...response.data.data, periode }
                }));
            } else {
                throw new Error(response.data?.message || 'Données invalides');
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Erreur chargement bulletin';
            setBulletinErrors(prev => ({ ...prev, [childId]: msg }));
        } finally {
            setBulletinLoading(prev => ({ ...prev, [childId]: false }));
        }
    }, [currentPeriode]);

    const fetchNotifications = useCallback(async () => {
        try {
            const parentId = getParentId();
            if (!parentId) return;
            // Remplacer par un vrai appel API si disponible, sinon mock
            // const res = await api.get(`/parents/${parentId}/notifications`);
            // setNotifications(res.data);

            // Mock temporaire pour la transition
            setNotifications([
                { id: 1, type: 'info', message: 'Réunion parents-profs le 15 juin', read: false },
                { id: 2, type: 'warning', message: 'Bulletin du Semestre 1 disponible', read: true }
            ]);
        } catch (error) {
            console.error(error);
        }
    }, [getParentId]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const parentId = getParentId();
            if (!parentId) throw new Error("Session expirée");

            const token = localStorage.getItem('token');
            if (!token) throw new Error("Token manquant");

            const response = await api.get(`/parents/${parentId}/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.data.success) throw new Error(response.data.message);

            setParentData(response.data.data.parent);
            const childrenData = response.data.data.children || [];
            setChildren(childrenData);

            // Fetch bulletins for all children
            if (childrenData.length > 0) {
                await Promise.all(childrenData.map(child => fetchChildBulletin(child.id, currentPeriode)));
            }

            fetchNotifications();

        } catch (err) {
            console.error(err);
            setError(err.message || 'Erreur chargement');
            if (err.response?.status === 401) {
                window.location.href = '/Connexion';
            }
        } finally {
            setLoading(false);
        }
    }, [getParentId, currentPeriode, fetchChildBulletin, fetchNotifications]);

    return {
        loading,
        error,
        parentData,
        children,
        bulletins,
        bulletinLoading,
        bulletinErrors,
        notifications,
        absences,
        currentPeriode,
        setCurrentPeriode,
        refresh: fetchDashboardData,
        fetchChildBulletin
    };
};
