/**
 * EnfantsPage — Suivi des enfants pour les parents
 *
 * Le parent consulte les notes, absences, emploi du temps et paiements de ses enfants.
 * Données dynamiques via API /parent/enfants
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, GraduationCap, BookOpen, TrendingUp, Calendar,
  AlertTriangle, FileText, Eye, ChevronRight, Clock, Loader2,
} from 'lucide-react';
import { cn, formatNumber, formatDate } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import StatsCard from '@/shared/components/ui/StatsCard';
import { useApi } from '@/hooks/useApi';

export default function EnfantsPage() {
  const { loading, error, get } = useApi();
  const [enfants, setEnfants] = useState([]);
  const [selectedEnfant, setSelectedEnfant] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');
  const [notes, setNotes] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [edt, setEdt] = useState({});
  const [paiements, setPaiements] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/parent/enfants');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setEnfants(items.map(e => ({
          ...e,
          nom: e.nom || `${e.prenom} ${e.nom_famille || ''}`.trim() || e.user?.name || 'Enfant',
          frais: e.frais || { total: 0, paye: 0 },
          moyenne: e.moyenne ?? 0,
          rang: e.rang ?? 0,
          absences: e.absences ?? 0,
        })));
        if (items.length > 0 && !selectedEnfant) setSelectedEnfant(items[0]);
      } catch (e) {
        console.error('Erreur chargement enfants:', e);
      }
    })();
  }, [get]);

  useEffect(() => {
    if (!selectedEnfant) return;
    (async () => {
      try {
        const [notesRes, absRes, edtRes, payRes] = await Promise.allSettled([
          get(`/parent/enfants/${selectedEnfant.id}/notes`),
          get(`/parent/enfants/${selectedEnfant.id}/absences`),
          get(`/parent/enfants/${selectedEnfant.id}/emploi-du-temps`),
          get(`/parent/enfants/${selectedEnfant.id}/paiements`),
        ]);
        setNotes(notesRes.status === 'fulfilled'
          ? (Array.isArray(notesRes.value?.data?.data) ? notesRes.value.data.data
            : Array.isArray(notesRes.value?.data) ? notesRes.value.data
            : Array.isArray(notesRes.value) ? notesRes.value : [])
          : []);
        setAbsences(absRes.status === 'fulfilled'
          ? (Array.isArray(absRes.value?.data?.data) ? absRes.value.data.data
            : Array.isArray(absRes.value?.data) ? absRes.value.data
            : Array.isArray(absRes.value) ? absRes.value : [])
          : []);
        setEdt(edtRes.status === 'fulfilled'
          ? (edtRes.value?.data?.data || edtRes.value?.data || edtRes.value || {})
          : {});
        setPaiements(payRes.status === 'fulfilled'
          ? (Array.isArray(payRes.value?.data?.data) ? payRes.value.data.data
            : Array.isArray(payRes.value?.data) ? payRes.value.data
            : Array.isArray(payRes.value) ? payRes.value : [])
          : []);
      } catch (e) {
        console.error('Erreur chargement détails enfant:', e);
      }
    })();
  }, [selectedEnfant, get]);

  if (loading && !selectedEnfant) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <Clock className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mes Enfants</h1>
        <p className="text-sm text-neutral-500">Suivez la scolarité de vos enfants</p>
      </div>

      {/* Sélection enfant */}
      <div className="flex gap-3">
        {enfants.length === 0 ? (
          <Card className="flex-1">
            <div className="text-center py-8 text-neutral-500">
              <User className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Aucun enfant lié à votre compte</p>
            </div>
          </Card>
        ) : (
          enfants.map((enfant) => (
            <button
              key={enfant.id}
              onClick={() => setSelectedEnfant(enfant)}
              className={cn(
                'flex items-center gap-3 rounded-xl border-2 p-3 transition-all flex-1',
                selectedEnfant?.id === enfant.id
                  ? 'border-[var(--accent)] bg-[var(--accent-subtle)] dark:bg-[var(--accent-subtle)]0/5'
                  : 'border-neutral-200 hover:border-[var(--accent)]/30 dark:border-neutral-700 hover:border-[var(--accent)]'
              )}
            >
              <Avatar name={enfant.nom} size="md" />
              <div className="text-left">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{enfant.nom}</p>
                <p className="text-xs text-neutral-500">{enfant.classe?.nom || enfant.classe_nom || '—'}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-bold text-[var(--accent)]">{enfant.moyenne?.toFixed(1) || '—'}</p>
                <p className="text-xs text-neutral-500">Rang: {enfant.rang || '—'}e</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Stats rapides */}
      {selectedEnfant && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatsCard title="Moyenne Générale" value={selectedEnfant.moyenne?.toFixed(1) || '—'} icon={TrendingUp} color="primary" />
          <StatsCard title="Rang" value={`${selectedEnfant.rang || '—'}e`} icon={GraduationCap} color="emerald" />
          <StatsCard title="Absences" value={String(selectedEnfant.absences || 0)} icon={AlertTriangle} color={selectedEnfant.absences > 0 ? 'red' : 'emerald'} />
          <StatsCard
            title="Frais Scolarité"
            value={selectedEnfant.frais?.total > 0 ? `${((selectedEnfant.frais.paye / selectedEnfant.frais.total) * 100).toFixed(0)}%` : '—'}
            icon={FileText}
            color="sky"
          />
        </div>
      )}

      {/* Tabs : Notes | Emploi du temps | Paiements | Absences */}
      {selectedEnfant && (
        <Card>
          <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700 pb-0 mb-4">
            {[
              { id: 'notes', label: 'Notes', icon: BookOpen },
              { id: 'edt', label: 'Emploi du Temps', icon: Calendar },
              { id: 'absences', label: 'Absences', icon: AlertTriangle },
              { id: 'paiements', label: 'Paiements', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5',
                  activeTab === tab.id
                    ? 'border-[var(--accent)] text-[var(--accent)] dark:text-[var(--accent)]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'notes' && (
            <div className="space-y-3">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <BookOpen className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">Aucune note disponible</p>
                </div>
              ) : (
                notes.map((n, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[var(--primary-subtle)] bg-[var(--primary-subtle)] flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-[var(--accent)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{n.matiere?.nom || n.matiere || 'Matière'}</p>
                        <p className="text-xs text-neutral-500">{n.appreciation || n.type_evaluation || 'Évaluation'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'text-lg font-bold',
                        parseFloat(n.note || 0) >= 14 ? 'text-emerald-600' : parseFloat(n.note || 0) >= 10 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {n.note}/{n.note_sur || 20}
                      </p>
                      <p className="text-xs text-neutral-500">Moy. classe: {n.moyenne_classe || n.moyenne || '—'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'edt' && (
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(edt).map(([jour, cours]) => (
                <div key={jour} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{jour}</p>
                  <div className="space-y-1.5">
                    {(cours || []).map((c, idx) => (
                      <div key={idx} className={cn(
                        'rounded-lg px-2 py-1 text-[11px] font-medium',
                        c === '—' ? 'text-neutral-300 dark:text-neutral-600' : 'bg-[var(--accent-subtle)] text-[var(--accent)] bg-[var(--primary-subtle)] dark:text-[var(--accent)]'
                      )}>
                        {c.matiere?.nom || c.matiere || c}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'absences' && (
            <div className="space-y-3">
              {absences.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                  <p className="text-sm">Aucune absence</p>
                </div>
              ) : (
                absences.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {a.type || 'Absence'} - {formatDate(a.date)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {a.justifiee ? 'Justifiée' : 'Non justifiée'} - {a.motif || 'Sans motif'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={a.justifiee ? 'primary' : 'danger'} size="sm">
                      {a.justifiee ? 'Justifiée' : 'Non justifiée'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'paiements' && (
            <div className="space-y-3">
              {paiements.length === 0 ? (
                <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Frais de scolarité</span>
                    <Badge variant={selectedEnfant.frais.paye >= selectedEnfant.frais.total ? 'primary' : 'warning'}>
                      {selectedEnfant.frais.paye >= selectedEnfant.frais.total ? 'Payé' : 'Partiel'}
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent-subtle)]0"
                      style={{ width: `${selectedEnfant.frais.total > 0 ? (selectedEnfant.frais.paye / selectedEnfant.frais.total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-neutral-500">
                    <span>Payé: {formatNumber(selectedEnfant.frais.paye)} FCFA</span>
                    <span>Total: {formatNumber(selectedEnfant.frais.total)} FCFA</span>
                  </div>
                </div>
              ) : (
                paiements.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{p.type || 'Frais'}</p>
                        <p className="text-xs text-neutral-500">{formatDate(p.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">{formatNumber(p.montant)} FCFA</p>
                      <Badge variant={p.statut === 'paye' ? 'primary' : 'warning'} size="sm">
                        {p.statut === 'paye' ? 'Payé' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      )}
    </motion.div>
  );
}