import React from 'react';
import GenericDashboard from '../components/GenericDashboard';

const DashboardP = () => {
  const endpoints = {
    effectifEnseignants: '/enseignants/effectif/primaire',
    effectifClasses: '/classes/effectif/primaire',
    eleves: '/elevesP',
    classes: '/classesP',
    filterNotes: '/notes/filter/primaire',
    statsEleves: '/stats/effectifs-primaire',
    statsNotes: '/stats/repartition-notes-primaire',
    matieres: '/matieres/primaire'
  };

  const evaluationTypes = [
    { value: "1ère evaluation", label: "1ère évaluation" },
    { value: "2ème evaluation", label: "2ème évaluation" },
    { value: "3ème evaluation", label: "3ème évaluation" },
    { value: "4ème evaluation", label: "4ème évaluation" },
    { value: "5ème evaluation", label: "5ème évaluation" }
  ];

  return (
    <GenericDashboard
      title="Tableau de bord Directeur Primaire"
      role="primaire"
      endpoints={endpoints}
      evaluationTypes={evaluationTypes}
    />
  );
};

export default DashboardP;
