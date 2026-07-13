/**
 * ConfigurationPage — Configuration système (Admin)
 *
 * Module admin : paramètres globaux de l'application.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Save, Bell, Shield, Mail, Globe, Clock, Palette,
  Database, Cloud, Lock, Users, BookOpen, Building2,
  ChevronRight, ToggleLeft, ToggleRight, Eye, EyeOff,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';

const CONFIG_SECTIONS = [
  {
    id: 'general',
    titre: 'Général',
    icon: Settings,
    description: 'Paramètres généraux de l\'application',
    fields: [
      { id: 'nom_app', label: 'Nom de l\'application', value: 'École - Gestion Scolaire', type: 'text' },
      { id: 'annee_scolaire', label: 'Année scolaire en cours', value: '2025-2026', type: 'text' },
      { id: 'langue', label: 'Langue par défaut', value: 'Français', type: 'select', options: ['Français', 'English'] },
      { id: 'fuseau', label: 'Fuseau horaire', value: 'Africa/Abidjan (UTC+0)', type: 'text' },
    ],
  },
  {
    id: 'scolarite',
    titre: 'Scolarité',
    icon: BookOpen,
    description: 'Configuration des cycles et niveaux',
    fields: [
      { id: 'cycles', label: 'Cycles actifs', value: 'Primaire, Secondaire, Université', type: 'text' },
      { id: 'notes_max', label: 'Note maximale', value: '20', type: 'text' },
      { id: 'seuil_reussite', label: 'Seuil de réussite (%)', value: '50', type: 'text' },
      { id: 'moyenne_requise', label: 'Moyenne générale requise', value: '10/20', type: 'text' },
    ],
  },
  {
    id: 'notifications',
    titre: 'Notifications',
    icon: Bell,
    description: 'Configuration des alertes et rappels',
    fields: [
      { id: 'notif_email', label: 'Notifications par email', value: 'Activées', type: 'toggle', enabled: true },
      { id: 'notif_sms', label: 'Notifications par SMS', value: 'Désactivées', type: 'toggle', enabled: false },
      { id: 'rappel_paiement', label: 'Rappels de paiement', value: '7 jours avant échéance', type: 'text' },
      { id: 'rappel_absence', label: 'Alertes absences', value: 'Après 3 absences consécutives', type: 'text' },
    ],
  },
  {
    id: 'securite',
    titre: 'Sécurité',
    icon: Shield,
    description: 'Politiques de sécurité et d\'accès',
    fields: [
      { id: '2fa', label: 'Authentification à deux facteurs', value: 'Optionnelle', type: 'select', options: ['Désactivée', 'Optionnelle', 'Obligatoire'] },
      { id: 'session', label: 'Durée de session max', value: '24 heures', type: 'text' },
      { id: 'tentatives', label: 'Tentatives avant verrouillage', value: '5', type: 'text' },
      { id: 'mdp_expire', label: 'Expiration mot de passe', value: '90 jours', type: 'text' },
    ],
  },
  {
    id: 'paiement',
    titre: 'Paiements',
    icon: Database,
    description: 'Configuration des moyens de paiement',
    fields: [
      { id: 'devise', label: 'Devise', value: 'XOF (Franc CFA)', type: 'text' },
      { id: 'mobile_money', label: 'Mobile Money', value: 'Activé (Orange Money, MTN MoMo)', type: 'toggle', enabled: true },
      { id: 'delai_paiement', label: 'Délai de paiement', value: '30 jours après facturation', type: 'text' },
      { id: 'frais_retard', label: 'Pénalité de retard (%)', value: '2% par mois', type: 'text' },
    ],
  },
];

const SECTION_COLORS = {
  general: 'bg-[var(--primary-subtle)] text-[var(--primary)]',
  scolarite: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500',
  notifications: 'bg-amber-100 dark:bg-amber-900/20 text-amber-500',
  securite: 'bg-red-100 dark:bg-red-900/20 text-red-500',
  paiement: 'bg-sky-100 dark:bg-sky-900/20 text-sky-500',
};

export default function ConfigurationPage() {
  const [activeSection, setActiveSection] = useState(CONFIG_SECTIONS[0].id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Configuration</h1>
          <p className="text-sm text-neutral-500">Paramètres globaux du système</p>
        </div>
        <Button size="sm" icon={<Save />}>Enregistrer</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Navigation latérale */}
        <Card className="lg:col-span-1">
          <nav className="space-y-1">
            {CONFIG_SECTIONS.map((section) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                    activeSection === section.id
                      ? 'bg-[var(--primary-subtle)] text-[var(--primary)]'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  )}
                >
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', SECTION_COLORS[section.id])}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{section.titre}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{section.description}</p>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 transition-colors', activeSection === section.id ? 'text-[var(--primary)]' : 'text-neutral-300 dark:text-neutral-600')} />
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Contenu de la section active */}
        <div className="lg:col-span-3 space-y-4">
          {CONFIG_SECTIONS.filter((s) => s.id === activeSection).map((section) => {
            const IconComponent = section.icon;
            return (
              <Card key={section.id}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', SECTION_COLORS[section.id])}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{section.titre}</h2>
                    <p className="text-xs text-neutral-500">{section.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <div>
                        <label className="text-sm font-medium text-neutral-900 dark:text-white">{field.label}</label>
                      </div>
                      <div className="flex items-center gap-3">
                        {field.type === 'toggle' ? (
                          <button className={cn(
                            'relative h-6 w-11 rounded-full transition-colors',
                            field.enabled ? 'bg-[var(--accent)]' : 'bg-neutral-300 dark:bg-neutral-700'
                          )}>
                            <span className={cn(
                              'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                              field.enabled ? 'translate-x-5' : ''
                            )} />
                          </button>
                        ) : (
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">{field.value}</span>
                        )}
                        {field.type !== 'toggle' && (
                          <Button variant="ghost" size="sm" icon={<Settings className="h-3 w-3" />} title="Modifier" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm">Réinitialiser</Button>
                    <Button size="sm" icon={<Save />}>Enregistrer</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
