# Texture Maker

### Qu'est ce que Texture Maker ?

> Texture Maker est un petit site web conçu pour m'accompagner et simplifier la création de textures Minecraft pour mes Mods et Modpacks. Il m'a paru naturel de le rendre accessible à tous, c'est à la fois une manière de partager mon travail et une opportunité de recueillir des retours utilisateurs afin d'améliorer continuellement cet outil.

### Pourquoi ?

> Bien qu'il existe déjà de nombreux logiciels permettant de créer des textures, ce projet me donne la liberté d'ajouter moi-même toutes les fonctionnalités que je juge pertinentes. C'est également une excellente occasion pour moi de progresser en développement web et de découvrir de nouveaux outils et technologies que je n'avais encore jamais explorés.

### Installation

```bash
git clone https://github.com/Lepetitnoah/texture-maker.git
cd texture-maker
```

Ouvrez simplement `index.html` dans votre navigateur, ou lancez un serveur local :

```bash
python -m http.server 8000
# puis ouvrez http://localhost:8000
```

### Utilisation

1. **Sélectionnez un outil** dans la barre latérale : Stylo (P), Gomme (E), Pot de peinture (F), Pipette (I)
2. **Choisissez une couleur** avec le sélecteur de couleur
3. **Dessinez** sur la grille en cliquant-glissant
4. **Ajustez** la teinte, saturation et luminosité avec les curseurs
5. **Utilisez un template** Minecraft comme base via le bouton "Parcourir"
6. **Exportez** votre texture en PNG avec le bouton "Exporter PNG"

Raccourcis clavier disponibles : `Ctrl+Z` (annuler), `Ctrl+Y` (rétablir), `Ctrl+S` (exporter), `H` (grille).

### API

#### `manifest.json`

Fichier listant les templates disponibles :

```json
[
  {
    "name": "Stone",
    "file": "stone.png"
  }
]
```

#### Script Python — `main.py`

Génère automatiquement `manifest.json` à partir des PNG présents dans le dossier `templates/` :

```bash
python main.py
```

Les noms de fichier en snake_case (ex: `amethyst_block.png`) sont convertis en noms d'affichage (ex: `Amethyst Block`).

### Comment contribuer au projet ?

> Pour proposer une idée ou une amélioration, il vous suffit de créer une "Issue" dans l'onglet "Issues" du dépôt GitHub, puis de sélectionner l'option "Feature request". Veillez à renseigner un titre clair et explicite, accompagné d'une description détaillée, afin que je puisse comprendre votre proposition dans les meilleures conditions. Si votre idée s'avère pertinente et intéressante, elle pourra être intégrée au projet afin que toute la communauté puisse en profiter.

### Qui suis-je ?

> Si vous souhaitez en apprendre d'avantage sur moi, vous pouvez cliquer sur ce lien pour découvrir mon [Portfolio](https://lepetitnoah.github.io/).