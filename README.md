# EntityResolution — Déduplication et résolution d'entités à grande échelle

> Identifiez que "Jean Dupont, j.dupont@gmail.com" et "J. Dupont, jean.dupont@gmail.fr" sont la même personne.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org)
[![Splink](https://img.shields.io/badge/Splink-4.0-6366f1?style=flat)](https://moj-analytical-services.github.io/splink/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://docker.com)

---

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Stack technique](#stack-technique)
3. [Architecture mono-repo](#architecture-mono-repo)
4. [Diagrammes UML](#diagrammes-uml)
5. [PRD](#prd)
6. [User Stories](#user-stories)
7. [Règles métier](#règles-métier)
8. [Spécification API](#spécification-api)
9. [Simulation UI](#simulation-ui)
10. [Dataset](#dataset)
11. [Déploiement](#déploiement)
12. [CI/CD](#cicd)
13. [Roadmap](#roadmap)

---

## Vue d'ensemble

EntityResolution implémente la **résolution probabiliste d'entités** (record linkage) pour dédupliquer des bases de données à grande échelle. Le modèle Fellegi-Sunter, entraîné via l'algorithme EM de Splink (sans labels de terrain), attribue une probabilité de correspondance à chaque paire de records. Les paires au-dessus du seuil sont fusionnées automatiquement ; les cas ambigus passent en file de révision humaine.

**Domaine :** Data Quality / MDM (Master Data Management) / CRM  
**Dataset :** [North Carolina Voter Registration (Kaggle)](https://www.kaggle.com/datasets/sethgabriel/nc-voter-registration) — 8M records, benchmark déduplication  
**Port VM :** 3039 | **Sous-domaine :** entityresolution.wikolabs.com

---

## Concepts clés d'ingénierie

### Modèle probabiliste Fellegi-Sunter
Chaque comparaison de champ (nom, email, téléphone…) génère un **weight** = log₂(m_probability / u_probability) :
- `m_probability` : P(accord | même entité)
- `u_probability` : P(accord | entités différentes)

Le **match_weight** total est la somme des weights de tous les champs → transformé en `match_probability` via la loi logistique.

### Algorithme EM (Expectation-Maximization)
Splink apprend les paramètres `m` et `u` **sans ground truth** :
1. **E-step** : estime les probabilités de matching avec les paramètres courants
2. **M-step** : met à jour `m` et `u` en maximisant la vraisemblance
3. Itérer jusqu'à convergence (typiquement 20 itérations)

### Blocking — réduction O(n²) → O(n)
Sans blocking, 1M records = 5×10¹¹ comparaisons. Les règles de blocking filtrent les candidats :
```python
blocking_rules = [
    "l.first_name_metaphone = r.first_name_metaphone",
    "l.zip_code = r.zip_code",
    "l.email_domain = r.email_domain",
]
```

### Similarité de chaînes
- **Jaro-Winkler** : noms propres (pénalise moins les transpositions)
- **Levenshtein** : adresses (distance d'édition brute)
- **Token-sort ratio** (rapidfuzz) : "Rue de la Paix 12" ↔ "12 rue paix"

---

## Stack technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts | Upload CSV, comparaison paires, browser canonical records |
| Backend | FastAPI (Python 3.11), Uvicorn, BackgroundTasks | API dédup, gestion jobs async |
| Record Linkage | **Splink 4.0** (Fellegi-Sunter + EM) | Modèle probabiliste principal |
| String Matching | **rapidfuzz** (Jaro-Winkler, Levenshtein, token_sort_ratio) | Comparaisons champ par champ |
| Phonetics | **jellyfish** (Soundex, Metaphone) | Blocking phonétique sur noms |
| Base de données | PostgreSQL 16 | Entités, paires candidates, résultat canonical |
| Infra | Docker Compose, Nginx | VM mono-repo (port 3039) |

### backend/requirements.txt
```
fastapi==0.111.0
uvicorn[standard]==0.29.0
splink==4.0.2
rapidfuzz==3.9.2
jellyfish==1.0.3
pandas==2.2.2
numpy==1.26.4
asyncpg==0.29.0
sqlalchemy[asyncio]==2.0.30
pydantic==2.7.1
python-multipart==0.0.9
openpyxl==3.1.3
```

---

## Architecture mono-repo

```
entityresolution/
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx              # Dashboard: métriques dédup
│   │   ├── upload/               # Upload CSV + configuration champs
│   │   ├── review/               # File révision paires ambiguës
│   │   └── canonical/            # Browser entités dédupliquées
│   └── src/components/
│       ├── FileUpload.tsx        # Drag & drop CSV/Excel
│       ├── FieldMapper.tsx       # Mapper colonnes CSV → champs modèle
│       ├── PairViewer.tsx        # Comparaison côte-à-côte paires
│       ├── MatchScoreBar.tsx     # Barre probabilité de match
│       ├── CanonicalTable.tsx    # Liste records fusionnés
│       └── DeduplicationMetrics.tsx
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── deduplicate.py    # POST /deduplicate (upload + job)
│   │   │   ├── jobs.py           # GET /jobs/{id} (status + results)
│   │   │   ├── matches.py        # GET/POST /matches (review queue)
│   │   │   └── canonical.py     # GET /canonical-records
│   │   ├── services/
│   │   │   ├── linker.py         # Splink SplinkLinker pipeline
│   │   │   ├── blocking.py       # Règles de blocking configurables
│   │   │   ├── comparators.py    # Jaro-Winkler, Levenshtein wrappers
│   │   │   ├── canonical.py      # Sélection record canonical
│   │   │   └── em_trainer.py     # Entraînement EM via Splink
│   │   └── models/
│   │       ├── entity.py
│   │       ├── match.py
│   │       └── job.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/deploy.yml
```

---

## Diagrammes UML

### Pipeline de déduplication

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#7c3aed', 'primaryTextColor': '#fff', 'primaryBorderColor': '#5b21b6', 'lineColor': '#374151', 'secondaryColor': '#f5f3ff'}}}%%
flowchart TB
    subgraph INGEST["📄 Ingestion"]
        CSV["Upload CSV/Excel"]
        MAP["Field Mapper\n(nom, email, tel, adresse)"]
        NORM["Normalisation\n(lowercase, strip, unicode)"]
    end

    subgraph BLOCK["🔍 Blocking O(n log n)"]
        METAPHONE["Metaphone\nnoms phonétiques"]
        BLOCK_RULES["Règles blocking\n(phonetique OR zip OR email_domain)"]
        PAIRS["Paires candidates\n(N×M réduit)"]
    end

    subgraph COMPARE["⚖️ Comparaison & Scoring"]
        JW["Jaro-Winkler\nnoms"]
        LEV["Levenshtein\nadresses"]
        EXACT["Exact match\nemail, téléphone"]
        FS["Fellegi-Sunter\nΣ weights → match_prob"]
    end

    subgraph DECISION["✅ Décision"]
        AUTO_M["AUTO_MERGE\nprob ≥ 0.95"]
        REVIEW["REVIEW\n0.70 ≤ prob < 0.95"]
        NO_M["NO_MATCH\nprob < 0.70"]
    end

    subgraph OUTPUT["📤 Output"]
        CANON["Record canonical\n(champs les plus complets)"]
        AUDIT["Audit log\n(toutes décisions)"]
    end

    CSV --> MAP --> NORM --> BLOCK
    METAPHONE --> BLOCK_RULES --> PAIRS
    PAIRS --> COMPARE
    JW --> FS
    LEV --> FS
    EXACT --> FS
    FS --> DECISION
    AUTO_M --> CANON
    REVIEW -->|"Humain valide"| CANON
    CANON --> AUDIT
```

### Séquence — Job de déduplication async

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#7c3aed', 'primaryTextColor': '#fff', 'lineColor': '#374151'}}}%%
sequenceDiagram
    participant U as Utilisateur
    participant API as FastAPI
    participant BG as BackgroundTask
    participant SPL as Splink
    participant PG as PostgreSQL

    U->>API: POST /deduplicate (file CSV)
    API->>PG: INSERT job (status=PENDING)
    API-->>U: {job_id, status: "PENDING"}

    API->>BG: launch_job(job_id, df)

    BG->>BG: normalize(df) — lowercase, strip accents
    BG->>BG: compute_blocking_keys(Soundex, ZIP, email_domain)
    BG->>SPL: SplinkLinker.train_em_algorithm()
    Note over SPL: 20 itérations EM\nsans ground truth

    SPL-->>BG: model (m_probabilities, u_probabilities)
    BG->>SPL: predict(threshold_match_probability=0.70)
    SPL-->>BG: pairs_df [(id_l, id_r, match_prob)]

    BG->>PG: INSERT matches (AUTO_MERGE si prob≥0.95 / REVIEW sinon)
    BG->>BG: build_canonical_records(auto_merged_clusters)
    BG->>PG: INSERT canonical_records
    BG->>PG: UPDATE job (status=COMPLETED, stats)

    U->>API: GET /jobs/{job_id}
    API-->>U: {status:"COMPLETED", merged:842, review_count:127, dedup_rate:0.84}
```

### Modèle de données (ER)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#7c3aed', 'primaryTextColor': '#fff', 'lineColor': '#374151'}}}%%
erDiagram
    JOB {
        uuid id PK
        string filename
        int input_record_count
        string status
        int merged_count
        int review_count
        float dedup_rate
        jsonb field_mapping
        timestamp started_at
        timestamp completed_at
    }
    ENTITY {
        uuid id PK
        uuid job_id FK
        int original_row_index
        string first_name
        string last_name
        string email
        string phone
        string address
        string zip_code
        jsonb raw_data
    }
    MATCH {
        uuid id PK
        uuid entity_l_id FK
        uuid entity_r_id FK
        float match_probability
        string status
        jsonb field_scores
        string reviewer_decision
        timestamp decided_at
    }
    CANONICAL_RECORD {
        uuid id PK
        uuid job_id FK
        uuid[] source_entity_ids
        string first_name
        string last_name
        string email
        string phone
        string address
        int merged_count
        timestamp created_at
    }

    JOB ||--o{ ENTITY : "contient"
    ENTITY ||--o{ MATCH : "paire gauche"
    ENTITY ||--o{ MATCH : "paire droite"
    JOB ||--o{ CANONICAL_RECORD : "produit"
```

### Machine à états — Statut d'une paire

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#7c3aed', 'primaryTextColor': '#fff', 'lineColor': '#374151'}}}%%
stateDiagram-v2
    [*] --> AUTO_MERGED : prob ≥ 0.95
    [*] --> PENDING_REVIEW : 0.70 ≤ prob < 0.95
    [*] --> NO_MATCH : prob < 0.70
    PENDING_REVIEW --> MERGED : Analyste valide
    PENDING_REVIEW --> REJECTED : Analyste rejette
    AUTO_MERGED --> CANONICAL : Enregistrement fusionné
    MERGED --> CANONICAL : Enregistrement fusionné
    NO_MATCH --> [*]
    REJECTED --> [*]
    CANONICAL --> [*]
```

---

## PRD

### Problème
Les CRMs accumulent 20–30% de doublons après 3 ans d'utilisation (Gartner). Un client peut exister sous 4 profils différents : données incohérentes, double-envoi d'emails, métriques faussées, impossibilité de faire un Customer 360. La déduplication manuelle est impossible à l'échelle des millions de records.

### Solution
Pipeline probabiliste automatisé : Splink EM + blocking phonétique + comparateurs de similarité de chaînes. Fusion automatique des correspondances certaines (≥95%), file de révision pour les cas ambigus. Record canonical sélectionné selon la complétude et la source de confiance.

### Utilisateurs cibles
| Persona | Besoin |
|---------|--------|
| CRM Admin | Nettoyer la base clients avant une migration ou une campagne |
| Data Engineer | API temps réel pour dédupliquer à l'import |
| Analyste data | Métriques de qualité des données (dedup rate, precision) |

### OKRs
- Dedup rate > 95% des vrais doublons identifiés (recall)
- False positive rate < 2% (precision)
- Traitement 1M records en < 30 min (batch)
- Taux de révision humaine < 10% des paires

---

## User Stories

```
US-01 [Admin CRM] En tant qu'admin CRM,
      je veux uploader mon export CSV de 500k clients
      et obtenir un rapport de déduplication en moins d'une heure
      afin de nettoyer la base avant la campagne Q3.

US-02 [Data Engineer] En tant que Data Engineer,
      je veux une API REST POST /deduplicate qui accepte un batch de records
      et retourne les canonical records en temps réel
      afin d'intégrer la dédup dans le pipeline d'import CRM.

US-03 [Analyste] En tant qu'analyste,
      je veux voir les paires ambiguës côte-à-côte avec les scores champ par champ
      afin de valider ou rejeter la fusion en 1 clic.

US-04 [Système] En tant que moteur de dédup,
      je veux sélectionner le record canonical en priorisant
      le record le plus complet et la source la plus fiable
      afin de préserver les meilleures données.

US-05 [Manager] En tant que manager,
      je veux des métriques : taux de dédup, précision, rappel
      évalués sur un échantillon labellisé
      afin de valider la qualité du pipeline avant déploiement.
```

---

## Règles métier

Simulables dans l'UI avec données mock (dataset NC Voter Registration subset embarqué).

| # | Règle | Description | Simulable UI |
|---|-------|-------------|-------------|
| R1 | Seuil AUTO_MERGE | prob ≥ 0.95 → fusion automatique | ✅ Slider seuil |
| R2 | Seuil REVIEW | 0.70 ≤ prob < 0.95 → file humaine | ✅ Slider |
| R3 | NO_MATCH | prob < 0.70 → entités distinctes | ✅ |
| R4 | Blocking phonétique | Metaphone first_name OR zip OU email_domain | ✅ Config visible |
| R5 | Jaro-Winkler ≥ 0.85 | Strong match sur nom (+3 weight) | ✅ Score champ |
| R6 | Email exact | +10 weight (signal fort) | ✅ Badge exact |
| R7 | Téléphone normalisé exact | +8 weight | ✅ |
| R8 | Sélection canonical | max(non_null_count) + source_priority | ✅ Badge source |
| R9 | Résolution conflits | Valeur divergente → garder source prioritaire | ✅ |
| R10 | Audit trail | Chaque fusion loggée (scores, décision, timestamp) | ✅ Log panel |
| R11 | Batch max | 1M records par job (SLA 30 min) | ✅ Limit visible |
| R12 | Priorité files | CRM > email import > CSV manuel | ✅ Source badges |

### Poids Fellegi-Sunter (exemple configuré)
```python
FIELD_WEIGHTS = {
    "email_exact":     {"match": 10.0, "no_match": -2.0},
    "phone_exact":     {"match": 8.0,  "no_match": -1.0},
    "name_jw_high":    {"match": 3.0,  "no_match": -1.5},
    "name_jw_med":     {"match": 1.0,  "no_match": -0.5},
    "address_lev_low": {"match": 2.0,  "no_match": -0.5},
    "zip_exact":       {"match": 1.5,  "no_match": -0.3},
}
```

---

## Spécification API

**Base URL :** `http://entityresolution.wikolabs.com/api/v1`

### POST /deduplicate
```
Content-Type: multipart/form-data
file: customers.csv
field_mapping: {"first_name":"Prénom","last_name":"Nom","email":"Email","phone":"Tel","address":"Adresse","zip":"CP"}
auto_merge_threshold: 0.95
review_threshold: 0.70
```
```json
// Response
{"job_id": "job_uuid", "status": "PENDING", "record_count": 50000}
```

### GET /jobs/{id}
```json
{
  "status": "COMPLETED",
  "input_records": 50000,
  "candidate_pairs": 284123,
  "auto_merged": 4821,
  "pending_review": 312,
  "no_match": 44867,
  "dedup_rate": 0.907,
  "processing_seconds": 847
}
```

### GET /matches?status=PENDING_REVIEW
```json
[{
  "id": "match_uuid",
  "match_probability": 0.82,
  "entity_l": {"first_name": "Jean", "last_name": "Dupont", "email": "j.dupont@gmail.com"},
  "entity_r": {"first_name": "J.", "last_name": "Dupont", "email": "jean.dupont@gmail.fr"},
  "field_scores": {
    "name": {"jaro_winkler": 0.91, "weight": 2.8},
    "email": {"exact": false, "domain_match": true, "weight": 1.2}
  }
}]
```

### POST /matches/{id}/decision
```json
{"decision": "MERGED"}  // ou "REJECTED"
```

### GET /canonical-records
Liste des records dédupliqués avec le count de sources fusionnées.

---

## Simulation UI

Interface demo **sans API externe** avec subset du dataset NC Voter Registration.

| Composant | Description |
|-----------|-------------|
| **File Upload** | Drag & drop CSV → aperçu des colonnes → Field Mapper |
| **Job Progress** | Barre de progression async : blocking → EM training → scoring → canonical |
| **Pair Viewer** | Tableau 2 colonnes côte-à-côte, chaque champ coloré (vert=match, rouge=diff) |
| **Match Score Bar** | Barre de probabilité 0-100% avec seuils AUTO_MERGE / REVIEW / NO_MATCH |
| **Field Scores Breakdown** | Détail weights Fellegi-Sunter par champ |
| **Canonical Browser** | Table des entités unifiées avec badge "X sources fusionnées" |
| **Metrics Dashboard** | Dedup rate, paires auto-mergées, en attente révision |

---

## Dataset

**Kaggle :** [NC Voter Registration Data](https://www.kaggle.com/datasets/sethgabriel/nc-voter-registration)

```bash
kaggle datasets download -d sethgabriel/nc-voter-registration -p backend/app/data/
```

**Contenu :** ~8 millions d'enregistrements de votants en Caroline du Nord avec nom, adresse, date de naissance. Benchmark classique pour évaluer les algorithmes de déduplication (duplicats naturels + variations orthographiques).

---

## Déploiement

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment: {POSTGRES_DB: entityresolution, POSTGRES_USER: er_user, POSTGRES_PASSWORD: "${POSTGRES_PASSWORD}"}
    volumes: [pg_data:/var/lib/postgresql/data]

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://er_user:${POSTGRES_PASSWORD}@postgres/entityresolution
      EM_ITERATIONS: 20
      BATCH_SIZE: 100000
    volumes: [upload_data:/app/uploads]
    depends_on: [postgres]
    expose: ["8000"]

  frontend:
    build: ./frontend
    expose: ["3000"]

  nginx:
    image: nginx:alpine
    ports: ["3039:80"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf:ro"]

volumes:
  pg_data:
  upload_data:
```

---

## CI/CD

```yaml
name: Deploy EntityResolution
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USER }}
          key: ${{ secrets.VM_SSH_KEY }}
          script: |
            cd /opt/entityresolution && git pull origin main
            docker compose up -d --build
            docker compose exec backend alembic upgrade head
```

---

## Roadmap

### Phase 1 — MVP (Semaines 1–4)
- [ ] Pipeline Splink EM sur dataset NC Voter Registration
- [ ] Blocking phonétique Metaphone + ZIP
- [ ] API FastAPI upload CSV → job async → résultats
- [ ] UI pair viewer côte-à-côte avec scores

### Phase 2 — Review & Canonical (Semaines 5–8)
- [ ] File de révision humaine avec bulk merge/reject
- [ ] Sélection canonical record (complétude + source priority)
- [ ] Export CSV/JSON des canonical records
- [ ] Métriques précision/rappel sur jeu de test labellisé

### Phase 3 — Scale & Integration (Semaines 9–12)
- [ ] Traitement 10M records en < 2h (DuckDB backend pour Splink)
- [ ] API temps réel pour dédup à l'import (< 200ms)
- [ ] Connecteur HubSpot / Salesforce (import/export)
- [ ] Active learning : entraîner le modèle depuis les décisions humaines

---

*Un produit [Wikolabs](https://wikolabs.com) — Intelligence artificielle appliquée aux métiers*
