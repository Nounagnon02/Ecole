/**
 * ParametresPage — Paramètres de l'utilisateur et de l'application
 *
 * Préférences, notifications, sécurité et configuration du profil.
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  User, Bell, Shield, Palette, Globe, Smartphone,
  Moon, Sun, Save, CheckCircle2, Plus, Trash2, Briefcase
} from 'lucide-react';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Badge from '@/shared/components/ui/Badge';
import Avatar from '@/shared/components/ui/Avatar';
import { api } from '@/shared/services/api';
import { useApiQuery } from '@/shared/lib/api-client';
import { unwrapList } from '@/shared/lib/unwrap';
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
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profil');
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = async (e, extra = {}) => {
    e.preventDefault();
    setSaved(false);
    setSaving(true);
    try {
      const form = e.target;
      const data = {
        name: form.querySelector('[name="name"]')?.value,
        prenom: form.querySelector('[name="prenom"]')?.value,
        email: form.querySelector('[name="email"]')?.value,
        telephone: form.querySelector('[name="telephone"]')?.value,
        ...extra,
      };
      const res = await api.put('/auth/profile', data);
      if (res?.data?.success) {
        updateUser(res.data.user);
        setSaved(true);
        toast.success(t('pages.parametres.parametres.profil_mis_a_jour'));
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      toast.error(err?.message || t('pages.parametres.parametres.erreur_lors_de_la_mise_a_jour'));
    } finally {
      setSaving(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profil':
        return <ProfilSection user={user} onSave={handleSaveProfile} saving={saving} saved={saved} />;
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

  const [avatarDraft, setAvatarDraft] = useState(null);
  const [selectedMatieres, setSelectedMatieres] = useState(
    () => user?.profil?.matieres_maitrisees?.map((m) => m.id) || []
  );
  const [experiences, setExperiences] = useState(
    () => user?.profil?.experiences || []
  );

  // Chargée une seule fois pour les enseignants — `enabled` remplace le garde
  // impératif de l'ancien `useEffect` (cf. audit P4.1).
  const requeteMatieres = useApiQuery(['matieres'], '/matieres', {
    queryOptions: { enabled: isTeacher },
  });
  const matieres = useMemo(() => unwrapList(requeteMatieres.data) ?? [], [requeteMatieres.data]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('pages.parametres.parametres.image_trop_lourde_max_2_mo'));
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
    { label: t('pages.parametres.parametres.notifications_push'), desc: t('pages.parametres.parametres.recevoir_les_notifications_sur_votre_appareil'), enabled: true },
    { label: t('pages.parametres.parametres.email'), desc: t('pages.parametres.parametres.recevoir_un_resume_par_email'), enabled: true },
    { label: t('pages.parametres.parametres.communications_importantes'), desc: t('pages.parametres.parametres.alertes_de_la_direction'), enabled: true },
    { label: t('pages.parametres.parametres.notes_et_evaluations'), desc: t('pages.parametres.parametres.quand_une_note_est_publiee'), enabled: false },
    { label: t('common.payments'), desc: t('pages.parametres.parametres.confirmation_de_paiement_et_rappels'), enabled: true },
    { label: t('pages.parametres.parametres.emploi_du_temps'), desc: t('pages.parametres.parametres.changements_dans_l_emploi_du_temps'), enabled: false },
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
/**
 * TwoFactorCard — activation/désactivation de la 2FA pour le compte connecté.
 *
 * `updateUser()` (auth-store) reflète l'état localement : sans ça, le badge
 * de statut resterait sur l'ancien état jusqu'au prochain `checkSession()`
 * (jusqu'à 5 min, voir SESSION_CHECK_INTERVAL) après une activation réussie.
 */
