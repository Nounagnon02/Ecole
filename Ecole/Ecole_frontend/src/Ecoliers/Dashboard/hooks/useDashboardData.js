/**
 * useDashboardData — Hook de données pour le tableau de bord Élève
 *
 * Centralise les données mockées ou réelles pour le dashboard élève.
 * Extension future : remplacer les données statiques par des appels API.
 */
import { useState } from 'react';

// Données statiques (remplacer par des appels API quand le backend sera prêt)
const gradeData = [
  { subject: 'Mathématiques', note: 15, moyenne: 13 },
  { subject: 'Français', note: 14, moyenne: 12 },
  { subject: 'Histoire-Géo', note: 16, moyenne: 14 },
  { subject: 'Sciences', note: 17, moyenne: 15 },
  { subject: 'Anglais', note: 13, moyenne: 12 },
  { subject: 'Sport', note: 18, moyenne: 15 },
];

const attendanceData = [
  { month: 'Septembre', présence: 98 },
  { month: 'Octobre', présence: 96 },
  { month: 'Novembre', présence: 94 },
  { month: 'Décembre', présence: 92 },
  { month: 'Janvier', présence: 95 },
  { month: 'Février', présence: 97 },
];

const courseCompletion = [
  { name: 'Complété', value: 68 },
  { name: 'À faire', value: 32 },
];

const upcomingAssignments = [
  { id: 1, title: 'Dissertation Français', dueDate: '20 Mai 2025', subject: 'Français', status: 'À faire' },
  { id: 2, title: 'Projet Sciences', dueDate: '22 Mai 2025', subject: 'Sciences', status: 'En cours' },
  { id: 3, title: 'Exercices Mathématiques', dueDate: '25 Mai 2025', subject: 'Mathématiques', status: 'À faire' },
];

const schedule = [
  { id: 1, title: 'Mathématiques', time: '08:00 - 09:30', room: 'Salle B201', teacher: 'M. Dupont' },
  { id: 2, title: 'Français', time: '09:45 - 11:15', room: 'Salle C102', teacher: 'Mme Bernard' },
  { id: 3, title: 'Pause déjeuner', time: '11:15 - 12:30', room: '', teacher: '' },
  { id: 4, title: 'Histoire-Géo', time: '12:30 - 14:00', room: 'Salle A305', teacher: 'M. Leroy' },
  { id: 5, title: 'Sciences', time: '14:15 - 15:45', room: 'Labo S103', teacher: 'Mme Petit' },
];

const notifications = [
  { id: 1, message: 'Note de mathématiques disponible', date: "Aujourd'hui, 10:30" },
  { id: 2, message: 'Nouveau document partagé par M. Martin', date: 'Hier, 15:45' },
  { id: 3, message: 'Rappel: Remise du devoir de français', date: '18/05, 09:15' },
];

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'];

export function useDashboardData() {
  const [expandedSection, setExpandedSection] = useState('progressions');

  const toggleSection = (section) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return {
    gradeData,
    attendanceData,
    courseCompletion,
    upcomingAssignments,
    schedule,
    notifications,
    COLORS,
    expandedSection,
    toggleSection,
  };
}
