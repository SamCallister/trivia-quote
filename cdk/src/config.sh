#!/bin/bash -xe
sudo yum update -y

# install cloudwatch agent
sudo yum install amazon-cloudwatch-agent -y

# install node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install v16.17.0
nvm use v16.17.0
npm install pm2 -g