function TwoFactorCard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const isEnabled = !!user?.two_factor_enabled;

  const [step, setStep] = useState('idle'); // 'idle' | 'setup' | 'disable'
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStep('idle');
    setCode('');
    setError('');
    setQrUrl('');
    setSecret('');
  };

  const startSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setQrUrl(data.qr_code_url);
      setSecret(data.secret);
      setStep('setup');
    } catch (e) {
      toast.error(e.message || t('pages.parametres.parametres.erreur_lors_de_l_activation_de_la_2fa'));
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/2fa/verify', { code });
      updateUser({ two_factor_enabled: true });
      toast.success(t('pages.parametres.parametres.2fa_activee_avec_succes'));
      reset();
    } catch (e) {
      setError(e.message || t('pages.parametres.parametres.code_invalide'));
    } finally {
      setLoading(false);
    }
  };

  const confirmDisable = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/2fa/disable', { code });
      updateUser({ two_factor_enabled: false });
      toast.success(t('pages.parametres.parametres.2fa_desactivee'));
      reset();
    } catch (e) {
      setError(e.message || t('pages.parametres.parametres.code_invalide'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Header
        title={t('pages.parametres.parametres.authentification_a_deux_facteurs')}
        action={
          step === 'idle' ? (
            <Badge variant={isEnabled ? 'success' : 'default'}>
              {isEnabled ? t('pages.parametres.parametres.activee') : t('pages.parametres.parametres.desactivee')}
            </Badge>
          ) : null
        }
      />

      {step === 'idle' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('pages.parametres.parametres.protegez_votre_compte_avec_un_second_facteur')}
          </p>
          {isEnabled ? (
            <Button variant="danger" onClick={() => setStep('disable')}>
              {t('pages.parametres.parametres.desactiver_la_2fa')}
            </Button>
          ) : (
            <Button onClick={startSetup} disabled={loading}>
              {t('pages.parametres.parametres.activer_la_2fa')}
            </Button>
          )}
        </div>
      )}

      {step === 'setup' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('pages.parametres.parametres.scannez_ce_code_avec_votre_application')}
          </p>
          <div className="flex justify-center rounded-lg bg-white p-4">
            <QRCodeSVG value={qrUrl} size={180} />
          </div>
          <details className="text-xs text-neutral-500">
            <summary className="cursor-pointer">
              {t('pages.parametres.parametres.je_ne_peux_pas_scanner_le_code')}
            </summary>
            <code className="mt-2 block break-all rounded bg-neutral-100 p-2 dark:bg-neutral-800">
              {secret}
            </code>
          </details>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('pages.parametres.parametres.code_de_confirmation')}
            </label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>{t('pages.parametres.parametres.annuler')}</Button>
            <Button onClick={confirmSetup} disabled={loading || code.length !== 6}>
              {t('pages.parametres.parametres.confirmer')}
            </Button>
          </div>
        </div>
      )}

      {step === 'disable' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('pages.parametres.parametres.entrez_un_code_pour_desactiver_la_2fa')}
          </p>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>{t('pages.parametres.parametres.annuler')}</Button>
            <Button variant="danger" onClick={confirmDisable} disabled={loading || code.length !== 6}>
              {t('pages.parametres.parametres.desactiver')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function SecuriteSection() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('pages.parametres.parametres.tous_les_champs_sont_requis'));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t('pages.parametres.parametres.le_nouveau_mot_de_passe_doit_faire_au_moins_8'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('pages.parametres.parametres.les_mots_de_passe_ne_correspondent_pas'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      toast.success(t('pages.parametres.parametres.mot_de_passe_mis_a_jour_avec_succes'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      setPasswordError(e.response?.data?.message || t('pages.parametres.parametres.erreur_lors_du_changement_de_mot_de_passe'));
    } finally {
      setLoading(false);
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
              {loading ? t('pages.parametres.parametres.mise_a_jour') : t('pages.parametres.parametres.mettre_a_jour')}
            </Button>
          </div>
        </div>
      </Card>

      <TwoFactorCard />

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
            { id: 'light', label: t('pages.parametres.parametres.clair'), icon: Sun, desc: t('pages.parametres.parametres.theme_clair') },
            { id: 'dark', label: t('pages.parametres.parametres.sombre'), icon: Moon, desc: t('pages.parametres.parametres.theme_sombre') },
            { id: 'system', label: t('pages.parametres.parametres.systeme'), icon: Smartphone, desc: t('pages.parametres.parametres.suit_votre_appareil') },
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
