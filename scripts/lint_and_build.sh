set -e

# build the server out
cd server
npm run lint
npm run build

# build the client out
cd ../client
npm run lint
npm run build

cd ..
cp -R client/build/* server/dist/public