import * as cdk from 'aws-cdk-lib';
import { Ec2CdkStack } from '../lib/ec2-cdk-stack';


const envUSA = { account: '055588682254', region: 'us-west-2' };

const app = new cdk.App();

new Ec2CdkStack(app, 'LoadBalancerTriviaQuote', {
	description: "Public facing ec2 instance running node app",
	env: envUSA
});