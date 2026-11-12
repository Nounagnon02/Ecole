/**
 * FormDialog — un petit formulaire dans une boîte de dialogue.
 *
 * Les pages de service (planning, secrétariat, infirmerie, bibliothèque)
 * avaient chacune un bouton « Nouveau… » qui n'ouvrait rien. Ce composant
 * porte ce qu'elles ont en commun : champs obligatoires signalés avant
 * l'envoi, erreurs de validation de l'API sous le bon champ, autre refus en
 * bas, bouton occupé pendant l'envoi.
 *
 * fields : [{ name, label, type?: 'text'|'date'|'datetime-local'|'time'|'number'|'textarea'|'select'|'tel'|'email',
 *            options?: [{value,label}], required?, helperText?, placeholder?, min?, max? }]
 * onSubmit(valeurs) : promesse ; un rejet de l'API est affiché, le succès ferme.
 */

import { useEffect, useId, useState } from 'react';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import Select from './Select';
import { useTranslation } from '@/shared/i18n';

const initialiser = (fields, initial) => Object.fromEntries(fields.map((f) => [f.name, initial?.[f.name] ?? '']));

export default function FormDialog({ open, title, fields, initial, onSubmit, onClose, submitLabel }) {
  const { t } = useTranslation();
  const idBase = useId();
  const [valeurs, setValeurs] = useState(() => initialiser(fields, initial));
  const [erreurs, setErreurs] = useState({});
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (open) { setValeurs(initialiser(fields, initial)); setErreurs({}); setErreur(null); setEnvoi(false); }
  }, [open]); // eslint-disable-line

  const fermer = () => { if (!envoi) onClose(); };

  const envoyer = async (evenement) => {
    evenement.preventDefault();
    const manquants = Object.fromEntries(fields
      .filter((f) => f.required && String(valeurs[f.name] ?? '').trim() === '')
      .map((f) => [f.name, t('common.champ_obligatoire')]));
    setErreurs(manquants);
    if (Object.keys(manquants).length) return;

    const nettoyees = Object.fromEntries(Object.entries(valeurs).map(([k, v]) => {
      const champ = fields.find((f) => f.name === k);
      const texte = typeof v === 'string' ? v.trim() : v;
      if (texte === '') return [k, null];
      return [k, champ?.type === 'number' ? Number(texte) : texte];
    }));

    setEnvoi(true);
    setErreur(null);
    try {
      await onSubmit(nettoyees);
      onClose();
    } catch (err) {
      const details = err?.errors ?? {};
      const connus = Object.fromEntries(Object.entries(details).filter(([k]) => fields.some((f) => f.name === k)).map(([k, v]) => [k, v?.[0]]));
      setErreurs(connus);
      const autres = Object.entries(details).filter(([k]) => !connus[k]).flatMap(([, v]) => v);
      setErreur(Object.keys(connus).length && !autres.length ? null : (autres.join(' ') || err?.message || t('common.erreur_enregistrement')));
      setEnvoi(false);
    }
  };

  return (
    <Modal open={open} onClose={fermer} title={title} size="md">
      <form onSubmit={envoyer} className="space-y-4 p-5" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => {
            const commun = {
              key: f.name,
              label: f.required ? f.label : f.label,
              value: valeurs[f.name] ?? '',
              onChange: (e) => { setValeurs((c) => ({ ...c, [f.name]: e.target.value })); setErreurs((c) => ({ ...c, [f.name]: undefined })); },
              error: erreurs[f.name],
              required: f.required,
              helperText: f.helperText,
            };
            if (f.type === 'select') {
              return <Select {...commun} options={f.options ?? []} placeholder={f.placeholder ?? t('common.choisir')} />;
            }
            if (f.type === 'textarea') {
              const id = `${idBase}-${f.name}`;
              return (
                <div key={f.name} className="sm:col-span-2">
                  <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">{f.label}</label>
                  <textarea
                    id={id} rows={3} value={commun.value} onChange={commun.onChange} aria-invalid={erreurs[f.name] ? true : undefined}
                    aria-describedby={erreurs[f.name] ? `${id}-erreur` : undefined}
                    className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  />
                  {erreurs[f.name] && <p id={`${id}-erreur`} className="mt-1 text-sm text-[var(--error)]">{erreurs[f.name]}</p>}
                </div>
              );
            }
            return <Input {...commun} type={f.type ?? 'text'} placeholder={f.placeholder} min={f.min} max={f.max} />;
          })}
        </div>
        {erreur && <p role="alert" className="text-sm text-[var(--error)]">{erreur}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={fermer} disabled={envoi}>{t('common.cancel')}</Button>
          <Button type="submit" loading={envoi}>{submitLabel ?? t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
