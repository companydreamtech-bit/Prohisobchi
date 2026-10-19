FROM python:3.12-slim

WORKDIR /app

# Muhit parametrlarini sozlash
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Kutubxonalarni o'rnatish
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Loyiha fayllarini ko'chirish
COPY . .

# Portni ochish
EXPOSE 8000

# Ishga tushirish
CMD ["python", "main.py"]
