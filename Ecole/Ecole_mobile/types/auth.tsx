export interface EleveCredentials {
  identifiant: string;
  password: string;
}

export interface Utilisateur {
  identifiant: string;
  nom: string;
  prenom: string;
  role: string;
}

export interface ReponseAuth {
  token: string | null;
  role: string;
  user?: Utilisateur;
  redirect_to?: string;
}