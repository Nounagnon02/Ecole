/**
 * ModulesPage — Marketplace de modules (Super Admin)
 *
 * Gestion des modules disponibles et activation par tenant.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Puzzle, CheckCircle2, XCircle, ToggleLeft, ToggleRight,
  BookOpen, DollarSign, MessageSquare, Calendar, Zap,
  BarChart3, Globe, Smartphone, Shield,
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';

const MODULES = [
  { id: 1, slug: 'core', name: 'Cœur', description: 'Gestion des utilisateurs, rôles, permissions', is_core: true, is_active: true, icon: Shield, color: 'indigo', tenants: 23 },
  { id: 2, slug: 'academique', name: 'Académique', description: 'Notes, bulletins, résultats, périodes', is_core: true, is_active: true, icon: BookOpen, color: 'emerald', tenants: 23 },
  { id: 3, slug: 'paiements', name: 'Paiements', description: 'Frais scolaires, transactions, reçus', is_core: false, is_active: true, icon: DollarSign, color: 'amber', tenants: 18 },
  { id: 4, slug: 'emploidutemps', name: 'Emploi du temps', description: 'Planification des cours et salles', is_core: false, is_active: true, icon: Calendar, color: 'sky', tenants: 15 },
  { id: 5, slug: 'messagerie', name: 'Messagerie', description: 'Communication interne et notifications', is_core: true, is_active: true, icon: MessageSquare, color: 'purple', tenants: 23 },
  { id: 6, slug: 'ia', name: 'EduPilot IA', description: 'Assistant IA, analyses prédictives, tutorat', is_core: false, is_active: true, icon: Zap, color: 'rose', tenants: 5 },
  { id: 7, slug: 'api', name: 'API Publique', description: 'Accès API REST pour intégrations tierces', is_core: false, is_active: true, icon: Globe, color: 'cyan', tenants: 3 },
  { id: 8, slug: 'mobile', name: 'Application Mobile', description: 'Accès mobile pour parents et élèves', is_core: false, is_active: false, icon: Smartphone, color: 'neutral', tenants: 0 },
  { id: 9, slug: 'bibliotheque', name: 'Bibliothèque', description: 'Gestion de la bibliothèque et prêts', is_core: false, is_active: true, icon: BookOpen, color: 'teal', tenants: 8 },
  { id: 10, slug: 'infirmerie', name: 'Infirmerie', description: 'Suivi médical et fiches de soin', is_core: false, is_active: true, icon: BarChart3, color: 'red', tenants: 6 },
];

export default function ModulesPage() {
  const [modules] = useState(MODULES);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Modules</h1>
          <p className="text-sm text-neutral-500 mt-1">Marketplace de fonctionnalités</p>
        </div>
        <Button>
          <Puzzle className="h-4 w-4 mr-2" /> Nouveau module
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card>
                <Card.Body className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${mod.color}-50 dark:bg-${mod.color}-950/30`}>
                      <Icon className={`h-6 w-6 text-${mod.color}-500`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-900 dark:text-white">{mod.name}</h3>
                        {mod.is_core && (
                          <Badge variant="primary" size="sm">Core</Badge>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mb-3">{mod.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-400">{mod.tenants} tenant(s)</span>
                        <button className={`inline-flex items-center gap-1 text-xs font-medium ${mod.is_active ? 'text-emerald-600' : 'text-neutral-400'}`}>
                          {mod.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          {mod.is_active ? 'Activé' : 'Désactivé'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
