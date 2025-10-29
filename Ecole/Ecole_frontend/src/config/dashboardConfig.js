// Configuration centralisée pour tous les dashboards

export const API_ENDPOINTS = {
  // Endpoints communs
  classes: '/classes',
  matieres: '/matieres',
  series: '/series',
  eleves: '/eleves',
  enseignants: '/enseignants',
  parents: '/parents',
  notes: '/notes',
  
  // Endpoints avec relations
  classesWithSeries: '/classes-with-series',
  matieresWithSeries: '/matieres-with-series',
  withSeriesMatieres: '/with-series-matieres',
  
  // Endpoints de statistiques
  stats: {
    effectifs: '/stats/effectifs',
    repartitionNotes: '/stats/repartition-notes',
    effectifsMaternelle: '/stats/effectifs-maternelle',
    effectifsPrimaire: '/stats/effectifs-primaire',
    effectifsSecondaire: '/stats/effectifs-secondaire'
  },
  
  // Endpoints spécialisés
  classesEffectif: '/classes/effectifParClasse',
  notesFilter: '/notes/filter',
  notesImport: '/notes/import'
};

export const EVALUATION_TYPES = {
  maternelle: [
    { value: '1ère evaluation', label: '1ère évaluation' },
    { value: '2ème evaluation', label: '2ème évaluation' },
    { value: '3ème evaluation', label: '3ème évaluation' },
    { value: '4ème evaluation', label: '4ème évaluation' },
    { value: '5ème evaluation', label: '5ème évaluation' }
  ],
  primaire: [
    { value: '1ère evaluation', label: '1ère évaluation' },
    { value: '2ème evaluation', label: '2ème évaluation' },
    { value: '3ème evaluation', label: '3ème évaluation' },
    { value: '4ème evaluation', label: '4ème évaluation' },
    { value: '5ème evaluation', label: '5ème évaluation' }
  ],
  secondaire: [
    { value: 'Devoir1', label: 'Devoir 1' },
    { value: 'Devoir2', label: 'Devoir 2' },
    { value: 'Interrogation', label: 'Interrogation écrite' }
  ]
};

export const PERIODES = [
  { value: 'Semestre 1', label: 'Semestre 1' },
  { value: 'Semestre 2', label: 'Semestre 2' }
];

export const SUCCESS_MESSAGES = {
  created: 'Élément créé avec succès',
  updated: 'Élément mis à jour avec succès',
  deleted: 'Élément supprimé avec succès',
  imported: 'Données importées avec succès'
};