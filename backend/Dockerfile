# Backend Université MAZANZA — Django + Gunicorn
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1000 mazanza

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
RUN rm -f db.sqlite3 && mkdir -p /srv/manzanza/media /srv/manzanza/static \
    && chown -R mazanza:mazanza /app /srv/manzanza

USER mazanza
ENV MEDIA_ROOT=/srv/manzanza/media STATIC_ROOT=/srv/manzanza/static
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers ${GUNICORN_WORKERS:-3} --timeout 120 --access-logfile -"]
