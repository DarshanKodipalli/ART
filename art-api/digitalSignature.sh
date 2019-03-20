#!/bin/bash
pwd
cd digisign/
echo "Inside Batch Script"
echo $1
# filepath="../$1"
# echo $filepath
pwd
echo mvn exec:java -Dexec.mainClass="signature.CreateVisibleSignature" -Dexec.args="../praveen1.p12 password ../$1 ../$2"
exec mvn exec:java -Dexec.mainClass="signature.CreateVisibleSignature" -Dexec.args="../praveen1.p12 password ../$1 ../$2"