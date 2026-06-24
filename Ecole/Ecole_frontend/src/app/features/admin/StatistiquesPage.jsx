/**
 * StatistiquesPage — Statistiques générales (Super Admin)
 *
 * Module admin : indicateurs clés et analytics du système.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Building2, BookOpen,
  GraduationCap, DollarSign, Activity, Clock, CheckCircle, AlertCircle,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { cn, formatNumber } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import StatsCard from '@/shared/components/ui/StatsCard';

const STATS_DATA = {
  etablissements: { total: 8, actifs: 7, variation: '+12%', trending: 'up' },
  utilisateurs: { total: 12540, actifs: 11200, variation: '+8%', trending: 'up' },
  revenus: { total: 45600000, mensuel: 5200000, variation: '+15%', trending: 'up' },
  tauxReussite: { total: 78.5, precedent: 74.2, variation: '+4.3%', trending: 'up' },
};

const REPARTITION_ROLES = [
  { role: 'Élèves', count: 8750, pct: 69.8, color: 'bg-indigo-500' },
  { role: 'Enseignants', count: 420, pct: 3.4, color: 'bg-emerald-500' },
  { role: 'Parents', count: 2980, pct: 23.8, color: 'bg-amber-500' },
  { role: 'Personnel', count: 390, pct: 3.0, color: 'bg-sky-500' },
];

const ACTIVITE_RECENTE = [
  { action: 'Nouvelle inscription', entite: 'Élève Diallo Amadou', date: '2026-06-18', type: 'inscription' },
  { action: 'Paiement effectué', entite: 'Frais Scolaires L3', date: '2026-06-18', type: 'paiement' },
  { action: 'Note validée', entite: 'Algèbre Linéaire - 15/20', date: '2026-06-17', type: 'note' },
  { action: 'Compte créé', entite: 'Professeur Ndiaye', date: '2026-06-17', type: 'compte' },
  { action: 'Absence signalée', entite: 'Touré Fatou - Mécanique', date: '2026-06-16', type: 'absence' },
  { action: 'Facture générée', entite: 'FAC-2026-0042', date: '2026-06-16', type: 'facture' },
];

const ACTIVITE_CONFIG = {
  inscription: { icon: Users, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20' },
  paiement: { icon: DollarSign, color: 'text-green-500 bg-green-100 dark:bg-green-900/20' },
  note: { icon: GraduationCap, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/20' },
  compte: { icon: Users, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20' },
  absence: { icon: AlertCircle, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/20' },
  facture: { icon: BookOpen, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20' },
};

export default function StatistiquesPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Statistiques</h1>
          <p className="text-sm text-neutral-500">Indicateurs clés et analytics du système</p>
        </div>
        <Badge variant="primary" size="sm">
          <Clock className="h-3 w-3 mr-1" />
          Mis à jour en temps réel
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard
          title="Établissements"
          value={String(STATS_DATA.etablissements.total)}
          icon={Building2}
          color="indigo"
          footer={
            <span className={cn('flex items-center gap-1 text-xs font-medium', STATS_DATA.etablissements.trending === 'up' ? 'text-emerald-600' : 'text-red-600')}>
              {STATS_DATA.etablissements.trending === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {STATS_DATA.etablissements.variation} vs mois dernier
            </span>
          }
        />
        <StatsCard
          title="Utilisateurs"
          value={formatNumber(STATS_DATA.utilisateurs.total)}
          icon={Users}
          color="emerald"
          footer={
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              {STATS_DATA.utilisateurs.variation} vs mois dernier
            </span>
          }
        />
        <StatsCard
          title="Revenus Mensuels"
          value={`${(STATS_DATA.revenus.mensuel / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          color="amber"
          footer={
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              {STATS_DATA.revenus.variation} vs mois dernier
            </span>
          }
        />
        <StatsCard
          title="Taux de Réussite"
          value={`${STATS_DATA.tauxReussite.total}%`}
          icon={TrendingUp}
          color="sky"
          footer={
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              {STATS_DATA.tauxReussite.variation} vs année précédente
            </span>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Répartition par rôle */}
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Répartition des utilisateurs</h3>
          <div className="space-y-4">
            {REPARTITION_ROLES.map((item) => (
              <div key={item.role}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">{item.role}</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{formatNumber(item.count)} ({item.pct}%)</span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', item.color)} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activité récente */}
        <Card>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Activité récente</h3>
          <div className="space-y-3">
            {ACTIVITE_RECENTE.map((a, i) => {
              const cfg = ACTIVITE_CONFIG[a.type] || { icon: Activity, color: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800' };
              const IconComponent = cfg.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', cfg.color)}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{a.action}</p>
                    <p className="text-xs text-neutral-500">{a.entite}</p>
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0">{a.date}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Cartes supplémentaires */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Taux de présence</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">92%</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Cours programmés</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">1 245</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-900/20 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Diplômés 2026</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">420</p>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
