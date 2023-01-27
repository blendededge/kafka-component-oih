FROM node:12-alpine AS base

ENV ELASTICIO_OTEL_SERVICE_NAME=COMPONENT:KAFKA

RUN apk update && apk add --no-cache \
    python3 \
    g++ \
    make \
    libc6-compat

WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install --production

COPY . /usr/src/app

RUN chown -R node:node .

USER node
ENTRYPOINT ["node", "./node_modules/@openintegrationhub/ferryman/runGlobal.js"]