/**
 * EnfantsPage — Suivi des enfants pour les parents
 *
 * Le parent consulte les notes, absences, emploi du temps et paiements de ses enfants.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, GraduationCap, BookOpen, TrendingUp, Calendar,
  AlertTriangle, FileText, Eye, ChevronRight, Clock,
} from 'lucide-react';
import { cn, formatNumber } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import Button from '@/shared/components/ui/Button';
import StatsCard from '@/shared/components/ui/StatsCard';

const ENFANTS = [
  {
    id: 1,
    nom: 'Diallo Amadou',
    classe: '4e A',
    moyenne: 14.2,
    rang: 5,
    absences: 2,
    frais: { total: 150000, paye: 120000 },
    photo: null,
  },
  {
    id: 2,
    nom: 'Diallo Fatoumata',
    classe: '6e B',
    moyenne: 16.8,
    rang: 1,
    absences: 0,
    frais: { total: 150000, paye: 150000 },
    photo: null,
  },
];

const NOTES_RECENTES = [
  { matiere: 'Mathématiques', note: 15, sur: 20, moyenne: 12.5, appreciation: 'Bon travail' },
  { matiere: 'Français', note: 12, sur: 20, moyenne: 10.8, appreciation: 'Peut mieux faire' },
  { matiere: 'Anglais', note: 17, sur: 20, moyenne: 13.2, appreciation: 'Excellent' },
  { matiere: 'Physique', note: 14, sur: 20, moyenne: 11.0, appreciation: 'Très bien' },
];

const EMPLOI_DU_TEMPS = [
  { jour: 'Lundi', cours: ['Maths', 'Français', 'Anglais', 'Histoire'] },
  { jour: 'Mardi', cours: ['Physique', 'EPS', 'Maths', 'SVT'] },
  { jour: 'Mercredi', cours: ['Français', 'Anglais', '—', '—'] },
  { jour: 'Jeudi', cours: ['Maths', 'Physique', 'Histoire', 'EPS'] },
  { jour: 'Vendredi', cours: ['SVT', 'Français', 'Maths', 'Anglais'] },
];

export default function EnfantsPage() {
  const [selectedEnfant, setSelectedEnfant] = useState(ENFANTS[0]);
  const [activeTab, setActiveTab] = useState('notes');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Mes Enfants</h1>
        <p className="text-sm text-neutral-500">Suivez la scolarité de vos enfants</p>
      </div>

      {/* Sélection enfant */}
      <div className="flex gap-3">
        {ENFANTS.map((enfant) => (
          <button
            key={enfant.id}
            onClick={() => setSelectedEnfant(enfant)}
            className={cn(
              'flex items-center gap-3 rounded-xl border-2 p-3 transition-all flex-1',
              selectedEnfant.id === enfant.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/5'
                : 'border-neutral-200 hover:border-indigo-200 dark:border-neutral-700 dark:hover:border-indigo-600'
            )}
          >
            <Avatar name={enfant.nom} size="md" />
            <div className="text-left">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{enfant.nom}</p>
              <p className="text-xs text-neutral-500">{enfant.classe}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm font-bold text-indigo-600">{enfant.moyenne.toFixed(1)}</p>
              <p className="text-xs text-neutral-500">Rang: {enfant.rang}e</p>
            </div>
          </button>
        ))}
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Moyenne Générale" value={selectedEnfant.moyenne.toFixed(1)} icon={TrendingUp} color="indigo" />
        <StatsCard title="Rang" value={`${selectedEnfant.rang}e`} icon={GraduationCap} color="emerald" />
        <StatsCard title="Absences" value={String(selectedEnfant.absences)} icon={AlertTriangle} color={selectedEnfant.absences > 0 ? 'red' : 'emerald'} />
        <StatsCard
          title="Frais Scolarité"
          value={`${((selectedEnfant.frais.paye / selectedEnfant.frais.total) * 100).toFixed(0)}%`}
          icon={FileText}
          color="sky"
        />
      </div>

      {/* Tabs : Notes | Emploi du temps | Paiements */}
      <Card>
        <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-700 pb-0 mb-4">
          {[
            { id: 'notes', label: 'Notes' },
            { id: 'edt', label: 'Emploi du Temps' },
            { id: 'paiements', label: 'Paiements' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'notes' && (
          <div className="space-y-3">
            {NOTES_RECENTES.map((n, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{n.matiere}</p>
                    <p className="text-xs text-neutral-500">{n.appreciation}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'text-lg font-bold',
                    n.note >= 14 ? 'text-emerald-600' : n.note >= 10 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {n.note}/{n.sur}
                  </p>
                  <p className="text-xs text-neutral-500">Moy. classe: {n.moyenne}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'edt' && (
          <div className="grid grid-cols-5 gap-2">
            {EMPLOI_DU_TEMPS.map((jour) => (
              <div key={jour.jour} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{jour.jour}</p>
                <div className="space-y-1.5">
                  {jour.cours.map((c, idx) => (
                    <div key={idx} className={cn(
                      'rounded-lg px-2 py-1 text-[11px] font-medium',
                      c === '—' ? 'text-neutral-300 dark:text-neutral-600' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                    )}>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'paiements' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Frais de scolarité</span>
                <Badge variant={selectedEnfant.frais.paye >= selectedEnfant.frais.total ? 'primary' : 'warning'}>
                  {selectedEnfant.frais.paye >= selectedEnfant.frais.total ? 'Payé' : 'Partiel'}
                </Badge>
              </div>
              <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${(selectedEnfant.frais.paye / selectedEnfant.frais.total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-neutral-500">
                <span>Payé: {formatNumber(selectedEnfant.frais.paye)} FCFA</span>
                <span>Total: {formatNumber(selectedEnfant.frais.total)} FCFA</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
