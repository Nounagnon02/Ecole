import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from "react-native";
import axios from "axios";
import { NavigationProp, ParamListBase, useNavigation } from "@react-navigation/native";
import { useAuth } from "./AuthContext";
import { POINTS_TERMINAISON_AUTH } from "../constants/api";
import { ReponseAuth, EleveCredentials } from "../types/auth";
import { storage } from "./Storage";

export default function Index() {
  const [eleve, setEleve] = useState<EleveCredentials>({
    identifiant: "",
    password: "",
  });
  
  const [erreur, setErreur] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [chargement, setChargement] = useState<boolean>(false);
  const [afficherMotDePasse, setAfficherMotDePasse] = useState<boolean>(false);

  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { login } = useAuth(); // Changé de connexion à login pour correspondre au contexte

  const gererChangement = (nom: keyof EleveCredentials, valeur: string): void => {
    setEleve(prev => ({ ...prev, [nom]: valeur }));
    if (erreur) {
      setErreur(false);
      setMessage("");
    }
  };

  const validerFormulaire = (): boolean => {
    if (!eleve.identifiant || !eleve.password) {
      setErreur(true);
      setMessage("Tous les champs sont requis");
      return false;
    }
    if (eleve.identifiant.length < 3) {
      setErreur(true);
      setMessage("L'identifiant doit contenir au moins 3 caractères");
      return false;
    }
    return true;
  };

  const gererSoumission = async (): Promise<void> => {
      if (!validerFormulaire()) return;

      setChargement(true);
      setErreur(false);
      setMessage("");

      try {
        const reponse = await axios.post<ReponseAuth>(
          POINTS_TERMINAISON_AUTH.CONNEXION,
          eleve
        );

        const { data } = reponse;

        if (data.token) {
          await storage.setItem('token', data.token);  // Added storage
          login({ 
            user: data.user,
            token: data.token 
          });
          setMessage("Connexion réussie !");
          navigation.replace("(tabs)");  // Updated navigation path
        }
      } catch (err: any) {
        setErreur(true);
        setMessage(err.response?.data?.message || "Identifiants incorrects");
      } finally {
        setChargement(false);
      }
    };



  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connectez-vous ici</Text>

      {message !== "" && (
        <Text style={erreur ? styles.error : styles.success}>{message}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Votre identifiant"
        value={eleve.identifiant}
        onChangeText={(text) => gererChangement("identifiant", text)}
        editable={!chargement}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.input}
          placeholder="Votre mot de passe"
          secureTextEntry={!afficherMotDePasse}
          value={eleve.password}
          onChangeText={(text) => gererChangement("password", text)}
          editable={!chargement}
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setAfficherMotDePasse(!afficherMotDePasse)}
        >
          <Text>{afficherMotDePasse ? "🙈" : "👁️"}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={gererSoumission}
        disabled={chargement}
      >
        {chargement ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Connexion</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("MotDePasseOublie")}
        disabled={chargement}
      >
        <Text style={styles.link}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("Inscription")}
        disabled={chargement}
      >
        <Text style={styles.link}>Pas encore de compte ? S'inscrire</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
    color: "#212529",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  toggleButton: {
    position: "absolute",
    right: 10,
    padding: 5,
  },
  button: {
    backgroundColor: "#4cc9f0",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  error: {
    backgroundColor: "#ffe6e6",
    color: "#e63946",
    padding: 10,
    textAlign: "center",
    borderRadius: 5,
    marginBottom: 10,
  },
  success: {
    backgroundColor: "#e6f7ff",
    color: "#4cc9f0",
    padding: 10,
    textAlign: "center",
    borderRadius: 5,
    marginBottom: 10,
  },
  link: {
    color: "#4895ef",
    textAlign: "center",
    textDecorationLine: "underline",
    marginVertical: 5,
  },
});
