FROM python:3.11-slim
WORKDIR /app
COPY ./pyproject.toml /app/
RUN pip install --no-cache-dir fastapi uvicorn[standard] pydantic[email] pymongo motor python-jose[cryptography] PyJWT python-multipart prometheus-fastapi-instrumentator qdrant-client requests redis dramatiq openai beautifulsoup4 PyPDF2 twilio notion-client bcrypt
COPY ./src /app/src
EXPOSE 8000
CMD ["uvicorn","src.main:app","--host","0.0.0.0","--port","8000"]
