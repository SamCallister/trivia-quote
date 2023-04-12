set -e

# set up nvm
source /.nvm/nvm.sh
nvm use v16.17.0

cd /server

# change swap configuration
sudo /sbin/swapoff /var/swap.1 || true
sudo /bin/dd if=/dev/zero of=/var/swap.1 bs=1M count=1024
sudo /sbin/mkswap /var/swap.1
sudo /sbin/swapon /var/swap.1

npm install
sudo /sbin/swapoff /var/swap.1
