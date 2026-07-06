/**
 * PlansPage — Gestion des plans d'abonnement (Super Admin)
 *
 * CRUD des plans avec tarifs mensuels/annuels, features, modules.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Edit3, Trash2, CreditCard, CheckCircle2,
  XCircle, Zap, Star, Users, Building2,
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';

const PLANS = [
  { id: 1, name: 'Starter', slug: 'starter', price_monthly: 0, price_yearly: 0, max_students: 100, max_schools: 1, features: ['Gestion des élèves', 'Notes et bulletins', 'Messagerie'], modules: ['core', 'academique'], is_popular: false, is_active: true, tenants_count: 12 },
  { id: 2, name: 'Pro', slug: 'pro', price_monthly: 29000, price_yearly: 290000, max_students: 1000, max_schools: 3, features: ['Tout du Starter', 'Paiements en ligne', 'Emploi du temps', 'Export CSV/PDF'], modules: ['core', 'academique', 'paiements', 'emploidutemps'], is_popular: true, is_active: true, tenants_count: 8 },
  { id: 3, name: 'Enterprise', slug: 'enterprise', price_monthly: 79000, price_yearly: 790000, max_students: 10000, max_schools: 10, features: ['Tout du Pro', 'IA EduPilot', 'API publique', 'Support prioritaire', 'White-label'], modules: ['core', 'academique', 'paiements', 'emploidutemps', 'ia', 'api'], is_popular: false, is_active: true, tenants_count: 3 },
];

export default function PlansPage() {
  const [plans] = useState(PLANS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Plans d'abonnement</h1>
          <p className="text-sm text-neutral-500 mt-1">Gérez les offres et tarifs</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nouveau plan
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={plan.is_popular ? 'ring-2 ring-indigo-500' : ''}>
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
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
                    {plan.price_monthly === 0 ? 'Gratuit' : `${plan.price_monthly.toLocaleString()} FCFA`}
                  </p>
                  <p className="text-xs text-neutral-500">/mois</p>
                  {plan.price_yearly > 0 && (
                    <p className="text-xs text-neutral-400 mt-1">
                      {plan.price_yearly.toLocaleString()} FCFA/an
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Users className="h-4 w-4" />
                    <span>Jusqu'à {plan.max_students} élèves</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <Building2 className="h-4 w-4" />
                    <span>Jusqu'à {plan.max_schools} établissement(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <CreditCard className="h-4 w-4" />
                    <span>{plan.tenants_count} abonné(s)</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
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
