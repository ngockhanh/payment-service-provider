FROM mysql:latest
MAINTAINER Tran Ngoc Khanh <ngockhanh@ononpay.com>

ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_DATABASE=flash
ENV USER_NAME=root
ENV PASSWORD=root

ADD scripts/flash.sql /opt/flash.sql
ADD scripts/create_database.sh /usr/bin/create_database.sh

RUN chmod a+x /usr/bin/create_database.sh
