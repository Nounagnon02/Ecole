/**
 * AffectationsPage — Gestion des affectations des enseignants (direction)
 *
 * Deux cycles, un seul contrat serveur :
 *  - Secondaire : un enseignant est affecté à un triplet classe x série x
 *    matière via le pivot `enseignant_matiere` (GET/POST/DELETE
 *    /enseignants/{id}/affectations).
 *  - Maternelle & Primaire : un enseignant enseigne une classe entière
 *    (GET /enseignants-mp, POST /enseignants-mp/{id}/affectation).
 *
 * Le formulaire d'ajout respecte la règle serveur : la matière doit être
 * rattachée à la série de la classe (cascade classe -> série -> matière).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Trash2, Plus, Users, Loader2, RefreshCw, BookOpen } from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Select from '@/shared/components/ui/Select';
import { Tabs } from '@/shared/components/ui/Tabs';
import { useApi } from '@/hooks/useApi';

/** Normalise { success, data } | tableau nu | tableau. */
function unwrap(res) {
  return Array.isArray(res?.data?.data) ? res.data.data
    : Array.isArray(res?.data) ? res.data
    : Array.isArray(res) ? res
    : [];
}

const NOM_ENSEIGNANT = (e) =>
  [e?.user?.name, e?.user?.prenom].filter(Boolean).join(' ').trim() || 'Enseignant';

