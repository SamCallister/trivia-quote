set -e

# put dist file into s3
HASH=$(shasum dist.zip | cut -d " " -f 1)
FILE_NAME="${HASH}.zip"

BUCKET_PATH="s3://trivia-quote-builds/builds/${FILE_NAME}"
# put the file into s3
echo "uploading dist.zip to ${BUCKET_PATH}"

aws s3 cp dist.zip $BUCKET_PATH

# create deployment
aws deploy create-deployment --application-name LoadBalancerTriviaQuote-triviaQuoteApp6A69BECB-NjFM4lH5aaF5  --deployment-config-name CodeDeployDefault.OneAtATime --deployment-group-name LoadBalancerTriviaQuote-triviaQuoteGroup2E420ADB-W7L8VFEMJIN --s3-location bucket=trivia-quote-builds,bundleType=zip,key=builds/$FILE_NAME
