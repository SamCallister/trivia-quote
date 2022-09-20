import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as path from 'path';
// import { KeyPair } from 'cdk-ec2-key-pair';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';

export class Ec2CdkStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// Create a Key Pair to be used with this EC2 Instance
		// Temporarily disabled since `cdk-ec2-key-pair` is not yet CDK v2 compatible
		// const key = new KeyPair(this, 'KeyPair', {
		//   name: 'cdk-keypair',
		//   description: 'Key Pair created with CDK Deployment',
		// });
		// key.grantReadOnPublicKey
		// Create new VPC with 2 Subnets
		const vpc = new ec2.Vpc(this, 'VPC', {
			natGateways: 0,
			subnetConfiguration: [{
				cidrMask: 24,
				name: "asterisk",
				subnetType: ec2.SubnetType.PUBLIC
			}],
		});

		const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
			vpc,
			instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
			machineImage: new ec2.AmazonLinuxImage(),
			desiredCapacity: 1,
			minCapacity: 1,
			maxCapacity: 1
		});



		const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
			vpc,
			internetFacing: true,
		});

		const MY_DOMAIN = "triviaquote.com";
		const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: MY_DOMAIN })


		const certificate = new acm.Certificate(this, 'Certificate', {
			domainName: MY_DOMAIN,
			validation: acm.CertificateValidation.fromDns(zone),
		});

		const target = route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(lb));

		new route53.ARecord(this, "triviaQuoteARecord", {
			zone,
			target,
		});

		const listener = lb.addListener("listener", {
			certificates: [elbv2.ListenerCertificate.fromArn(certificate.certificateArn)],
			port: 443,
			protocol: elbv2.ApplicationProtocol.HTTPS
		});

		listener.addTargets('Target', {
			port: 80,
			targets: [asg]
		});

		listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');

		// Create an asset that will be used as part of User Data to run on first load
		const asset = new Asset(this, 'codeZip', { path: path.join(__dirname, '../../dist.zip') });

		const userDataScript = readFileSync(
			path.join(__dirname, '../src/config.sh')
			, 'utf8');

		asg.addUserData(userDataScript)
		const localPath = asg.userData.addS3DownloadCommand({
			bucket: asset.bucket,
			bucketKey: asset.s3ObjectKey,
		});

		asg.userData.addCommands(
			`mkdir server`,
			`cd server`,
			`unzip ${localPath}`,
			`npm install`,
			`npm run start:prod`
		)

		asg.userData.addExecuteFileCommand({
			filePath: localPath,
			arguments: '--verbose -y'
		})

		asg.scaleOnRequestCount('AModestLoad', {
			targetRequestsPerMinute: 10000,
		});

		asset.grantRead(asg.role);

	}
}