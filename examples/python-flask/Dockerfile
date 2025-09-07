FROM python:3.11-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir flask requests
ENV MS_BASE=http://web:8000
ENV MS_TOKEN=CHANGE_ME
EXPOSE 5001
CMD ["python", "app.py"]

