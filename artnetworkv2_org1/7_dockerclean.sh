#!/bin/bash

docker system prune
docker rmi -f $(docker images |grep 'dev*')
