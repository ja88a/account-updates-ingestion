###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:18-alpine As development

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY --chown=node:node package*.json ./

# Install app dependencies using the `npm ci` command instead of `npm install`
#RUN npm install --package-lock-only true
RUN npm ci

# Bundle app source
COPY --chown=node:node . .

# Use the node user from the image (instead of the root user)
#USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

# In order to run `npm run build` we need access to the Nest CLI which is a dev dependency. In the previous development stage we ran `npm ci` which installed all dependencies, so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

# Set NODE_ENV environment variable
ENV NODE_ENV production

# Run the build command which creates the production bundle
RUN npm run build

# Initial `npm pkg delete scripts.prepare` fixes the need for dev tools dependency such as husky
RUN npm pkg delete scripts.prepare

# Running `npm ci` removes the existing node_modules directory and 
# passing in --omit=dev ensures that only the production dependencies are installed. 
# This ensures that the node_modules directory is as optimized as possible
RUN npm ci --omit=dev

RUN npm cache clean --force

###################
# PRODUCTION
###################

FROM node:18-alpine As production

# Set NODE_ENV environment variable: kept to 'development' just to keep displaying console logs
ENV NODE_ENV development

WORKDIR /usr/src/app

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Resources specific to this project, for runnning a static web server
COPY --chown=node:node --from=build /usr/src/app/static ./static

# Create the logs dir, accessible to the user 'node'
RUN mkdir -p logs && chown node:node logs

# Ensure the Node process will run under the user 'node'
USER node

# Optional specification of the port to expose
EXPOSE 3000

# Start the server using the production build
CMD [ "node", "dist/main.js" ]
