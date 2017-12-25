#!/bin/bash
if [[ -z "$ZOOKEEPER_HOST" ]]; then
    export ZOOKEEPER_HOST="kafka-broker"
fi

if [[ -z "$ADVERTISED_PORT" ]]; then
    export ADVERTISED_PORT=9092
fi

if [[ -z "$START_TIMEOUT" ]]; then
    START_TIMEOUT=10
fi

start_timeout_exceeded=false
count=0
step=1
while true; do
    echo "waiting for kafka to be ready"
    sleep $step;
    count=$(expr $count + $step)
    if [ $count -gt $START_TIMEOUT ]; then
        start_timeout_exceeded=true
        break
    fi
done

if $start_timeout_exceeded; then
    echo "Prepare to auto-create topic (waited for $START_TIMEOUT sec)"
fi

if [[ -n $CREATE_TOPICS ]]; then
    IFS=','; for topicToCreate in $CREATE_TOPICS; do
        echo "creating topics: $topicToCreate"
        IFS=':' read -a topicConfig <<< "$topicToCreate"
        if [ ${topicConfig[3]} ]; then
          JMX_PORT='' $KAFKA_HOME/bin/kafka-topics.sh --create --zookeeper $ZOOKEEPER_HOST --replication-factor ${topicConfig[2]} --partitions ${topicConfig[1]} --topic "${topicConfig[0]}" --config cleanup.policy="${topicConfig[3]}" --if-not-exists
        else
          JMX_PORT='' $KAFKA_HOME/bin/kafka-topics.sh --create --zookeeper $ZOOKEEPER_HOST --replication-factor ${topicConfig[2]} --partitions ${topicConfig[1]} --topic "${topicConfig[0]}" --if-not-exists
        fi
    done
fi
