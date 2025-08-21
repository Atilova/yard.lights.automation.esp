FROM node:22-alpine

WORKDIR /srv

RUN npm install --global live-server@1.2.2

EXPOSE 3000

CMD ["live-server", "--host=0.0.0.0", "--port=3000", "--no-browser", "--wait=200", "/srv"]
