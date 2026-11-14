/**
 * Premier accès avec un mot de passe provisoire remis par l'école : il doit
 * être remplacé avant tout écran (l'API refuse les autres appels). Même règle
 * que le web (ProtectedRoute → /changer-mot-de-passe).
 */
import React, { useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { fonts } from '../theme/typography';
import { Bouton, Ecran, Texte, messageErreur } from './commun';

export default function MotDePasseImpose() {
  const { updateUser, logout } = useAuth();
  const [mdp, setMdp] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [envoi, setEnvoi] = useState(false);

  const valider = async () => {
    if (mdp.password.length < 8 || mdp.password !== mdp.password_confirmation) {
      Alert.alert('Mot de passe', 'Le nouveau mot de passe doit compter au moins 8 caractères et être confirmé à l’identique.');
      return;
    }
    setEnvoi(true);
    try {
      await api.post('/auth/change-password', mdp);
      await updateUser({ password_change_required: false });
    } catch (err) {
      Alert.alert('Mot de passe', messageErreur(err, 'Le mot de passe n’a pas été changé.'));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Ecran titre="Choisissez votre mot de passe" sousTitre="Le mot de passe remis par l’école est provisoire. Remplacez-le pour accéder à votre espace.">
      {[['current_password', 'Mot de passe provisoire'], ['password', 'Nouveau mot de passe'], ['password_confirmation', 'Confirmer le nouveau mot de passe']].map(([c, l]) => (
        <TextInput key={c} accessibilityLabel={l} placeholder={l} secureTextEntry value={mdp[c]} onChangeText={(v) => setMdp((m) => ({ ...m, [c]: v }))}
          style={{ minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontFamily: fonts.body }} />
      ))}
      <Bouton titre="Enregistrer mon mot de passe" chargement={envoi} onPress={valider} />
      <Bouton titre="Se déconnecter" variante="secondaire" onPress={logout} />
      <Texte variante="discret">Au moins 8 caractères.</Texte>
    </Ecran>
  );
}
