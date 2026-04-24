# Base d'image légère et optimisée PyTorch/CPU
FROM python:3.10-slim

WORKDIR /app

# Optimisation pour les compilations C (numpy, pandas)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Installation sans cache pour alléger l'image
RUN pip install --no-cache-dir -r requirements.txt

# Pré-télécharger le modèle Hugging Face pour l'avoir en cache dans l'image
RUN python -c "from transformers import pipeline; pipeline('sentiment-analysis', model='ProsusAI/finbert')"

COPY . .

# Utilisateur non-root par sécurité
RUN useradd -m botuser && chown -R botuser /app
USER botuser

CMD ["python", "main.py"]
