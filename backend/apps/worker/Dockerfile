FROM python:3.11-slim
WORKDIR /app
COPY ./pyproject.toml /app/
RUN pip install --no-cache-dir dramatiq redis pymongo qdrant-client requests
COPY ./src /app/src
CMD ["python","-m","dramatiq","src.tasks.run_start"]
