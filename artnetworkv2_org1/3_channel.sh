#!/bin/bash

## Create channel
echo "Creating channel..."
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.aeries.io/msp" peer0.org1.aeries.io peer channel create -o orderer.aeries.io:7050 -c artchannel -f /etc/hyperledger/configtx/channel-artifacts/channel.tx

## Join all the peers to the channel
echo "Having all peers join the channel..."

sleep 10
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.aeries.io/msp" peer0.org1.aeries.io peer channel join -b artchannel.block
sleep 10
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.aeries.io/msp" peer1.org1.aeries.io peer channel join -b artchannel.block
sleep 10

docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.aeries.io/msp" peer0.org2.aeries.io peer channel join -b artchannel.block
sleep 10
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.aeries.io/msp" peer1.org2.aeries.io peer channel join -b artchannel.block
sleep 10

docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org3.aeries.io/msp" peer0.org3.aeries.io peer channel join -b artchannel.block
sleep 10
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org3.aeries.io/msp" peer1.org3.aeries.io peer channel join -b artchannel.block
sleep 10

docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org4.aeries.io/msp" peer0.org4.aeries.io peer channel join -b artchannel.block
sleep 10
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org4.aeries.io/msp" peer1.org4.aeries.io peer channel join -b artchannel.block
sleep 10

docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org5.aeries.io/msp" peer0.org5.aeries.io peer channel join -b artchannel.block
sleep 10
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org5.aeries.io/msp" peer1.org5.aeries.io peer channel join -b artchannel.block
sleep 10

## Set the anchor peers for each org in the channel
echo "set anchor peers for each org in the channel"
echo "anchor peer for org1"
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.aeries.io/msp" peer0.org1.aeries.io peer channel update -o orderer.aeries.io:7050 -c artchannel -f /etc/hyperledger/configtx/channel-artifacts/Org1MSPanchors.tx

sleep 10

echo "anchor peer for org2"
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org2.aeries.io/msp" peer0.org2.aeries.io peer channel update -o orderer.aeries.io:7050 -c artchannel -f /etc/hyperledger/configtx/channel-artifacts/Org2MSPanchors.tx

sleep 10

echo "anchor peer for org3"
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org3.aeries.io/msp" peer0.org3.aeries.io peer channel update -o orderer.aeries.io:7050 -c artchannel -f /etc/hyperledger/configtx/channel-artifacts/Org3MSPanchors.tx

sleep 10

echo "anchor peer for org4"
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org4.aeries.io/msp" peer0.org4.aeries.io peer channel update -o orderer.aeries.io:7050 -c artchannel -f /etc/hyperledger/configtx/channel-artifacts/Org4MSPanchors.tx

sleep 10

echo "anchor peer for org5"
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org5.aeries.io/msp" peer0.org5.aeries.io peer channel update -o orderer.aeries.io:7050 -c artchannel -f /etc/hyperledger/configtx/channel-artifacts/Org5MSPanchors.tx
sleep 10
echo "Done adding to channels"
