ARG NODE_BASEIMAGE=docker-dbc.artifacts.dbccloud.dk/dbc-node:latest
# ---- Base Node ----
FROM  $NODE_BASEIMAGE AS build
# set working directory     
WORKDIR /home/node/app
# copy project file
COPY . .

RUN chown -R node /home/node/app
USER node

# install node packages
ENV CI=true
RUN npm set progress=false && npm config set depth 0 && \
    npm ci

# install dependencies for subprojects (postinstall scripts ignored via .npmrc)
RUN npm run install:subprojects

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
