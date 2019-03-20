#!/bin/bash

rm -rf channel
rm -rf cards
mkdir channel
mkdir cards

docker-compose down
docker rm -f $(docker ps -a -q)
docker system prune -f
docker rmi -f $(docker images |grep 'dev*')
docker-compose up -d

sleep 10

echo "Creating channel..."
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.aeries.io/msp" peer0.org1.aeries.io peer channel create -o orderer.aeries.io:7050 -c artchannel -f /etc/hyperledger/configtx/channel-artifacts/channel.tx

sleep 5
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.aeries.io/msp" peer0.org1.aeries.io peer channel join -b artchannel.block
sleep 5
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.aeries.io/msp" peer1.org1.aeries.io peer channel join -b artchannel.block
sleep 5

echo "anchor peer for org1"
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.aeries.io/msp" peer0.org1.aeries.io peer channel update -o orderer.aeries.io:7050 -c artchannel -f /etc/hyperledger/configtx/channel-artifacts/Org1MSPanchors.tx

sleep 5

composer card list
sleep 5

composer card delete -c PeerAdmin@artnetwork-org1
composer card delete -c admin@test
composer card delete -c buyer1@test
composer card delete -c seller1@test
composer card delete -c warehouse1@test
composer card delete -c shipper1@test

sleep 5

composer card create -p tmp/composer/artnetworkorg1.json -u PeerAdmin -c tmp/composer/org1/Admin@org1.aeries.io-cert.pem -k tmp/composer/org1/*_sk -r PeerAdmin -r ChannelAdmin -f cards/PeerAdmin@artnetwork-org1.card

sleep 5

composer card import -f cards/PeerAdmin@artnetwork-org1.card --card PeerAdmin@artnetwork-org1

sleep 5

composer card list

sleep 5

composer network install --card PeerAdmin@artnetwork-org1 --archiveFile test/dist/test@0.0.2.bna

sleep 20


composer network start -c PeerAdmin@artnetwork-org1 -n test -V 0.0.2 -A admin -S adminpw

sleep 5

composer card import -f admin@test.card --card admin@test

sleep 5

composer card list

sleep 5

composer network ping -c admin@test

sleep 5
echo "Done. test whether dev peer dockers are created"
