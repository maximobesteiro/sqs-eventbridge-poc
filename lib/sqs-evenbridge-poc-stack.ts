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

    // Grant EventBridge permission to read from the queue
    const eventBridgePrincipal = new iam.ServicePrincipal(
      "events.amazonaws.com"
    );
    queue.grantConsumeMessages(eventBridgePrincipal);

    // Create an EventBridge Pipe
    const pipe = new pipes.Pipe(this, "MyPipe");
    pipe.addEventSource(queue); // Attach the SQS queue as the source

    // Lambda Functions for type A and B
    const lambdaA = new lambda.Function(this, "LambdaA", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"), // code loaded from "lambda" directory
      handler: "typeA.handler", // file is "typeA", function is "handler"
      logRetention: logs.RetentionDays.ONE_WEEK, // Customize log retention
    });

    const lambdaB = new lambda.Function(this, "LambdaB", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"), // code loaded from "lambda" directory
      handler: "typeB.handler", // file is "typeB", function is "handler"
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // EventBridge Rule for type A events
    const ruleA = new events.Rule(this, "RuleA", {
      description: "Route events with type A to Lambda A",
      eventPattern: {
        source: [queue.queueName],
        detail: {
          type: ["A"],
        },
      },
    });
    ruleA.addTarget(new targets.LambdaFunction(lambdaA));

    // EventBridge Rule for type B events
    const ruleB = new events.Rule(this, "RuleB", {
      description: "Route events with type B to Lambda B",
      eventPattern: {
        source: [queue.queueName],
        detail: {
          type: ["B"],
        },
      },
    });
    ruleB.addTarget(new targets.LambdaFunction(lambdaB));

    // EventBridge Rule for all events (logging)
    const loggingRule = new events.Rule(this, "LoggingRule", {
      description: "Log all events to CloudWatch",
      eventPattern: {
        source: [queue.queueName],
      },
    });

    //  CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, "EventBridgeLogs");
    loggingRule.addTarget(new targets.CloudWatchLogGroup(logGroup));
  }
}
