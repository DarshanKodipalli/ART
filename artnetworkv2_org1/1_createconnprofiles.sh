#!/bin/sh

awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' crypto-config/ordererOrganizations/aeries.io/orderers/orderer.aeries.io/tls/ca.crt > tmp/composer/ca-orderer.txt

#create all txt files in similar order

rm -rf tmp/composer/org1/ca-org1.json
rm -rf tmp/composer/org2/ca-org2.json
rm -rf tmp/composer/org3/ca-org3.json
rm -rf tmp/composer/org4/ca-org4.json
rm -rf tmp/composer/org5/ca-org5.json
rm -rf tmp/composer/ca-orderer.json

cp tmp/composer/org1/ca-org1.txt tmp/composer/org1/ca-org1.json
cp tmp/composer/org2/ca-org2.txt tmp/composer/org2/ca-org2.json
cp tmp/composer/org3/ca-org3.txt tmp/composer/org3/ca-org3.json
cp tmp/composer/org4/ca-org4.txt tmp/composer/org4/ca-org4.json
cp tmp/composer/org5/ca-org5.txt tmp/composer/org5/ca-org5.json
cp tmp/composer/ca-orderer.txt tmp/composer/ca-orderer.json


sed -i 's/\//\\\//g' tmp/composer/org1/ca-org1.json
sed -i 's/\//\\\//g' tmp/composer/org2/ca-org2.json
sed -i 's/\//\\\//g' tmp/composer/org3/ca-org3.json
sed -i 's/\//\\\//g' tmp/composer/org4/ca-org4.json
sed -i 's/\//\\\//g' tmp/composer/org5/ca-org5.json
sed -i 's/\//\\\//g' tmp/composer/ca-orderer.json

sed -i 's/\\n/$/g' tmp/composer/org1/ca-org1.json
sed -i 's/\\n/$/g' tmp/composer/org2/ca-org2.json
sed -i 's/\\n/$/g' tmp/composer/org3/ca-org3.json
sed -i 's/\\n/$/g' tmp/composer/org4/ca-org4.json
sed -i 's/\\n/$/g' tmp/composer/org5/ca-org5.json
sed -i 's/\\n/$/g' tmp/composer/ca-orderer.json

ORG1CA=`cat tmp/composer/org1/ca-org1.json`
ORG2CA=`cat tmp/composer/org2/ca-org2.json`
ORG3CA=`cat tmp/composer/org3/ca-org3.json`
ORG4CA=`cat tmp/composer/org4/ca-org4.json`
ORG5CA=`cat tmp/composer/org5/ca-org5.json`
CAORDERER=`cat tmp/composer/ca-orderer.json`

echo $ORG1CA

rm -rf artnetwork.json

sed -i 's/INSERT_ORG1_CA_CERT/'"$ORG1CA"'/g' artnetwork.json
sed -i 's/INSERT_ORG2_CA_CERT/'"$ORG2CA"'/g' artnetwork.json
sed -i 's/INSERT_ORG3_CA_CERT/'"$ORG3CA"'/g' artnetwork.json
sed -i 's/INSERT_ORG4_CA_CERT/'"$ORG4CA"'/g' artnetwork.json
sed -i 's/INSERT_ORG5_CA_CERT/'"$ORG5CA"'/g' artnetwork.json
sed -i 's/INSERT_ORDERER_CA_CERT/'"$CAORDERER"'/g' artnetwork.json


sed -i 's/\\\//\//g' artnetwork.json
sed -i 's/$/\\n/g' artnetwork.json

echo "Replaced certificate data"
