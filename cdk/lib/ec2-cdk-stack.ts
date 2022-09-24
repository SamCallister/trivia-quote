import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
// import { KeyPair } from 'cdk-ec2-key-pair';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';

const ELASTIC_IP_ADDRESS = "54.70.187.31";
const ELASTIC_IP_ALLOCATION_ID = "eipalloc-0b5154af8c4e13dd1";

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

		const securityGroup = new ec2.SecurityGroup(this, "ec2-ssh-security-group", {
			vpc,
			description: 'Allow SSH (TCP port 22) in',
			allowAllOutbound: true
		});

		securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH Access');
		securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow http access');

		const role = new iam.Role(this, 'ec2Role', {
			assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
		})

		role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))

		const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
			vpc,
			securityGroup,
			instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
			machineImage: new ec2.AmazonLinuxImage(),
			desiredCapacity: 1,
			minCapacity: 1,
			maxCapacity: 1,
			role
		});


		const lb = new elbv2.NetworkLoadBalancer(this, 'LB', {
			vpc,
			internetFacing: true,
			vpcSubnets: { subnets: [vpc.publicSubnets[0]] }
		});

		// hackworkaround for elasticIP https://github.com/aws/aws-cdk/issues/9696
		const cfnLoadBalancer: elbv2.CfnLoadBalancer = lb.node.defaultChild as elbv2.CfnLoadBalancer;
		const subnetMappingProperty: elbv2.CfnLoadBalancer.SubnetMappingProperty = {
			subnetId: vpc.publicSubnets[0].subnetId,
			// eipalloc-XXXXYYYYxxxxyyyy
			allocationId: ELASTIC_IP_ALLOCATION_ID,
		};
		cfnLoadBalancer.subnetMappings = [subnetMappingProperty];
		cfnLoadBalancer.subnets = undefined;
		// end hackworkaround

		const MY_DOMAIN = "triviaquote.com";
		const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName: MY_DOMAIN })


		const certificate = new acm.Certificate(this, 'Certificate', {
			domainName: MY_DOMAIN,
			validation: acm.CertificateValidation.fromDns(zone),
		});

		//route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(lb));
		const target = route53.RecordTarget.fromIpAddresses(ELASTIC_IP_ADDRESS);

		new route53.ARecord(this, "triviaQuoteARecord", {
			zone,
			target,
		});

		const listener = lb.addListener("networkLoadBalancerListener", {
			certificates: [elbv2.ListenerCertificate.fromArn(certificate.certificateArn)],
			port: 443,
			protocol: elbv2.Protocol.TLS,
		});

		listener.addTargets('Target', {
			port: 80,
			targets: [asg],
			protocol: elbv2.Protocol.TCP
		});


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
			`npm install pm2 -g`,
			`npm install`,
			`npm run start:prod`
		)

		asg.userData.addExecuteFileCommand({
			filePath: localPath,
			arguments: '--verbose -y'
		})

		asg.scaleOnCpuUtilization('AModestLoad', {
			targetUtilizationPercent: 0.9
		});

		asset.grantRead(asg.role);

	}
}