
## Project setup

### ETL

```
conda env create -f environment.yaml
conda activate trivia_quote
cd etl/src
python build_questions.py
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