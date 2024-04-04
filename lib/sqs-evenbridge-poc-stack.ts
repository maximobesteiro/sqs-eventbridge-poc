import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as pipes from "aws-cdk-lib/aws-pipes";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as logs from "aws-cdk-lib/aws-logs";

export class SqsEvenbridgePocStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SQS Queue
    const queue = new sqs.Queue(this, "EventQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // Event Bus
    const eventBus = new events.EventBus(this, "EventBus");

    // Source policy
    const sourcePolicy = new iam.PolicyStatement({
      actions: [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
      ],
      resources: [queue.queueArn],
      effect: iam.Effect.ALLOW,
    });

    // Target policy
    const targetPolicy = new iam.PolicyStatement({
      actions: ["events:PutEvents"],
      resources: [eventBus.eventBusArn],
      effect: iam.Effect.ALLOW,
    });

    // Create a Pipe role
    const pipeRole = new iam.Role(this, "PipeRole", {
      assumedBy: new iam.ServicePrincipal("pipes.amazonaws.com"),
    });

    // Attach the policy to the role
    pipeRole.addToPolicy(sourcePolicy);
    pipeRole.addToPolicy(targetPolicy);

    // Create an EventBridge Pipe
    const pipe = new pipes.CfnPipe(this, "SQSEventBridgePipe", {
      roleArn: pipeRole.roleArn,
      source: queue.queueArn,
      sourceParameters: {
        sqsQueueParameters: {
          batchSize: 5,
          maximumBatchingWindowInSeconds: 60,
        },
      },
      target: eventBus.eventBusArn,
    });

    // Lambda Functions for type A
    const lambdaA = new lambda.Function(this, "LambdaA", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"), // code loaded from "lambda" directory
      handler: "typeA.handler", // file is "typeA", function is "handler"
      logRetention: logs.RetentionDays.ONE_WEEK, // Customize log retention
    });

    // Lambda Functions for type B
    const lambdaB = new lambda.Function(this, "LambdaB", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"), // code loaded from "lambda" directory
      handler: "typeB.handler", // file is "typeB", function is "handler"
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // EventBridge Rule for type A events
    const ruleA = new events.Rule(this, "RuleA", {
      description: "Route events with type A to Lambda A",
      eventBus: eventBus,
      eventPattern: {
        source: [queue.queueName],
        detail: {
          type: ["A"],
        },
      },
      targets: [new targets.LambdaFunction(lambdaA)],
    });

    // EventBridge Rule for type B events
    const ruleB = new events.Rule(this, "RuleB", {
      description: "Route events with type B to Lambda B",
      eventBus: eventBus,
      eventPattern: {
        detail: {
          type: ["B"],
        },
      },
      targets: [new targets.LambdaFunction(lambdaB)],
    });

    //  CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, "EventBridgeLogs");

    // EventBridge Rule for all events (logging)
    const loggingRule = new events.Rule(this, "LoggingRule", {
      description: "Log all events to CloudWatch",
      eventBus: eventBus,
      eventPattern: {
        source: [queue.queueName],
      },
      targets: [new targets.CloudWatchLogGroup(logGroup)],
    });
  }
}
