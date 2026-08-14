/**
 * Setup Jest — Érudit v4
 *
 * On ne remplace ici que les frontières natives (Keychain/Keystore, stockage
 * asynchrone) : la logique applicative, elle, est testée pour de vrai.
 */

/* AsyncStorage : mock officiel du package. */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

/**
 * expo-secure-store parle au Keychain iOS / Keystore Android : aucun
 * équivalent sous Jest. On le remplace par un coffre en mémoire qui respecte
 * le même contrat asynchrone (une clé absente renvoie null).
 */
jest.mock('expo-secure-store', () => {
  const coffre = new Map();
  return {
    setItemAsync: jest.fn(async (cle, valeur) => {
      coffre.set(cle, valeur);
    }),
    getItemAsync: jest.fn(async (cle) => (coffre.has(cle) ? coffre.get(cle) : null)),
    deleteItemAsync: jest.fn(async (cle) => {
      coffre.delete(cle);
    }),
    __coffre: coffre,
  };
});
