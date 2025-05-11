# ml-api/Dockerfile
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN python -m pip install --upgrade pip

# Add PyTorch CPU index as an additional place for pip to look
ENV PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu

COPY requirements.txt .

# This install will use requirements.txt.
# For torch, torchvision, torchaudio, the --index-url on their lines
# in requirements.txt *should* take precedence.
# The PIP_EXTRA_INDEX_URL is a fallback or for other implicit torch deps.
RUN pip install --no-cache-dir --default-timeout=600 -r requirements.txt

COPY ./app ./app
COPY ./final_trained_model_with_validation ./final_trained_model_with_validation

EXPOSE 8000
CMD ["uvicorn", "app.model_api:app", "--host", "0.0.0.0", "--port", "8000"]