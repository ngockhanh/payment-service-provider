FROM spotify/kafka
MAINTAINER DUONG Dinh Cuong <cuong3ihut@gmail.com>

ENV CREATE_TOPICS=flash-balance-topup.response:1:1
ENV ZOOKEEPER_HOST=localhost

ADD scripts/create-topics.sh /usr/bin/create-topics.sh
# The scripts need to have executable permission
RUN chmod a+x /usr/bin/create-topics.sh

RUN apt-get update && apt-get install -y net-tools && \
    rm -rf /var/lib/apt/lists/*

CMD ['create-topics.sh']