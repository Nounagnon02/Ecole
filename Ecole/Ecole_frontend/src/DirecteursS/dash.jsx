import React from 'react';
import GenericDashboard from '../components/GenericDashboard';

const DashboardS = () => {
  const endpoints = {
    effectifEnseignants: '/enseignants/effectif/secondaire',
    effectifClasses: '/classes/effectif/secondaire',
    eleves: '/elevesS',
    classes: '/classesS',
    filterNotes: '/notes/filter/secondaire',
    statsEleves: '/stats/effectifs-secondaire',
    statsNotes: '/stats/repartition-notes-secondaire',
    matieres: '/matieres/secondaire'
  };

  const evaluationTypes = [
    { value: "Devoir1", label: "Devoir 1" },
    { value: "Devoir2", label: "Devoir 2" },
    { value: "Interrogation", label: "Interrogation écrite" },
    { value: "Composition", label: "Composition" }
  ];

  return (
    <GenericDashboard
      title="Tableau de bord Directeur Secondaire"
      role="secondaire"
      endpoints={endpoints}
      evaluationTypes={evaluationTypes}
    />
  );
};

export default DashboardS;