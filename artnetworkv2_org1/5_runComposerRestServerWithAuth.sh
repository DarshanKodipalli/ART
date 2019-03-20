#!/bin/bash

export COMPOSER_CARD=admin@test

printenv | grep ^COMPOSER_CARD

export COMPOSER_NAMESPACES=never

printenv | grep ^COMPOSER_NAMESPACES

export COMPOSER_AUTHENTICATION=true

printenv | grep ^COMPOSER_AUTHENTICATION

export COMPOSER_PROVIDERS='{
  "local": {
    "provider": "local",
    "module": "passport-local",
    "usernameField":"username",
    "passwordField":"password",
    "authPath":"/auth/local",
    "callbackURL":"/auth/local/callback",
    "successRedirect":"/",
    "failureRedirect":"/",
    "setAccessToken":true,
    "json":true
  }
}'
#"setAccessToken"=true
#"callbackURL":"/auth/local/callback",
#"successRedirect":"/",
#"failureRedirect":"/",
printenv | grep COMPOSER_PROVIDERS

export COMPOSER_MULTIUSER=true
export COMPOSER_DATASOURCES='{
  "db": {
    "host": "ds161950.mlab.com",
    "port": 37281,
    "url": "mongodb://darshan_k:darshan_k7@ds161950.mlab.com:61950/testwallet",
    "database": "testwallet",
    "password": "darshan_k7",
    "name": "mongodb",
    "user": "darshan_k",
    "connector": "mongodb"
  }
}'

composer-rest-server