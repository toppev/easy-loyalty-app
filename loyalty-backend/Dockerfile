# Production Dockerfile
#
# Example usage:
# docker build . -t loyalty_backend --build-arg NPM_TOKEN=ajd12ydliauwdt
# docker run loyalty_backend
FROM node:12.16-alpine

WORKDIR /usr/src/app
COPY package*.json .npmrc ./

RUN apk --update --no-cache add curl

ARG NPM_TOKEN

# ~/.npmrc is used to authenticate, different from the project level .npmrc
RUN echo //npm.pkg.github.com/:_authToken=${NPM_TOKEN} > ~/.npmrc

# Don't install devDependencies
RUN npm install --only=production
RUN rm -f ~/.npmrc
COPY . .
EXPOSE 3001

CMD [ "npm", "start"]
