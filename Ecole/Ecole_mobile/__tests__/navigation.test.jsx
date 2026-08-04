/**
 * Tests de fumée — résolution de la navigation Érudit v4
 *
 * L'application n'a qu'un point d'entrée : `expo-router/entry`, qui monte le
 * répertoire `app/`. Ces tests vérifient que rien ne pointe dans le vide :
 * - chaque écran déclaré dans app/_layout.tsx existe sur le disque ;
 * - chaque dashboard cible d'un rôle existe et exporte bien un composant ;
 * - la traduction noms d'écran react-navigation → chemins expo-router est
 *   exacte.
 */

import fs from 'fs';
import path from 'path';

import {
  DASHBOARDS,
  creerNavigationProxy,
  hrefDashboard,
  resoudreHref,
} from '../src/navigation/routerBridge';

const RACINE_APP = path.join(__dirname, '..', 'app');

/** Modules de route chargés paresseusement : `require` prouve la résolution. */
const routesDashboard = {
  admin: () => require('../app/(app)/admin'),
  bibliothecaire: () => require('../app/(app)/bibliothecaire'),
  censeur: () => require('../app/(app)/censeur'),
  comptable: () => require('../app/(app)/comptable'),
  directeur: () => require('../app/(app)/directeur'),
  eleve: () => require('../app/(app)/eleve'),
  enseignant: () => require('../app/(app)/enseignant'),
  infirmier: () => require('../app/(app)/infirmier'),
  parent: () => require('../app/(app)/parent'),
  secretaire: () => require('../app/(app)/secretaire'),
  surveillant: () => require('../app/(app)/surveillant'),
  universite: () => require('../app/(app)/universite'),
};

describe('point d’entrée', () => {
  it('n’expose qu’un seul point d’entrée : expo-router/entry', () => {
    const pkg = require('../package.json');
    expect(pkg.main).toBe('expo-router/entry');
    expect(require.resolve('expo-router/entry')).toContain('expo-router');

    // L'ancien App.js de react-navigation ne doit plus concurrencer app/.
    expect(fs.existsSync(path.join(__dirname, '..', 'App.js'))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, '..', 'App.jsx'))).toBe(false);
    expect(fs.existsSync(path.join(RACINE_APP, '_layout.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(RACINE_APP, 'index.tsx'))).toBe(true);
  });

  it('déclare le plugin expo-router et un scheme pour les liens profonds', () => {
    const { expo } = require('../app.json');
    expect(expo.plugins).toContain('expo-router');
    expect(expo.scheme).toBeTruthy();
  });
});

describe('routes déclarées dans app/_layout.tsx', () => {
  const layout = fs.readFileSync(path.join(RACINE_APP, '_layout.tsx'), 'utf8');
  const declarees = [...layout.matchAll(/<Stack\.Screen\s+name="([^"]+)"/g)].map((m) => m[1]);

  it('en déclare au moins une', () => {
    expect(declarees.length).toBeGreaterThan(0);
  });

  it.each(declarees)('l’écran « %s » a un fichier ou un groupe correspondant', (nom) => {
    const candidats = [
      path.join(RACINE_APP, `${nom}.tsx`),
      path.join(RACINE_APP, `${nom}.jsx`),
      path.join(RACINE_APP, `${nom}.js`),
      path.join(RACINE_APP, nom), // groupe de routes, ex. (app)
    ];
    expect(candidats.some((c) => fs.existsSync(c))).toBe(true);
  });
});

describe('dashboards par rôle', () => {
  it('chaque dashboard connu a un fichier de route dans app/(app)/', () => {
    for (const dashboard of DASHBOARDS) {
      expect(fs.existsSync(path.join(RACINE_APP, '(app)', `${dashboard}.tsx`))).toBe(true);
    }
  });

  it.each(DASHBOARDS)('la route « %s » exporte un composant', (dashboard) => {
    const composant = routesDashboard[dashboard]().default;
    expect(typeof composant).toBe('function');
  });

  it('mappe les rôles de l’API Laravel vers un dashboard existant', () => {
    const rolesApi = [
      'admin',
      'super-admin',
      'bibliothecaire',
      'censeur',
      'comptable',
      'directeur',
      'doyen',
      'eleve',
      'enseignant',
      'etudiant',
      'infirmier',
      'parent',
      'professeur',
      'recteur',
      'secretaire',
      'surveillant',
    ];

    for (const role of rolesApi) {
      const href = hrefDashboard(role);
      expect(href).toMatch(/^\/\(app\)\/[a-z]+$/);
      const nom = href.replace('/(app)/', '');
      expect(DASHBOARDS).toContain(nom);
      expect(fs.existsSync(path.join(RACINE_APP, '(app)', `${nom}.tsx`))).toBe(true);
    }
  });

  it('renvoie null plutôt qu’une route inexistante pour un rôle sans espace mobile', () => {
    expect(hrefDashboard('personnel')).toBeNull();
    expect(hrefDashboard('role-inconnu')).toBeNull();
    expect(hrefDashboard(undefined)).toBeNull();
    expect(hrefDashboard('')).toBeNull();
  });
});

describe('pont react-navigation → expo-router', () => {
  it('traduit les noms d’écran hérités en chemins de fichiers', () => {
    expect(resoudreHref('Login')).toBe('/');
    expect(resoudreHref('ForgotPassword')).toBe('/MotDePasseOublie');
    expect(resoudreHref('ResetPassword')).toBe('/reset-password');
  });

  it('laisse passer les chemins absolus et retombe sur la connexion sinon', () => {
    expect(resoudreHref('/(app)/directeur')).toBe('/(app)/directeur');
    expect(resoudreHref('EcranQuiNExistePas')).toBe('/');
  });

  it('les cibles héritées correspondent à des fichiers de route réels', () => {
    expect(fs.existsSync(path.join(RACINE_APP, 'index.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(RACINE_APP, 'MotDePasseOublie.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(RACINE_APP, 'reset-password.tsx'))).toBe(true);
  });

  it('délègue push / replace / back au routeur expo-router', () => {
    const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
    const navigation = creerNavigationProxy(router);

    navigation.navigate('ForgotPassword');
    navigation.replace('/(app)/eleve');
    navigation.goBack();

    expect(router.push).toHaveBeenCalledWith('/MotDePasseOublie');
    expect(router.replace).toHaveBeenCalledWith('/(app)/eleve');
    expect(router.back).toHaveBeenCalled();
  });
});
