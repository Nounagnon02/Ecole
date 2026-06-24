/**
 * ParametresPage — Paramètres de l'utilisateur et de l'application
 *
 * Préférences, notifications, sécurité et configuration du profil.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, Shield, Palette, Globe, Smartphone,
  Moon, Sun, Eye, EyeOff, Key, Lock, LogOut,
  Save, CreditCard, Users, BookOpen, Clock,
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';

const SECTIONS = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'securite', label: 'Sécurité', icon: Shield },
  { id: 'apparence', label: 'Apparence', icon: Palette },
  { id: 'preferences', label: 'Préférences', icon: Globe },
];

export default function ParametresPage() {
  const [activeSection, setActiveSection] = useState('profil');

  const renderSection = () => {
    switch (activeSection) {
      case 'profil':
        return <ProfilSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'securite':
        return <SecuriteSection />;
      case 'apparence':
        return <ApparenceSection />;
      case 'preferences':
        return <PreferencesSection />;
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Paramètres</h1>
        <p className="text-sm text-neutral-500">Gérez vos préférences et la configuration de votre compte</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar de navigation */}
        <Card className="lg:w-56 shrink-0 h-fit">
          <nav className="flex flex-col gap-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </nav>
        </Card>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {renderSection()}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Profil ──────────────────────────────────────────────────────── */
function ProfilSection() {
  return (
    <div className="space-y-4">
      <Card>
        <Card.Header title="Photo de profil" />
        <div className="flex items-center gap-4">
          <Avatar name="Admin" size="xl" />
          <div className="space-y-1">
            <Button size="sm">Changer la photo</Button>
            <p className="text-xs text-neutral-500">PNG, JPG. Max 2 Mo.</p>
          </div>
        </div>
      </Card>

      <Card>
        <Card.Header title="Informations personnelles" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Prénom</label>
            <Input defaultValue="Admin" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nom</label>
            <Input defaultValue="Système" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
            <Input type="email" defaultValue="admin@ecole.ci" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Téléphone</label>
            <Input defaultValue="+225 01 02 03 04 05" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button>Enregistrer</Button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Notifications ───────────────────────────────────────────────── */
function NotificationsSection() {
  const toggles = [
    { label: 'Notifications push', desc: 'Recevoir les notifications sur votre appareil', enabled: true },
    { label: 'Email', desc: 'Recevoir un résumé par email', enabled: true },
    { label: 'Communications importantes', desc: 'Alertes de la direction', enabled: true },
    { label: 'Notes et évaluations', desc: 'Quand une note est publiée', enabled: false },
    { label: 'Paiements', desc: 'Confirmation de paiement et rappels', enabled: true },
    { label: 'Emploi du temps', desc: 'Changements dans l\'emploi du temps', enabled: false },
  ];

  return (
    <Card>
      <Card.Header title="Préférences de notifications" />
      <div className="space-y-4">
        {toggles.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-neutral-500">{item.desc}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" defaultChecked={item.enabled} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-indigo-500 peer-checked:after:translate-x-full dark:bg-neutral-700" />
            </label>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Sécurité ────────────────────────────────────────────────────── */
function SecuriteSection() {
  return (
    <div className="space-y-4">
      <Card>
        <Card.Header title="Mot de passe" />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Mot de passe actuel</label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nouveau mot de passe</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Confirmer</label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button>Mettre à jour</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Card.Header title="Sessions actives" />
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Chrome sur Windows</p>
                <p className="text-xs text-neutral-500">IP: 192.168.1.42 · Dernière activité: il y a 2 min</p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-600">Active</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Safari sur macOS</p>
                <p className="text-xs text-neutral-500">IP: 10.0.0.15 · Dernière activité: il y a 3 jours</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">Révoquer</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Apparence ───────────────────────────────────────────────────── */
function ApparenceSection() {
  return (
    <div className="space-y-4">
      <Card>
        <Card.Header title="Thème" />
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Clair', icon: Sun, desc: 'Thème clair' },
            { id: 'dark', label: 'Sombre', icon: Moon, desc: 'Thème sombre' },
            { id: 'system', label: 'Système', icon: Smartphone, desc: 'Suit votre appareil' },
          ].map((theme) => (
            <button
              key={theme.id}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-neutral-200 p-4 hover:border-indigo-300 transition-all dark:border-neutral-700 dark:hover:border-indigo-500"
            >
              <theme.icon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
              <span className="text-sm font-medium text-neutral-900 dark:text-white">{theme.label}</span>
              <span className="text-xs text-neutral-500">{theme.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <Card.Header title="Police" />
        <div className="flex items-center gap-4">
          <select className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <option>Inter (par défaut)</option>
            <option>Plus Jakarta Sans</option>
            <option>Roboto</option>
          </select>
          <select className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <option>Normale</option>
            <option>Grande</option>
            <option>Très grande</option>
          </select>
        </div>
      </Card>
    </div>
  );
}

/* ─── Préférences ─────────────────────────────────────────────────── */
function PreferencesSection() {
  return (
    <Card>
      <Card.Header title="Préférences générales" />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Langue</p>
            <p className="text-xs text-neutral-500">Langue de l'interface</p>
          </div>
          <select className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <option>Français</option>
            <option>English</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Fuseau horaire</p>
            <p className="text-xs text-neutral-500">UTC+0 (Abidjan, GMT)</p>
          </div>
          <select className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <option>UTC+0 (Abidjan)</option>
            <option>UTC+1 (Paris)</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Format de date</p>
            <p className="text-xs text-neutral-500">JJ/MM/AAAA</p>
          </div>
          <select className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <option>JJ/MM/AAAA</option>
            <option>MM/JJ/AAAA</option>
            <option>AAAA-MM-JJ</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">Devise</p>
            <p className="text-xs text-neutral-500">Format d'affichage des montants</p>
          </div>
          <select className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <option>XOF (CFA)</option>
            <option>EUR (€)</option>
            <option>USD ($)</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
