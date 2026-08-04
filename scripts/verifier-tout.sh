#!/usr/bin/env bash
# Porte de vérification des quatre cibles.
#
# Ne fait confiance à aucun rapport d'agent : chaque ligne est une commande dont
# le code de sortie décide. Les rapports servent à savoir où chercher, pas à
# établir qu'une chose fonctionne.
#
# Usage : bash scripts/verifier-tout.sh  (depuis n'importe où)
# Sortie : un tableau PASS/ÉCHEC + code de sortie non nul si quoi que ce soit échoue.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACK=${ROOT}/Ecole/Ecole_backend
FRONT=${ROOT}/Ecole/Ecole_frontend
MOBILE=${ROOT}/Ecole/Ecole_mobile
DESKTOP=${ROOT}/Ecole/Ecole_desktop

FAILED=0
results=()

check() {
  local label="$1"; shift
  local out
  if out=$("$@" 2>&1); then
    results+=("PASS   | $label")
  else
    results+=("ÉCHEC  | $label")
    FAILED=1
    printf '\n──── ÉCHEC : %s ────\n%s\n' "$label" "$(echo "$out" | tail -25)"
  fi
}

# ─── Backend ────────────────────────────────────────────────────────────────
check "backend: lint PHP" bash -c \
  "cd $BACK && find app routes config database tests -name '*.php' -exec php -l {} \; 2>&1 | (! grep -v 'No syntax errors detected')"

check "backend: suite complète" bash -c \
  "cd $BACK && php artisan test 2>&1 | grep -qE 'Tests:.*[0-9]+ passed' && ! php artisan test 2>&1 | grep -qE 'failed|FAIL'"

check "backend: routes s'enregistrent" bash -c \
  "cd $BACK && php artisan route:list --json >/dev/null"

# ─── Frontend web ───────────────────────────────────────────────────────────
check "web: build" bash -c "cd $FRONT && npm run build --silent"
check "web: tests"  bash -c "cd $FRONT && npm test -- --run 2>&1 | grep -q 'Tests.*passed' && ! npm test -- --run 2>&1 | grep -qE '[0-9]+ failed'"

# ─── Mobile ─────────────────────────────────────────────────────────────────
check "mobile: entrée se résout" bash -c \
  "cd $MOBILE && node -e \"require.resolve(require('./package.json').main || './App.js')\""
check "mobile: typecheck" bash -c "cd $MOBILE && npx tsc --noEmit"
check "mobile: bundle web"  bash -c \
  "cd $MOBILE && npx expo export --platform web --output-dir /tmp/gate-expo --clear"
check "mobile: tests" bash -c "cd $MOBILE && npm test --silent"
# 0 *erreur* exigée ; les avertissements sont tolérés. Le compte est extrait de
# la ligne de résumé d'ESLint — chercher « errors » suffisait à matcher
# « 0 errors » et faisait échouer un lint pourtant propre.
check "mobile: lint sans erreur" bash -c "
  cd $MOBILE
  n=\$(npm run lint 2>&1 | grep -oE '[0-9]+ error' | grep -oE '^[0-9]+' | tail -1)
  [ -z \"\$n\" ] && n=0
  [ \"\$n\" -eq 0 ]"

# ─── Desktop ────────────────────────────────────────────────────────────────
check "desktop: dépendances installées" test -d "$DESKTOP/node_modules/electron"
check "desktop: syntaxe"  bash -c "cd $DESKTOP && node --check main.js && node --check preload.js"
check "desktop: cible de chargement existe" test -f "$FRONT/build/index.html"
# Le contrôle décisif : la fenêtre s'ouvre ET React monte. Sans lui, une page
# blanche servie depuis un bundle cassé passait pour un succès — c'est
# exactement ce qui s'est produit avec le `manualChunks` de Vite.
check "desktop: l'app démarre et affiche le frontend" bash -c \
  "cd $DESKTOP && npm run verify --silent"

# ─── CI ─────────────────────────────────────────────────────────────────────
check "ci: YAML valide" python3 -c "
import yaml, glob, sys
for f in glob.glob('${ROOT}/.github/workflows/*.yml'):
    yaml.safe_load(open(f))
"
# Ne contrôle que les endroits où un chemin est *résolu* : `working-directory`
# et les filtres `paths:`. La version précédente cherchait le jeton n'importe
# où dans le fichier et se déclenchait sur un message d'erreur et sur un chemin
# interne au bundle Electron — deux faux positifs.
check "ci: chemins résolus existent" python3 -c "
import yaml, glob, os, sys
bad = []
for f in glob.glob('${ROOT}/.github/workflows/*.yml'):
    doc = yaml.safe_load(open(f)) or {}
    paths = []
    def collect(node):
        if isinstance(node, dict):
            for k, v in node.items():
                if k == 'working-directory' and isinstance(v, str):
                    paths.append(v)
                elif k == 'paths' and isinstance(v, list):
                    paths.extend(p.split('/**')[0] for p in v if isinstance(p, str))
                else:
                    collect(v)
        elif isinstance(node, list):
            for v in node: collect(v)
    collect(doc)
    for p in paths:
        if p in ('.', '') or p.startswith('.github'): continue
        if not os.path.isdir(os.path.join('${ROOT}', p)):
            bad.append(os.path.basename(f) + ': ' + p)
if bad:
    print('Chemins qui ne resolvent pas depuis la racine du depot :')
    [print(' ', b) for b in bad]; sys.exit(1)
"

# ─── Invariants de schéma ───────────────────────────────────────────────────
check "schéma: 0 cascade sur ecole_id, identifiants par école" bash -c "
cd $BACK && php artisan test --filter='no_table_cascades_on_the_school_foreign_key' 2>&1 | grep -q '1 passed'"

# ─── Verdict ────────────────────────────────────────────────────────────────
printf '\n════════ VERDICT ════════\n'
printf '%s\n' "${results[@]}"
printf '\n'
[ $FAILED -eq 0 ] && echo "TOUT PASSE" || echo "AU MOINS UN ÉCHEC — voir les détails ci-dessus"
exit $FAILED
