/**
 * Retour de la passerelle de paiement (ecole://paiement-retour?statut=…).
 *
 * L'API y ramène le payeur (config app.mobile_return_url). Le statut affiché
 * vient du serveur, qui a vérifié la transaction auprès de la passerelle ;
 * l'échéance n'est créditée que par cette vérification ou par le webhook.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bouton, Carte, Ecran, Texte } from '../src/espaces/commun';

const MESSAGES = {
  confirme: 'Paiement confirmé. L’échéance a été créditée ; le reçu est envoyé par SMS.',
  attente: 'Paiement en attente de validation sur votre téléphone. Il sera crédité dès sa confirmation.',
  echoue: 'Le paiement n’a pas abouti. Aucun montant n’a été crédité.',
  erreur: 'Le paiement n’a pas pu être vérifié. Consultez vos échéances avant de payer à nouveau.',
};

export default function PaiementRetour() {
  const { statut } = useLocalSearchParams();
  const router = useRouter();
  return (
    <Ecran titre="Paiement">
      <Carte>
        <Texte accessibilityRole="alert">{MESSAGES[String(statut)] ?? MESSAGES.erreur}</Texte>
      </Carte>
      <Bouton titre="Voir mes paiements" onPress={() => router.replace('/(app)/parent')} />
    </Ecran>
  );
}
