FROM node:20-alpine
WORKDIR /app
COPY index.js msMiddleware.js package*.json* /app/
RUN npm init -y >/dev/null 2>&1 || true \
 && npm i express node-fetch@3
ENV MS_BASE=http://web:8000
ENV MS_TOKEN=CHANGE_ME
EXPOSE 4000
CMD ["node", "index.js"]

