set -e

# set up nvm
source /.nvm/nvm.sh
nvm use v16.17.0

cd /server

npm run start:prod