set -e

# build the server out
cd server
npm run lint

cd ../client
npm run lint