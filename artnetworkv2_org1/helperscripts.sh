
docker rmi -f $(docker images |grep 'dev*')

replace ca's of orgs in docker-compose.yaml



cp crypto-config/peerOrganizations/org1.aeries.io/users/Admin@org1.aeries.io/msp/admincerts/*.pem tmp/composer/org1/
cp crypto-config/peerOrganizations/org1.aeries.io/users/Admin@org1.aeries.io/msp/keystore/* tmp/composer/org1/

cp crypto-config/peerOrganizations/org2.aeries.io/users/Admin@org2.aeries.io/msp/admincerts/*.pem tmp/composer/org2/
cp crypto-config/peerOrganizations/org2.aeries.io/users/Admin@org2.aeries.io/msp/keystore/* tmp/composer/org2/



sed -i -e 's/\r$//' scriptname.sh

vagrant reload


vagrant up
vagrant ssh

composer archive create -t dir -n ../


composer identity issue -c admin@test -f buyer1.card -u buyer1 -a "resource:io.aeries.art.participant.Buyer#buyer1@gmail.com"
