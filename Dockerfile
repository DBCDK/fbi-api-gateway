ARG NODE_BASEIMAGE=docker.dbc.dk/dbc-node:latest
# ---- Base Node ----
FROM  $NODE_BASEIMAGE AS build
# set working directory
WORKDIR /home/node/app
# copy project file
COPY . .

# install node packages
RUN npm set progress=false && npm config set depth 0 && \
    npm install

# test
RUN npm test

#
# ---- Release ----
FROM $NODE_BASEIMAGE AS release
WORKDIR /home/node/app
COPY --chown=node:node --from=build /home/node/app/ ./
USER node

# We use wallaby fork of esm to make optional chaining work
CMD ["node", "-r", "esm-wallaby", "./src/index.js"]