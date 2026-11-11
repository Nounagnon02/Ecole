/**
 * ImportDialog — inscription en masse depuis un fichier CSV.
 *
 * Un seul fichier pour les élèves (avec leur parent), les parents, les
 * enseignants et le personnel. Le fichier est d'abord contrôlé sans rien
 * créer ; l'import n'est proposé que s'il est entièrement valide, et les
 * accès provisoires sont remis une seule fois, sous forme de fichier.
 */

import { useEffect, useRef, useState } from 'react';
import { Download, FileUp } from 'lucide-react';
import apiClient from '@/shared/lib/api-client';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import { useTranslation } from '@/shared/i18n';

export const COLONNES = ['role', 'nom', 'prenom', 'telephone', 'email', 'classe', 'matricule', 'sexe', 'date_naissance', 'parent_nom', 'parent_prenom', 'parent_telephone'];

const MODELE = [
  COLONNES.join(';'),
  'eleve;DOSSOU;Afi;;;6ème;;F;14/03/2014;DOSSOU;Koffi;0197000001',
  'eleve;DOSSOU;Sena;;;CM2;;M;02/09/2016;DOSSOU;Koffi;0197000001',
  'enseignant;HOUNKPE;Marie;0196000002;marie@exemple.bj;;;;;;;',
  'secretaire;ZINSOU;Paul;0196000003;;;;;;;;',
].join('\r\n');

