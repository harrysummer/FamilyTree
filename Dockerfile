FROM python:3.10-slim-bullseye AS python
FROM node:16-bullseye

EXPOSE 3333

COPY --from=python /usr/local /usr/local
COPY . /src
WORKDIR /src
ENV LD_LIBRARY_PATH=/usr/local/lib

RUN pip install fonttools cu2qu zopfli brotli && npm install && npm run build

ENTRYPOINT npm start
