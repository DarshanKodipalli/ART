#!/bin/bash

echo "Create all peercards and import them"

composer network install --card PeerAdmin@artnetwork-org1 --archiveFile test/dist/test@0.0.1.bna
composer network install --card PeerAdmin@artnetwork-org2 --archiveFile test/dist/test@0.0.1.bna
composer network install --card PeerAdmin@artnetwork-org3 --archiveFile test/dist/test@0.0.1.bna
composer network install --card PeerAdmin@artnetwork-org4 --archiveFile test/dist/test@0.0.1.bna
composer network install --card PeerAdmin@artnetwork-org5 --archiveFile test/dist/test@0.0.1.bna

composer identity request -c PeerAdmin@artnetwork-org1 -u admin -s adminpw -d org1user
composer identity request -c PeerAdmin@artnetwork-org2 -u admin -s adminpw -d org2user
composer identity request -c PeerAdmin@artnetwork-org3 -u admin -s adminpw -d org3user
composer identity request -c PeerAdmin@artnetwork-org4 -u admin -s adminpw -d org4user
composer identity request -c PeerAdmin@artnetwork-org5 -u admin -s adminpw -d org5user

composer network start -c PeerAdmin@artnetwork-org1 -a test/dist/test@0.0.1.bna -o endorsementPolicyFile=endorsement-policy.json -A org1user -C org1user/admin-pub.pem -A org2user -C org2user/admin-pub.pem


echo "Done!"
