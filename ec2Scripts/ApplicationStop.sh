set -e

# set up nvm
source /.nvm/nvm.sh
nvm use v16.17.0

# stop the app via process manager
pm2 stop index || true