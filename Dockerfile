FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node package.json server.cjs david.html ./
COPY --chown=node:node lib ./lib
COPY --chown=node:node public ./public
COPY --chown=node:node chess-extras ./chess-extras
RUN mkdir /app/.data && chown node:node /app/.data
USER node
ENV PORT=8001
EXPOSE 8001
VOLUME ["/app/.data"]
CMD ["node", "server.cjs"]