const cellule = (v) => { const texte = String(v ?? ''); return /[;"\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte; };

function telecharger(nom, contenu) {
  // BOM : sans lui, un tableur réglé en français affiche mal les accents.
  const url = URL.createObjectURL(new Blob(['﻿' + contenu], { type: 'text/csv;charset=utf-8' }));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}

export default function ImportDialog({ open, onClose, onDone }) {
  const { t } = useTranslation();
  const p = (cle, valeurs) => t(`pages.eleves.import.${cle}`, valeurs);
  const champ = useRef(null);
  const [fichier, setFichier] = useState(null);
  const [controle, setControle] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [accesRecuperes, setAccesRecuperes] = useState(false);
  const [creerClasses, setCreerClasses] = useState(false);

  useEffect(() => {
    if (open) { setFichier(null); setControle(null); setResultat(null); setErreur(null); setEnvoi(false); setAccesRecuperes(false); setCreerClasses(false); }
  }, [open]);

  const envoyer = async (choisi, simulation, avecClasses = creerClasses) => {
    const corps = new FormData();
    corps.append('file', choisi);
    if (simulation) corps.append('simulation', '1');
    if (avecClasses) corps.append('creer_classes', '1');
    setEnvoi(true);
    setErreur(null);
    try {
      // Le client envoie du JSON par défaut : sans cet en-tête, axios
      // convertirait le formulaire en objet et le fichier serait perdu.
      const { data } = await apiClient.post('/imports/comptes', corps, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data;
    } catch (err) {
      setErreur(err?.message ?? p('echec'));
      return null;
    } finally {
      setEnvoi(false);
    }
  };

  const choisir = async (evenement) => {
    const choisi = evenement.target.files?.[0];
    if (!choisi) return;
    setFichier(choisi);
    setControle(null);
    setCreerClasses(false);
    setControle(await envoyer(choisi, true, false));
  };

  // L'agent a vu la liste des classes inconnues et demande leur création :
  // le fichier est recontrôlé avec cette option, puis importé avec elle.
  const basculerClasses = async (evenement) => {
    const voulu = evenement.target.checked;
    setCreerClasses(voulu);
    setControle(await envoyer(fichier, true, voulu));
  };

  const importer = async () => {
    const data = await envoyer(fichier, false);
    if (!data) return;
    if (data.success) { setResultat(data); onDone?.(data); } else { setControle(data); }
  };

  const telechargerAcces = () => {
    telecharger(
      `acces-${new Date().toISOString().slice(0, 10)}.csv`,
      [['role', 'nom', 'identifiant', 'mot_de_passe_provisoire'], ...resultat.acces.map((a) => [a.role, a.nom, a.identifiant, a.mot_de_passe_provisoire])]
        .map((ligne) => ligne.map(cellule).join(';')).join('\r\n'),
    );
    setAccesRecuperes(true);
  };

  const fermer = () => {
    if (envoi) return;
    // Les mots de passe provisoires ne peuvent pas être réaffichés.
    if (resultat?.acces?.length && !accesRecuperes && !window.confirm(p('fermer_sans_acces'))) return;
    onClose();
  };

  const libelleRole = (role) => {
    const cle = `pages.eleves.import.roles.${role}`;
    const texte = t(cle);
    return texte === cle ? role : texte;
  };
  const comptes = (crees) => Object.entries(crees ?? {}).map(([role, nombre]) => `${nombre} ${libelleRole(role)}`).join(', ');

  return (
    <Modal open={open} onClose={fermer} title={p('titre')} size="lg">
      {resultat ? (
        <div className="space-y-4 p-5">
          <p role="status" className="text-sm text-[var(--text-primary)]">{p('fait', { comptes: comptes(resultat.crees) })}</p>
          <p className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--text-secondary)]">{p('acces_une_fois')}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button icon={<Download size={16} />} onClick={telechargerAcces}>{p('telecharger_acces', { nombre: resultat.acces.length })}</Button>
            <Button variant="outline" onClick={fermer}>{p('terminer')}</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-5">
          <p className="text-sm text-[var(--text-secondary)]">{p('aide')}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
            <li>{p('aide_eleve')}</li>
            <li>{p('aide_personnel')}</li>
            <li>{p('aide_tout_ou_rien')}</li>
          </ul>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" icon={<Download size={16} />} onClick={() => telecharger('modele-inscription.csv', MODELE)}>{p('modele')}</Button>
            <Button icon={<FileUp size={16} />} onClick={() => champ.current?.click()} loading={envoi && !controle}>{fichier ? p('autre_fichier') : p('choisir')}</Button>
            <input ref={champ} type="file" accept=".csv,text/csv" className="sr-only" aria-label={p('fichier')} onChange={choisir} />
          </div>
          {fichier && <p className="text-sm text-[var(--text-primary)]">{p('fichier_choisi', { nom: fichier.name })}</p>}
          {erreur && <p role="alert" className="text-sm text-[var(--error)]">{erreur}</p>}

          {fichier && (creerClasses || controle?.classes_inconnues?.length > 0) && (
            <label className="flex items-start gap-2 rounded-md border border-[var(--border)] p-3 text-sm text-[var(--text-primary)]">
              <input type="checkbox" className="mt-0.5" checked={creerClasses} onChange={basculerClasses} disabled={envoi} />
              <span>
                {creerClasses
                  ? p('classes_a_creer', { classes: (controle?.classes_creees ?? []).join(', ') })
                  : p('creer_classes', { nombre: controle.classes_inconnues.length, classes: controle.classes_inconnues.join(', ') })}
              </span>
            </label>
          )}

          {controle?.success && (
            <div role="status" className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] p-3 text-sm text-[var(--text-primary)]">
              {p('pret', { total: controle.total, comptes: comptes(controle.crees) })}
            </div>
          )}

          {controle && !controle.success && (
            <div role="alert" className="space-y-2">
              <p className="text-sm font-medium text-[var(--error)]">{p('refuse', { nombre: controle.erreurs.length })}</p>
              <div className="max-h-64 overflow-y-auto rounded-md border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                    <th scope="col" className="px-3 py-2 font-medium">{p('ligne')}</th>
                    <th scope="col" className="px-3 py-2 font-medium">{p('probleme')}</th>
                  </tr></thead>
                  <tbody>
                    {controle.erreurs.map((e, i) => (
                      <tr key={`${e.ligne}-${i}`} className="border-b border-[var(--border-light)] last:border-0">
                        <td className="px-3 py-2 tabular-nums">{e.ligne}</td>
                        <td className="px-3 py-2">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={fermer} disabled={envoi}>{t('common.cancel')}</Button>
            {controle?.success && <Button onClick={importer} loading={envoi}>{p('importer', { total: controle.total })}</Button>}
          </div>
        </div>
      )}
    </Modal>
  );
}
