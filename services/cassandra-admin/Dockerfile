FROM node:8.4-alpine
MAINTAINER DUONG Dinh Cuong <cuong3ihut@gmail.com>

ARG CASSANDRA_HOST_PRIMARY=cassandra-database
ARG CASSANDRA_HOST_SECONDARY=10.0.75.1

# bower requires this configuration parameter to allow bower install using root.
RUN echo '{ "allow_root": true }'>.bowerrc
COPY ./bower.json /tmp/

# node-sass doesn't support Alpine, so we need the build toolchain.
RUN apk --update add curl git ca-certificates python &&\
	git clone https://github.com/aksakalli/sandraREST.git /opt/cassandra-rest/ &&\
    cp /tmp/bower.json /opt/cassandra-rest/ &&\
    cd /opt/cassandra-rest/ && npm install && npm install bower && node_modules/bower/bin/bower install &&\
    echo '{"contactPoints" : ["'${CASSANDRA_HOST_PRIMARY}'", "'${CASSANDRA_HOST_SECONDARY}'"]}' > /opt/cassandra-rest/cassandra_config.json &&\
    ls -la /opt/cassandra-rest/bin &&\    
    rm -rf /var/lib/apt/lists/* &&\
    rm -rf /var/cache/apk/*

WORKDIR /opt/cassandra-rest/

EXPOSE 8088
ENTRYPOINT ["node"]
CMD ["/opt/cassandra-rest/bin/www"]