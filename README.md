# ATLACE — AI Command Center

> Centralisez vos clés API, gérez vos projets web et interagissez avec Gemini dans un seul espace.

## Stack

- **Frontend** : React + Vite + Tailwind CSS
- **Auth & BDD** : Supabase (plan gratuit)
- **IA** : Google AI Studio — Gemini 1.5 Flash
- **Éditeur** : Monaco Editor
- **Animations** : Framer Motion
- **Hébergement** : GitHub Pages

## Setup local

```bash
git clone https://github.com/votre-username/atlace
cd atlace
npm install
cp .env.example .env
# Remplissez .env avec vos clés Supabase
npm run dev
```

## Variables d'environnement

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Schéma Supabase

Copiez le SQL depuis **Paramètres → Schéma Supabase** dans l'app, ou depuis `src/pages/Settings.jsx`.

## Déploiement GitHub Pages

1. Créez un repo GitHub nommé `atlace`
2. Ajoutez les Secrets GitHub Actions :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Poussez sur `main` — le workflow se déclenche automatiquement
4. Activez GitHub Pages sur la branche `gh-pages`

L'app sera disponible sur `https://votre-username.github.io/atlace/`
