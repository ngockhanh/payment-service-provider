FROM node:8.4-alpine
MAINTAINER Tran Ngoc Khanh <ngockhanh@ononpay.com>

ENV LOG_LEVEL "info"

COPY . /opt/payment-service-provider
RUN chmod +x /opt/payment-service-provider/docker-entrypoint.sh
RUN apk --update add curl git ca-certificates python build-base libtool autoconf automake &&\
    cd /opt/payment-service-provider && npm install &&\
    rm -rf /var/lib/apt/lists/* &&\
    rm -rf /var/cache/apk/*

WORKDIR "/opt/payment-service-provider/"

EXPOSE 8000

CMD ["npm","start"]