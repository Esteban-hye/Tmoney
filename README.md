<p align="center"><img src="build/icon.png" width="96" alt="Tmoney"></p>

<h1 align="center">Tmoney</h1>
<p align="center">Application Windows et macOS de gestion de budget personnel · <b>version alpha</b></p>

---

## Fonctionnalités

- **Tableau de bord personnalisable** (glisser-déposer, blocs masquables) : solde reporté d'un mois à l'autre, entrées, sorties, résultat, taux d'épargne
- **Périodes** : semaine, mois, année ou dates libres
- **Graphiques** : entrées/sorties sur 12 mois, sorties cumulées, évolution du solde, calendrier des sorties, jours de la semaine, 6 répartitions en camembert, comparaison de deux mois
- **Transactions** : catégorie + plusieurs étiquettes, description, notes, saisie en série, recherche sur tout l'historique
- **Mensualités** : sorties et entrées fixes comptées automatiquement chaque mois
- **Catégories** avec règles : budget max (€/mois) ou part max des entrées (%), fiche détaillée par catégorie
- **Objectifs d'épargne** avec progression et rythme mensuel conseillé
- **Export** Excel (.xlsx) et rapport PDF
- **Synchronisation entre plusieurs PC** : compte email + mot de passe sur une base Supabase personnelle (gratuite), configurée par un assistant intégré ; données chiffrées de bout en bout, le serveur ne peut pas les lire
- **Sécurité** : données chiffrées localement (AES-256-GCM, clé dérivée du code PIN), mode discret
- Thème clair / sombre

## Installation (utilisateur)

### Windows

1. Télécharger `Tmoney-Setup-x.x.x.exe` depuis la page **Releases**
2. Lancer l'installateur
3. Si Windows affiche « Windows a protégé votre ordinateur » : **Informations complémentaires → Exécuter quand même** (l'application n'est pas signée numériquement)

### macOS

1. Télécharger `Tmoney-x.x.x-mac.dmg` depuis la page **Releases**, l'ouvrir et glisser Tmoney dans **Applications**
2. L'application n'est pas signée par Apple : au premier lancement, macOS la bloque. Ouvrir le **Terminal** et taper :
   ```bash
   xattr -cr /Applications/Tmoney.app
   ```
   puis relancer Tmoney (ou : Réglages Système → Confidentialité et sécurité → **Ouvrir quand même**)
3. Les mises à jour ne s'installent pas toutes seules sur Mac : Tmoney signale la nouvelle version et ouvre la page de téléchargement

Sur Mac, les données sont dans `~/Library/Application Support/Tmoney/`. Un coffre créé sur un autre ordinateur ne peut pas être ouvert tel quel : utiliser la synchronisation.

Les données sont stockées uniquement sur le PC, dans `%APPDATA%\Tmoney\tmoney.vault`. Rien n'est envoyé sur internet.

> **Code PIN perdu = données irrécupérables.** Il n'existe aucun moyen de déchiffrer le fichier sans le PIN.

## Développement

Prérequis : [Node.js](https://nodejs.org) 20 ou plus.

```bash
npm install          # dépendances
npm start            # lancer en mode développement
npm run setup        # créer l'installateur dans dist/
npm run dist         # créer la version décompressée dans dist/win-unpacked
npm run install-app  # installer dist/win-unpacked sur ce PC + raccourcis
npm run mac          # créer le .dmg (sur un Mac uniquement, sinon via GitHub Actions)
npm run icon         # régénérer build/icon.png depuis build/icon.svg
```

## Structure

```
main.js          processus principal Electron : fenêtre, chiffrement, exports
preload.js       pont sécurisé entre l'interface et main.js
src/index.html   structure de l'interface
src/styles.css   styles (thèmes clair/sombre)
src/app.js       logique de l'application
build/           icône
scripts/         génération de l'icône, installation locale
```

## Raccourcis

| Raccourci | Action |
|-----------|--------|
| Ctrl+N (⌘N sur Mac) | Nouvel élément (transaction, mensualité…) |
| Ctrl+F (⌘F sur Mac) | Recherche dans tout l'historique |
| Ctrl+D (⌘D sur Mac) | Mode discret |
