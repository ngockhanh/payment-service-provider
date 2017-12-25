FROM python:2.7.14-alpine3.6
MAINTAINER DUONG Dinh Cuong <cuong3ihut@gmail.com>

ENV CQLSH_VERSION 5.0.3

WORKDIR /opt/migrations/

RUN apk --update add curl && \
    pip install cqlsh==5.0.3 && \
    pip install cassandra-driver && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /var/cache/apk/*

