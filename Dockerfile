FROM node:12-alpine AS base
RUN apk update && apk add --no-cache \
    python3 \
    g++ \
    make \
    libc6-compat \ 
    bash

WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install --production

COPY . /usr/src/app

RUN chown -R node:node .

USER node
ENTRYPOINT ["node", "./node_modules/@openintegrationhub/ferryman/runGlobal.js"]