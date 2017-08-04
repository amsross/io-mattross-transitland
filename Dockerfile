FROM node:alpine
MAINTAINER Matt Ross <matt@mattross.io>

# create file directory
ENV APP_BASE /usr/local/io-mattross-transitland
RUN mkdir -p $APP_BASE
WORKDIR ${APP_BASE}

COPY ./package.json ./package.json
RUN npm install

COPY ./index.js ./index.js
COPY ./handlers ./handlers
COPY ./views ./views
