set -e

# build the server out
cd server
npm run lint
npm run build
cp package.json dist/package.json

# build the client out
cd ../client
npm run lint
npm run build

cd ..
cp -R client/build/* server/dist/public

cd server/dist
# zip it up
zip -vr dist.zip . -x "*.DS_Store"

mv dist.zip ../../dist.zip

cd ../../