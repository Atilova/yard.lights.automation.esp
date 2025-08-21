FROM python:3.12-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apk add --no-cache gcc musl-dev libffi-dev
RUN pip install --no-cache-dir fastapi uvicorn

COPY ./docker/main.py /app/

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
