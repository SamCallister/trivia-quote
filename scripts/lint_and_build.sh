set -e

./scripts/lint.sh

# build the server out
cd server
npm run build
cp package.json dist/package.json
cp -R config dist/config
cp ../cloudwatch-agent-config.json dist/cloudwatch-agent-config.json

# build the client out
cd ../client
npm run build

cd ..
cp -R client/build/* server/dist/public
cp server/questions.db server/dist/questions.db

cd server/dist
# zip it up
zip -vr dist.zip . -x "*.DS_Store"

mv dist.zip ../../dist.zip

cd ../../