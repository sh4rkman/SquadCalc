FROM node:18-slim

RUN apt-get update && apt-get install -y git python3 build-essential && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/sh4rkman/SquadCalc.git

WORKDIR "/SquadCalc"

RUN npm ci

CMD [ "npm", "run", "build:prod"]