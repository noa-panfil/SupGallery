# SupGallery

Une application de galerie partagée premium construite avec Next.js et MySQL.

## Fonctionnalités

- **Authentification Sécurisée** : Connexion et Inscription avec validation Admin.
- **Panel Admin** : Approbation des nouveaux comptes et gestion des utilisateurs.
- **Upload Média** : Partage d'images et vidéos avec Drag & Drop.
- **Système de Tags et Commentaires** : Interagissez avec le contenu.
- **Téléchargement** : Bouton direct pour télécharger les médias.
- **Design Premium** : Interface Glassmorphism moderne.

## Installation

1.  **Configurer la Base de Données**
    - Assurez-vous d'avoir MySQL et phpMyAdmin lancés (ex: via XAMPP).
    - Créez une base de données nommée `sup_gallery` (facultatif, le script peut la créer).
    - Vérifiez le fichier `.env` pour correspondre à vos identifiants.

2.  **Installer les dépendances**
    ```bash
    npm install
    ```

3.  **Initialiser la Base de Données**
    ```bash
    node scripts/init-db.js
    ```
    
4.  **Lancer le projet**
    ```bash
    npm run dev
    ```

## Premier Démarrage

- Créez votre premier compte sur la page `/register`.
- **Note Importante** : Le premier compte créé est automatiquement **Admin** et **Approuvé**.
- Les comptes suivants devront être approuvés par l'Admin via le panel `/admin`.

## Technologies

- Next.js 14+ (App Router)
- MySQL2 (Driver DB)
- NextAuth.js (Auth)
- CSS Modules / Vanilla CSS (Design)
