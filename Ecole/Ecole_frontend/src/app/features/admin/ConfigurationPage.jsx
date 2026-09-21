/**
 * ConfigurationPage — Configuration système (Admin)
 *
 * Module admin : paramètres globaux de l'application.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Save, Bell, Shield,   Database, BookOpen,   ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import { useTranslation } from '@/shared/i18n';

/**
 * Les libellés viennent de `t()`, mais les identifiants de champ (`id`) et
 * les valeurs non linguistiques (nombres, dates, identifiants techniques,
 * noms de marque) restent tels quels : une année scolaire, un fuseau
 * horaire ou « XOF » ne se traduisent pas. Seules les valeurs qui sont de
 * vraies phrases françaises ont une clé `..._value` dédiée -- le genre
 * grammatical diffère d'un champ à l'autre (« Désactivées » au féminin
 * pluriel pour des notifications, « Désactivée » au féminin singulier pour
 * une authentification), donc chacune a sa propre clé plutôt qu'un
 * vocabulaire partagé qui serait faux dans au moins un des deux cas.
 */
function useConfigSections() {
  const { t } = useTranslation();

  return [
    {
      id: 'general',
      titre: t('pages.admin.configuration.sections.general.title'),
      icon: Settings,
      description: t('pages.admin.configuration.sections.general.description'),
      fields: [
        { id: 'nom_app', label: t('pages.admin.configuration.sections.general.fields.nom_app'), value: 'École - Gestion Scolaire', type: 'text' },
        { id: 'annee_scolaire', label: t('pages.admin.configuration.sections.general.fields.annee_scolaire'), value: '2025-2026', type: 'text' },
        { id: 'langue', label: t('pages.admin.configuration.sections.general.fields.langue'), value: 'Français', type: 'select', options: ['Français', 'English'] },
        { id: 'fuseau', label: t('pages.admin.configuration.sections.general.fields.fuseau'), value: 'Africa/Abidjan (UTC+0)', type: 'text' },
      ]
    },
    {
      id: 'scolarite',
      titre: t('pages.admin.configuration.sections.scolarite.title'),
      icon: BookOpen,
      description: t('pages.admin.configuration.sections.scolarite.description'),
      fields: [
        { id: 'cycles', label: t('pages.admin.configuration.sections.scolarite.fields.cycles'), value: 'Primaire, Secondaire, Université', type: 'text' },
        { id: 'notes_max', label: t('pages.admin.configuration.sections.scolarite.fields.notes_max'), value: '20', type: 'text' },
        { id: 'seuil_reussite', label: t('pages.admin.configuration.sections.scolarite.fields.seuil_reussite'), value: '50', type: 'text' },
        { id: 'moyenne_requise', label: t('pages.admin.configuration.sections.scolarite.fields.moyenne_requise'), value: '10/20', type: 'text' },
      ]
    },
    {
      id: 'notifications',
      titre: t('pages.admin.configuration.sections.notifications.title'),
      icon: Bell,
      description: t('pages.admin.configuration.sections.notifications.description'),
      fields: [
        { id: 'notif_email', label: t('pages.admin.configuration.sections.notifications.fields.notif_email'), value: t('pages.admin.configuration.sections.notifications.fields.notif_email_value'), type: 'toggle', enabled: true },
        { id: 'notif_sms', label: t('pages.admin.configuration.sections.notifications.fields.notif_sms'), value: t('pages.admin.configuration.sections.notifications.fields.notif_sms_value'), type: 'toggle', enabled: false },
        { id: 'rappel_paiement', label: t('pages.admin.configuration.sections.notifications.fields.rappel_paiement'), value: t('pages.admin.configuration.sections.notifications.fields.rappel_paiement_value'), type: 'text' },
        { id: 'rappel_absence', label: t('pages.admin.configuration.sections.notifications.fields.rappel_absence'), value: t('pages.admin.configuration.sections.notifications.fields.rappel_absence_value'), type: 'text' },
      ]
    },
    {
      id: 'securite',
      titre: t('pages.admin.configuration.sections.securite.title'),
      icon: Shield,
      description: t('pages.admin.configuration.sections.securite.description'),
      fields: [
        { id: '2fa', label: t('pages.admin.configuration.sections.securite.fields.2fa'), value: t('pages.admin.configuration.sections.securite.fields.2fa_value'), type: 'select', options: ['Désactivée', 'Optionnelle', 'Obligatoire'] },
        { id: 'session', label: t('pages.admin.configuration.sections.securite.fields.session'), value: t('pages.admin.configuration.sections.securite.fields.session_value'), type: 'text' },
        { id: 'tentatives', label: t('pages.admin.configuration.sections.securite.fields.tentatives'), value: '5', type: 'text' },
        { id: 'mdp_expire', label: t('pages.admin.configuration.sections.securite.fields.mdp_expire'), value: t('pages.admin.configuration.sections.securite.fields.mdp_expire_value'), type: 'text' },
      ]
    },
    {
      id: 'paiement',
      titre: t('pages.admin.configuration.sections.paiement.title'),
      icon: Database,
      description: t('pages.admin.configuration.sections.paiement.description'),
      fields: [
        { id: 'devise', label: t('pages.admin.configuration.sections.paiement.fields.devise'), value: 'XOF (Franc CFA)', type: 'text' },
        { id: 'mobile_money', label: t('pages.admin.configuration.sections.paiement.fields.mobile_money'), value: t('pages.admin.configuration.sections.paiement.fields.mobile_money_value'), type: 'toggle', enabled: true },
        { id: 'delai_paiement', label: t('pages.admin.configuration.sections.paiement.fields.delai_paiement'), value: t('pages.admin.configuration.sections.paiement.fields.delai_paiement_value'), type: 'text' },
        { id: 'frais_retard', label: t('pages.admin.configuration.sections.paiement.fields.frais_retard'), value: t('pages.admin.configuration.sections.paiement.fields.frais_retard_value'), type: 'text' },
      ]
    },
  ];
}

const SECTION_COLORS = {
  general: 'bg-[var(--primary-subtle)] text-[var(--primary)]',
  scolarite: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500',
  notifications: 'bg-amber-100 dark:bg-amber-900/20 text-amber-500',
  securite: 'bg-red-100 dark:bg-red-900/20 text-red-500',
  paiement: 'bg-sky-100 dark:bg-sky-900/20 text-sky-500'
};

export default function ConfigurationPage() {
  const { t } = useTranslation();
  const CONFIG_SECTIONS = useConfigSections();
  const [activeSection, setActiveSection] = useState(CONFIG_SECTIONS[0].id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.admin.configuration.title')}</h1>
          <p className="text-sm text-neutral-500">{t('pages.admin.configuration.subtitle')}</p>
        </div>
        <Button size="sm" icon={<Save />}>{t('common.save')}</Button>
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
                          <Button variant="ghost" size="sm" icon={<Settings className="h-3 w-3" />} title={t('common.edit')} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm">{t('pages.admin.configuration.reinitialiser')}</Button>
                    <Button size="sm" icon={<Save />}>{t('common.save')}</Button>
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
