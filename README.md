# SQS Evenbridge POC

This project is an example of how to use SQS and Evenbridge with AWS CDK.

The `cdk.json` file tells the CDK Toolkit how to execute this app.

## Orchestration flow

Once this stack is deployed, a SQS queue will be the entry point for incoming events. An EventBridge Pipe will constantly pull events from the queue and send them to an EventBridge Bus. Each event will be matched against defined rules and re-routed accordingly.

This example implementation is expecting an event defined as:

```json
{
    "type": "A",
    "data": {
        "key": "value",
        "key2": "value2"
        ... // arbitrary data
    },
    "otherKey": "otherValue"
}
```

Once the pipe extracts this message from SQS, it will run a transformer on it before sending it to the event bus. By this time, the event will look like:

```json
{
    "messageId": "ab920c0e-5f6e-4d2e-9a5e-1b0e4d2e4d2e",
    "type": "A",
    "data": {
        "key": "value",
        "key2": "value2"
        ... // arbitrary data
    },
    "originalEvent": {
        "type": "A",
        "data": {
            "key": "value",
            "key2": "value2"
            ... // arbitrary data
        },
        "otherKey": "otherValue"
    }
}
```

Rules defined in this stack will look for the `type` property:

- If the type is `A`, the event will be passed to the `lambdaA` function
- If the type is `B`, the event will be passed to the `lambdaB` function
- Every event will match a rule that just logs events to CloudWatch within the _event-bridge-logs_ log group.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
- `npx cdk destroy` destroy the stack (all resources will be deleted and data will be lost, but we make sure we don't incur additional charges)
