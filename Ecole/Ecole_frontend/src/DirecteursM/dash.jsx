import React from 'react';
import GenericDashboard from '../components/GenericDashboard';

const DashboardM = () => {
  const endpoints = {
    effectifEnseignants: '/enseignants/effectif/maternelle',
    effectifClasses: '/classes/effectif/maternelle',
    eleves: '/elevesM',
    classes: '/classesM',
    filterNotes: '/notes/filterM'
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
      title="Tableau de bord Directeur Maternelle"
      role="maternelle"
      endpoints={endpoints}
      evaluationTypes={evaluationTypes}
    />
  );
};

export default DashboardM;
