#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SqsEvenbridgePocStack } from "../lib/sqs-evenbridge-poc-stack";

const app = new cdk.App();
new SqsEvenbridgePocStack(app, "SqsEvenbridgePocStack", {
  env: { account: "992382429717", region: "us-east-1" },
});
