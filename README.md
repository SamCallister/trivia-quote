
## Project setup

### ETL

```
conda env create -f environment.yaml
conda activate trivia_quote
cd etl
python src/build_questions.py
```

### Client

[Create react app reference](https://facebook.github.io/create-react-app)

```
cd client
npm install
```

### Server

```
cd server
npm install
```

## Prod build

Build both server and client into `server/dist`

```
./scripts/lint_and_build.sh
```

## Deployment

CDK code [based off example here](https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/ec2-instance)

You need to have cdk installed and bootstrapped:
```
npm install -g aws-cdk
cdk bootstrap
```

Build the cloud formation templates and deploy
```
cd cdk
npm run build
cdk deploy
```