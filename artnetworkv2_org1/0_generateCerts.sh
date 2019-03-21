#!/bin/bash

rm -rf channel-artifacts
rm -rf crypto-config
sudo rm -rf channel
rm -rf tmp
mkdir -p tmp/composer/org1

./bin/cryptogen generate --config=./crypto-config.yaml

mkdir channel-artifacts
mkdir channel

./bin/configtxgen -profile FiveOrgsOrdererGenesis -outputBlock ./channel-artifacts/genesis.block

./bin/configtxgen -profile FiveOrgsChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID "artchannel"


./bin/configtxgen -profile FiveOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID "artchannel" -asOrg Org1MSP

echo "Done"

