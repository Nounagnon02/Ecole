/**
 * PlansPage — Gestion des plans d'abonnement (Super Admin)
 *
 * CRUD des plans avec tarifs mensuels/annuels, features, modules.
 * Données dynamiques via API /api/v1/admin/plans
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit3, Trash2, CreditCard, CheckCircle2,
  XCircle, Zap, Star, Users, Building2, Loader2, AlertCircle,
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import { useApi } from '@/hooks/useApi';

export default function PlansPage() {
  const { loading, error, get } = useApi();
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await get('/api/v1/admin/plans');
        const items = Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res) ? res
          : [];
        setPlans(items);
      } catch (e) {
        console.error('Erreur chargement plans:', e);
      }
    })();
  }, []);

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
        <AlertCircle className="h-8 w-8 mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Plans d'abonnement</h1>
          <p className="text-sm text-neutral-500 mt-1">Gérez les offres et tarifs</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />}>Nouveau plan</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.length === 0 && (
          <div className="lg:col-span-3 text-center py-12 text-sm text-neutral-500">Aucun plan disponible</div>
        )}
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={plan.is_popular ? 'ring-2 ring-[var(--accent)] relative' : 'relative'}>
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="primary" size="sm">
                    <Zap className="h-3 w-3 mr-1" /> Populaire
                  </Badge>
                </div>
              )}
              <Card.Body className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{plan.name}</h3>
                    <p className="text-sm text-neutral-500">{plan.slug}</p>
                  </div>
                  <Badge variant={plan.is_active ? 'success' : 'neutral'} size="sm">
                    {plan.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>

                <div className="mb-4">
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {plan.price_monthly === 0 || plan.price_monthly === '0.00' ? 'Gratuit' : `${Number(plan.price_monthly).toLocaleString()} FCFA`}
                  </p>
                  <p className="text-xs text-neutral-500">/mois</p>
                  {plan.price_yearly > 0 && (
                    <p className="text-xs text-neutral-400 mt-1">
                      {Number(plan.price_yearly).toLocaleString()} FCFA/an
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Users className="h-4 w-4" />
                    <span>Jusqu'à {plan.max_students ?? '∞'} élèves</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Building2 className="h-4 w-4" />
                    <span>Jusqu'à {plan.max_schools ?? 1} établissement(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <CreditCard className="h-4 w-4" />
                    <span>{plan.tenants_count ?? 0} abonné(s)</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {(plan.features || []).map((f, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{typeof f === 'string' ? f : f.name || f}</span>
                    </div>
                  ))}
                  {(!plan.features || plan.features.length === 0) && (
                    <p className="text-xs text-neutral-400 italic">Aucune fonctionnalité listée</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Edit3 className="h-4 w-4 mr-1" /> Modifier
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