export default function AffectationsPage() {
  const { loading, error, clearError, get, post, delete: del } = useApi();

  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [mpTeachers, setMpTeachers] = useState([]);

  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [affectations, setAffectations] = useState([]);

  const [classeId, setClasseId] = useState('');
  const [serieId, setSerieId] = useState('');
  const [matiereId, setMatiereId] = useState('');

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  const loadAll = useCallback(async () => {
    clearError();
    try {
      const [tRes, cRes, mRes] = await Promise.all([
        get('/enseignants'),
        get('/classes', { params: { with_matieres: 1 } }),
        get('/enseignants-mp'),
      ]);
      setTeachers(unwrap(tRes));
      setClasses(unwrap(cRes));
      setMpTeachers(unwrap(mRes));
    } catch (e) {
      /* l'erreur est déjà exposée par useApi */
    }
  }, [get, clearError]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => String(t.id) === String(selectedTeacherId)) || null,
    [teachers, selectedTeacherId]
  );

  const loadAffectations = useCallback(async (teacherId) => {
    try {
      const res = await get(`/enseignants/${teacherId}/affectations`);
      setAffectations(unwrap(res));
    } catch (e) {
      setAffectations([]);
    }
  }, [get]);

  useEffect(() => {
    if (!selectedTeacherId) {
      setAffectations([]);
      return;
    }
    loadAffectations(selectedTeacherId);
  }, [selectedTeacherId, loadAffectations]);

  /* Cascade classe -> série -> matière */
  const currentClasse = useMemo(
    () => classes.find((c) => String(c.id) === String(classeId)) || null,
    [classes, classeId]
  );
  const seriesOptions = useMemo(
    () => (currentClasse?.series ?? []).map((s) => ({ value: s.id, label: s.nom })),
    [currentClasse]
  );
  const currentSerie = useMemo(
    () => (currentClasse?.series ?? []).find((s) => String(s.id) === String(serieId)) || null,
    [currentClasse, serieId]
  );
  const matieresOptions = useMemo(
    () => (currentSerie?.matieres ?? []).map((m) => ({ value: m.id, label: m.nom })),
    [currentSerie]
  );

  const canAdd = Boolean(selectedTeacher && classeId && serieId && matiereId);

  const handleAdd = async () => {
    if (!canAdd) return;
    setSaving(true);
    setActionError(null);
    try {
      const res = await post(`/enseignants/${selectedTeacherId}/affectations`, {
        affectations: [
          {
            classe_id: Number(classeId),
            serie_id: Number(serieId),
            matiere_id: Number(matiereId),
          },
        ],
      });
      setAffectations(unwrap(res));
      setClasseId('');
      setSerieId('');
      setMatiereId('');
    } catch (e) {
      clearError();
      setActionError(e.response?.data?.message || e.message || "L'affectation a été refusée");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (affectationId) => {
    if (!selectedTeacher) return;
    setActionError(null);
    try {
      const res = await del(`/enseignants/${selectedTeacherId}/affectations/${affectationId}`);
      setAffectations(unwrap(res));
    } catch (e) {
      clearError();
      setActionError(e.response?.data?.message || e.message || 'Le retrait a échoué');
    }
  };

  const handleMpChange = async (mpTeacherId, newClassId) => {
    if (!newClassId) return;
    setActionError(null);
    try {
      const res = await post(`/enseignants-mp/${mpTeacherId}/affectation`, {
        classe_id: Number(newClassId),
      });
      const updated = res?.data?.data ?? unwrap(res);
      setMpTeachers((prev) =>
        prev.map((t) => (String(t.id) === String(mpTeacherId) ? { ...t, ...updated } : t))
      );
    } catch (e) {
      clearError();
      setActionError(e.response?.data?.message || e.message || "L'affectation a été refusée");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <RefreshCw className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={loadAll}>
          Réessayer
        </Button>
      </div>
    );
  }

  const teacherOptions = teachers.map((t) => ({
    value: t.id,
    label: NOM_ENSEIGNANT(t),
  }));
  const classeOptions = classes.map((c) => ({
    value: c.id,
    label: c.nom_classe,
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Affectations des enseignants
          </h1>
          <p className="text-sm text-neutral-500">
            Attribuez les classes, séries et matières à chaque enseignant
          </p>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {actionError}
        </div>
      )}

      <Tabs defaultValue="secondaire">
        <Tabs.List variant="pills">
          <Tabs.Trigger value="secondaire">Secondaire</Tabs.Trigger>
          <Tabs.Trigger value="mp">Maternelle &amp; Primaire</Tabs.Trigger>
        </Tabs.List>

        {/* ─── Secondaire : triplet classe × série × matière ─────────── */}
        <Tabs.Content value="secondaire">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <Card.Header>
                <Card.Title>Enseignants</Card.Title>
                <Card.Description>Sélectionnez un enseignant pour voir ses cours</Card.Description>
              </Card.Header>
              <Card.Body>
                <Select
                  aria-label="Enseignant"
                  label="Enseignant"
                  placeholder="Choisir un enseignant"
                  options={teacherOptions}
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                />

                {selectedTeacher && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                        {NOM_ENSEIGNANT(selectedTeacher)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {selectedTeacher.specialite || selectedTeacher.grade || 'Enseignant'}
                      </p>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Affecter un cours</Card.Title>
                <Card.Description>
                  Classe → série → matière (la matière doit appartenir à la série)
                </Card.Description>
              </Card.Header>
              <Card.Body className="space-y-4">
                <Select
                  aria-label="Classe"
                  label="Classe"
                  placeholder="Choisir une classe"
                  options={classeOptions}
                  value={classeId}
                  onChange={(e) => {
                    setClasseId(e.target.value);
                    setSerieId('');
                    setMatiereId('');
                  }}
                />
                <Select
                  aria-label="Série"
                  label="Série"
                  placeholder={classeId ? 'Choisir une série' : 'Choisissez d\u2019abord une classe'}
                  options={seriesOptions}
                  value={serieId}
                  disabled={!classeId}
                  onChange={(e) => {
                    setSerieId(e.target.value);
                    setMatiereId('');
                  }}
                />
                <Select
                  aria-label="Matière"
                  label="Matière"
                  placeholder={serieId ? 'Choisir une matière' : 'Choisissez d\u2019abord une série'}
                  options={matieresOptions}
                  value={matiereId}
                  disabled={!serieId}
                  onChange={(e) => setMatiereId(e.target.value)}
                />
                <Button
                  onClick={handleAdd}
                  disabled={!canAdd}
                  loading={saving}
                  icon={<Plus className="h-4 w-4" />}
                  className="w-full"
                >
                  Affecter
                </Button>
              </Card.Body>
            </Card>
          </div>

          <Card className="mt-6">
            <Card.Header>
              <Card.Title>Cours de {selectedTeacher ? NOM_ENSEIGNANT(selectedTeacher) : 'l’enseignant'}</Card.Title>
              <Card.Description>
                {affectations.length} affectation{affectations.length > 1 ? 's' : ''}
              </Card.Description>
            </Card.Header>
            <Card.Body className="p-0">
              {!selectedTeacher ? (
                <div className="py-10 text-center text-sm text-neutral-500">
                  Sélectionnez un enseignant pour afficher ses affectations
                </div>
              ) : affectations.length === 0 ? (
                <div className="py-10 text-center text-sm text-neutral-500">
                  <Users className="mx-auto h-8 w-8 mb-2" />
                  Aucune affectation pour cet enseignant
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {affectations.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-4 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                          {a.matiere?.nom || 'Matière'}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {a.classe?.nom_classe || 'Classe'}
                          {a.serie?.nom ? ` · ${a.serie.nom}` : ''}
                        </p>
                      </div>
                      <Badge variant="outline" size="sm">
                        {a.serie?.nom || '—'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Retirer ${a.matiere?.nom || 'cette matière'} en ${a.classe?.nom_classe || 'classe'}`}
                        onClick={() => handleDelete(a.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </Tabs.Content>

        {/* ─── Maternelle & Primaire : une classe par enseignant ─────── */}
        <Tabs.Content value="mp">
          <Card>
            <Card.Header>
              <Card.Title>Enseignants Maternelle &amp; Primaire</Card.Title>
              <Card.Description>
                Chaque enseignant couvre une classe entière — changez sa classe ici
              </Card.Description>
            </Card.Header>
            <Card.Body className="p-0">
              {mpTeachers.length === 0 ? (
                <div className="py-10 text-center text-sm text-neutral-500">
                  <Users className="mx-auto h-8 w-8 mb-2" />
                  Aucun enseignant Maternelle / Primaire
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {mpTeachers.map((t) => (
                    <li key={t.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">
                            {NOM_ENSEIGNANT(t)}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {t.classe?.categorie_classe || 'Maternelle / Primaire'}
                          </p>
                        </div>
                      </div>
                      <Select
                        aria-label={`Classe de ${NOM_ENSEIGNANT(t)}`}
                        label="Classe"
                        options={classeOptions}
                        value={t.classe?.id ? String(t.classe.id) : ''}
                        onChange={(e) => handleMpChange(t.id, e.target.value)}
                        className="sm:ml-auto sm:w-72"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </Tabs.Content>
      </Tabs>
    </motion.div>
  );
}
