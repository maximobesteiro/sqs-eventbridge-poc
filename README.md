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
        "key2": "value2",
        ... // arbitrary data
    },
    "otherKey": "otherValue"
}
```

Once the pipe extracts this message from SQS, it will run a transformer on it before sending it to the event bus. By this time, the event will look like:

```json
{
    "messageId": "ae097920-c8c5-4979-a60f-4f0c1ade2e16",
    "type": "A",
    "data": {
        "key": "value",
        "key2": "value2",
        ... // arbitrary data
    },
    "originalEvent": "originalEvent": {
        "messageId": "ae097920-c8c5-4979-a60f-4f0c1ade2e16",
        "receiptHandle": "AQEBS8P2qMiHtXRjwcianGcN05SCFTXJdRm5+IgauVy4GOPnwuO3LJK+61vVygvVG+kas+BNYBhXZAHhQ3EhBOP3RiiGJLmva+405SI/yQWFx+F7LPeuN0AE80p7T2z34o4Gf0YN7xq2M8VHvqI3tm8mUDzi/ud2knj5X1/lslNQBXjBQUCZVRdIcs/X5syo6UcGB/bGxBj6dMAZdXBz/jKpX8W4skY5WI3LihWXVf5iopMVZA4bSaMUeqFOdST/0i80DeHcXd89yJUQRae5dH/z99ILTQ89bo4Rc7Ksxb8+Bx9mrpc9jJvImUgDvfVrrehF43a/PSRevllbCmsxXSSjvzA7DpEf+X2UYipHrHXFpIyCQJ1g2noaV1Uw3Oc/BZrfNQqRr93jeTbzW33mSttzQZ20QjNIdvgd2afzpRJgqsy/VBFraJqZifK6WbfwRcNM",
        "body": {
            "type": "A",
            "data": {
                "key": "value",
                "key2": "value2",
            },
            "otherKey": "otherValue"
        },
        "attributes": {
            "ApproximateReceiveCount": "1",
            "SentTimestamp": "1712594571322",
            "SenderId": "AIDA6ODU2FIKSQ6GBWE4N",
            "ApproximateFirstReceiveTimestamp": "1712594571330"
        },
        "messageAttributes": {},
        "md5OfMessageAttributes": null,
        "md5OfBody": "4188763a5b282343526340d8572369c2",
        "eventSource": "aws:sqs",
        "eventSourceARN": "arn:aws:sqs:us-east-1:992382429717:SqsEvenbridgeStack-eventqueue6D4A6A10-cHOKhRInxLJU",
        "awsRegion": "us-east-1"
    }
}
```

Rules defined in this stack will look for the `type` property:

- If the type is `A`, the event will be passed to the `lambdaA` function
- If the type is `B`, the event will be passed to the `lambdaB` function
- Every event will match a rule that just logs events to CloudWatch within the _event-bridge-logs_ log group.

## Sending a message to SQS from the command line

> [!NOTE]
> Make sure to have AWS CLI locally installed and configured.

To queue a message, run the following command in your terminal (replace the queue URL by looking for it in the AWS console):

```console
aws sqs send-message --queue-url=https://sqs.us-east-1.amazonaws.com/992382429717/SqsEvenbridgePocStack-eventqueue6D4A6A10-D5ZYUvzTCcMA --message-body '{ "type": "C", "data": { "adId": "12345", "source": "SSP1" }}'
```

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
- `npx cdk destroy` destroy the stack (all resources will be deleted and data will be lost, but we make sure we don't incur additional charges)
