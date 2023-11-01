ARG NODE_BASEIMAGE=docker-dbc.artifacts.dbccloud.dk/dbc-node:master
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

# build for production
RUN npm run build

# ---- Release ----
FROM $NODE_BASEIMAGE AS release
WORKDIR /home/node/app
COPY --chown=node:node --from=build /home/node/app/ ./
USER node

# We use wallaby fork of esm to make optional chaining work
CMD ["npm", "run", "start"]
