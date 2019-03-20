#!/bin/bash

echo "Export orgs"

mkdir -p tmp/composer/org1


export ORG1=crypto-config/peerOrganizations/org1.aeries.io/users/Admin@org1.aeries.io/msp
cp -p $ORG1/signcerts/A*.pem tmp/composer/org1
cp -p $ORG1/keystore/*_sk tmp/composer/org1

echo "Done!"
