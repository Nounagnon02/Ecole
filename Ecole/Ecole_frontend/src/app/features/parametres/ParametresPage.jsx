/**
 * ParametresPage — Paramètres de l'utilisateur et de l'application
 *
 * Préférences, notifications, sécurité et configuration du profil.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, Shield, Palette, Globe, Smartphone,
  Moon, Sun, Save, CheckCircle2, Plus, Trash2, Briefcase
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLE_GROUPS, hasRole } from '@/shared/types/roles';
import { LOCALES, useTranslation } from '@/shared/i18n';

const SECTIONS = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'securite', label: 'Sécurité', icon: Shield },
  { id: 'apparence', label: 'Apparence', icon: Palette },
  { id: 'preferences', label: 'Préférences', icon: Globe },
];

export default function ParametresPage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const { loading, error, put } = useApi();
  const [activeSection, setActiveSection] = useState('profil');
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = async (e, extra = {}) => {
    e.preventDefault();
    setSaved(false);
    try {
      const form = e.target;
      const data = {
        name: form.querySelector('[name="name"]')?.value,
        prenom: form.querySelector('[name="prenom"]')?.value,
        email: form.querySelector('[name="email"]')?.value,
        telephone: form.querySelector('[name="telephone"]')?.value,
        ...extra,
      };
      const res = await put('/auth/profile', data);
      if (res?.data?.success) {
        updateUser(res.data.user);
        setSaved(true);
        toast.success('Profil mis à jour');
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      toast.error(err?.message || 'Erreur lors de la mise à jour');
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profil':
        return <ProfilSection user={user} onSave={handleSaveProfile} saving={loading} saved={saved} />;
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
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pages.parametres.parametres.title')}</h1>
        <p className="text-sm text-neutral-500">{t('pages.parametres.parametres.subtitle')}</p>
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
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent)] dark:bg-[var(--accent-subtle)]0/10 dark:text-[var(--accent)]'
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
function ProfilSection({ user, onSave, saving, saved }) {
  const { t } = useTranslation();
  const isTeacher = hasRole(user?.role, ROLE_GROUPS.ENSEIGNANTS);
  const { get } = useApi();

  const [avatarDraft, setAvatarDraft] = useState(null);
  const [matieres, setMatieres] = useState([]);
  const [selectedMatieres, setSelectedMatieres] = useState(
    () => user?.profil?.matieres_maitrisees?.map((m) => m.id) || []
  );
  const [experiences, setExperiences] = useState(
    () => user?.profil?.experiences || []
  );

  useEffect(() => {
    if (!isTeacher || matieres.length > 0) return;
    get('/matieres')
      .then((res) => {
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res) ? res : [];
        setMatieres(list);
      })
      .catch(() => {});
  }, [isTeacher]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image trop lourde (max 2 Mo)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarDraft(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    const form = e.target;
    onSave(e, {
      avatar: avatarDraft,
      specialite: form.querySelector('[name="specialite"]')?.value,
      grade: form.querySelector('[name="grade"]')?.value,
      experiences,
      matieres_maitrisees: selectedMatieres,
    });
  };

  const addExperience = () =>
    setExperiences((rows) => [
      ...rows,
      { id: null, poste: '', etablissement: '', date_debut: '', date_fin: '', description: '' },
    ]);

  const updateExperience = (index, field, value) =>
    setExperiences((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );

  const removeExperience = (index) =>
    setExperiences((rows) => rows.filter((_, i) => i !== index));

  const toggleMatiere = (id) =>
    setSelectedMatieres((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );

  return (
    <div className="space-y-4">
      <Card>
        <Card.Header title={t('pages.parametres.parametres.photo_de_profil')} />
        <div className="flex items-center gap-4">
          <Avatar src={avatarDraft || user?.avatar || null} name={user?.name || 'User'} size="xl" />
          <div className="space-y-1">
            <label className="inline-block">
              <span className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-neutral-200 px-4 h-9 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                {t('pages.parametres.parametres.changer_la_photo')}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </label>
            {avatarDraft && (
              <Button size="sm" variant="ghost" onClick={() => setAvatarDraft(null)}>
                {t('common.cancel')}
              </Button>
            )}
            <p className="text-xs text-neutral-500">{t('pages.parametres.parametres.png_jpg_max_2_mo')}</p>
          </div>
        </div>
      </Card>

      <Card>
        <Card.Header title={t('pages.parametres.parametres.informations_personnelles')} />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('pages.parametres.parametres.prenom')}</label>
              <Input name="prenom" defaultValue={user?.prenom || ''} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('pages.parametres.parametres.nom')}</label>
              <Input name="name" defaultValue={user?.name || ''} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('pages.parametres.parametres.email')}</label>
              <Input type="email" name="email" defaultValue={user?.email || ''} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('pages.parametres.parametres.telephone')}</label>
              <Input name="telephone" defaultValue={user?.telephone || ''} />
            </div>
          </div>

          {isTeacher && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('pages.parametres.parametres.specialite')}</label>
                  <Input name="specialite" defaultValue={user?.profil?.specialite || ''} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('pages.parametres.parametres.grade')}</label>
                  <Input name="grade" defaultValue={user?.profil?.grade || ''} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t('pages.parametres.parametres.matieres_maitrisees')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {matieres.map((m) => {
                    const active = selectedMatieres.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMatiere(m.id)}
                        className={`rounded-full border px-3 py-1 text-sm transition-all ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]'
                            : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:text-neutral-400'
                        }`}
                      >
                        {m.nom}
                      </button>
                    );
                  })}
                  {matieres.length === 0 && (
                    <p className="text-xs text-neutral-500">{t('pages.parametres.parametres.chargement_des_matieres')}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    <Briefcase className="h-4 w-4" /> {t('pages.parametres.parametres.experiences_professionnelles')}
                  </label>
                  <Button type="button" size="sm" variant="outline" onClick={addExperience} icon={<Plus className="h-4 w-4" />}>
                    {t('pages.parametres.parametres.ajouter')}
                  </Button>
                </div>
                {experiences.length === 0 && (
                  <p className="text-xs text-neutral-500">{t('pages.parametres.parametres.aucune_experience_renseignee')}</p>
                )}
                {experiences.map((exp, i) => (
                  <div key={i} className="rounded-xl border border-neutral-200 p-3 space-y-3 dark:border-neutral-700">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-500">{t('pages.parametres.parametres.poste')}</label>
                        <Input
                          value={exp.poste}
                          onChange={(e) => updateExperience(i, 'poste', e.target.value)}
                          placeholder={t('pages.parametres.parametres.professeur_de_mathematiques')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-500">{t('common.school')}</label>
                        <Input
                          value={exp.etablissement}
                          onChange={(e) => updateExperience(i, 'etablissement', e.target.value)}
                          placeholder={t('pages.parametres.parametres.lycee_public')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-500">{t('pages.parametres.parametres.debut')}</label>
                        <Input
                          type="date"
                          value={exp.date_debut}
                          onChange={(e) => updateExperience(i, 'date_debut', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-500">{t('pages.parametres.parametres.fin_optionnel')}</label>
                        <Input
                          type="date"
                          value={exp.date_fin}
                          onChange={(e) => updateExperience(i, 'date_fin', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-500">{t('pages.parametres.parametres.description_optionnel')}</label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => updateExperience(i, 'description', e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
                        placeholder={t('pages.parametres.parametres.missions_classes_encadrees')}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeExperience(i)} icon={<Trash2 className="h-4 w-4" />}>
                        {t('pages.parametres.parametres.retirer')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving} icon={<Save className="h-4 w-4" />}>
              {t('pages.parametres.parametres.enregistrer')}
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> {t('pages.parametres.parametres.enregistre')}
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ─── Notifications ───────────────────────────────────────────────── */
function NotificationsSection() {
  const { t } = useTranslation();
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
      <Card.Header title={t('pages.parametres.parametres.preferences_de_notifications')} />
      <div className="space-y-4">
        {toggles.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.label}</p>
              <p className="text-xs text-neutral-500">{item.desc}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" defaultChecked={item.enabled} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[var(--accent-subtle)]0 peer-checked:after:translate-x-full dark:bg-neutral-700" />
            </label>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Sécurité ────────────────────────────────────────────────────── */
function SecuriteSection() {
  const { t } = useTranslation();
  const { loading, post } = useApi();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont requis.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    try {
      await post('/auth/change-password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      toast.success('Mot de passe mis à jour avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setPasswordError(e.response?.data?.message || 'Erreur lors du changement de mot de passe.');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <Card.Header title={t('pages.parametres.parametres.mot_de_passe')} />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('pages.parametres.parametres.mot_de_passe_actuel')}</label>
            <Input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('pages.parametres.parametres.nouveau_mot_de_passe')}</label>
              <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('pages.parametres.parametres.confirmer')}</label>
              <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={loading}>
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Card.Header title={t('pages.parametres.parametres.sessions_actives')} />
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{t('pages.parametres.parametres.chrome_sur_windows')}</p>
                <p className="text-xs text-neutral-500">{t('pages.parametres.parametres.ip_192_168_1_42_derniere_activite_il_y_a_2_min')}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-600">{t('pages.parametres.parametres.active')}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{t('pages.parametres.parametres.safari_sur_macos')}</p>
                <p className="text-xs text-neutral-500">{t('pages.parametres.parametres.ip_10_0_0_15_derniere_activite_il_y_a_3_jours')}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">{t('pages.parametres.parametres.revoquer')}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Apparence ───────────────────────────────────────────────────── */
function ApparenceSection() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Card>
        <Card.Header title={t('pages.parametres.parametres.theme')} />
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Clair', icon: Sun, desc: 'Thème clair' },
            { id: 'dark', label: 'Sombre', icon: Moon, desc: 'Thème sombre' },
            { id: 'system', label: 'Système', icon: Smartphone, desc: 'Suit votre appareil' },
          ].map((theme) => (
            <button
              key={theme.id}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-neutral-200 p-4 hover:border-[var(--accent)]/30 transition-all dark:border-neutral-700 dark:hover:border-[var(--accent)]"
            >
              <theme.icon className="h-6 w-6 text-neutral-600 dark:text-neutral-400" />
              <span className="text-sm font-medium text-neutral-900 dark:text-white">{theme.label}</span>
              <span className="text-xs text-neutral-500">{theme.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <Card.Header title={t('pages.parametres.parametres.police')} />
        <div className="flex items-center gap-4">
          <select className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <option>{t('pages.parametres.parametres.inter_par_defaut')}</option>
            <option>Plus Jakarta Sans</option>
            <option>Roboto</option>
          </select>
          <select className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <option>{t('pages.parametres.parametres.normale')}</option>
            <option>{t('pages.parametres.parametres.grande')}</option>
            <option>{t('pages.parametres.parametres.tres_grande')}</option>
          </select>
        </div>
      </Card>
    </div>
  );
}

/* ─── Préférences ─────────────────────────────────────────────────── */
function PreferencesSection() {
  const { t, locale, setLocale } = useTranslation();
  return (
    <Card>
      <Card.Header title={t('pages.parametres.parametres.preferences_generales')} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{t('pages.parametres.parametres.langue')}</p>
            <p className="text-xs text-neutral-500">{t('pages.parametres.parametres.langue_de_l_interface')}</p>
          </div>
          {/* Seul réglage de cette section réellement branché : la locale vit
              dans le provider i18n, qui la mémorise et fixe `lang`/`dir`. */}
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            aria-label={t('pages.parametres.parametres.langue')}
            className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            {LOCALES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{t('pages.parametres.parametres.fuseau_horaire')}</p>
            <p className="text-xs text-neutral-500">UTC+0 (Abidjan, GMT)</p>
          </div>
          <select className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <option>UTC+0 (Abidjan)</option>
            <option>UTC+1 (Paris)</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{t('pages.parametres.parametres.format_de_date')}</p>
            <p className="text-xs text-neutral-500">JJ/MM/AAAA</p>
          </div>
          <select className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <option>JJ/MM/AAAA</option>
            <option>MM/JJ/AAAA</option>
            <option>AAAA-MM-JJ</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{t('pages.parametres.parametres.devise')}</p>
            <p className="text-xs text-neutral-500">{t('pages.parametres.parametres.format_d_affichage_des_montants')}</p>
          </div>
          <select className="h-10 rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            <option>XOF (CFA)</option>
            <option>EUR (€)</option>
            <option>USD ($)</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
