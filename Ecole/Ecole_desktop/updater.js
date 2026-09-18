/**
 * Mise à jour automatique.
 *
 * Les binaires étaient distribués sans aucun chemin de mise à jour : une
 * version installée le restait, correctifs de sécurité compris. Le
 * `package.json` annonçait pourtant l'intention, sans dépendance ni code.
 *
 * `electron-updater` ne fait rien en développement ni sans configuration de
 * publication : ce module est donc sûr à charger en toutes circonstances, et
 * silencieux tant que `build.publish` n'est pas renseigné.
 */

const { app, dialog } = require('electron');

/** Journalisation minimale, préfixée pour être repérable dans les logs. */
function journal(message, extra) {
  if (extra) console.log(`[maj] ${message}`, extra);
  else console.log(`[maj] ${message}`);
}

/**
 * Brancher la recherche de mises à jour.
 *
 * @param {import('electron').BrowserWindow|null} fenetre
 * @param {{devMode?: boolean}} options
 */
function initialiserMisesAJour(fenetre, { devMode = false } = {}) {
  if (devMode || !app.isPackaged) {
    journal('désactivée hors application packagée');
    return null;
  }

  let autoUpdater;
  try {
    ({ autoUpdater } = require('electron-updater'));
  } catch (erreur) {
    // Absence de la dépendance : l'application doit démarrer quand même.
    journal('electron-updater indisponible, mise à jour ignorée', erreur.message);
    return null;
  }

  // Le téléchargement est explicite : une mise à jour ne doit pas consommer
  // la bande passante d'un établissement sans que personne ne l'ait voulu.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (erreur) => {
    // Un serveur de publication injoignable ne doit pas remonter à
    // l'utilisateur : ce n'est pas son problème, et l'application fonctionne.
    journal('erreur', erreur?.message ?? erreur);
  });

  autoUpdater.on('update-available', async (info) => {
    journal('version disponible', info?.version);

    const { response } = await dialog.showMessageBox(fenetre ?? undefined, {
      type: 'info',
      buttons: ['Télécharger', 'Plus tard'],
      defaultId: 0,
      cancelId: 1,
      title: 'Mise à jour disponible',
      message: `La version ${info?.version ?? 'suivante'} est disponible.`,
      detail: "Elle sera installée à la prochaine fermeture de l'application.",
    });

    if (response === 0) autoUpdater.downloadUpdate().catch((e) => journal('téléchargement échoué', e?.message));
  });

  autoUpdater.on('update-downloaded', (info) => {
    journal('téléchargée', info?.version);
    if (fenetre && !fenetre.isDestroyed()) {
      fenetre.webContents.send('maj:prete', { version: info?.version ?? null });
    }
  });

  autoUpdater.checkForUpdates().catch((e) => journal('vérification échouée', e?.message));

  return autoUpdater;
}

module.exports = { initialiserMisesAJour };
