FROM decolua/9router:latest

ENV DATA_DIR=/app/data \
    PORT=20128 \
    HOSTNAME=0.0.0.0 \
    NODE_ENV=production

EXPOSE 20128
