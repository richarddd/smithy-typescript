import {
  BuildHandler,
  BuildHandlerArguments,
  BuildMiddleware,
  BodyLengthCalculator,
  MetadataBearer,
  BuildHandlerOutput,
  Pluggable,
  BuildHandlerOptions,
} from "@aws-sdk/types";
import { HttpRequest } from "@aws-sdk/protocol-http";

const CONTENT_LENGTH_HEADER = "content-length";

export function contentLengthMiddleware(bodyLengthChecker: BodyLengthCalculator): BuildMiddleware<any, any> {
  return <Output extends MetadataBearer>(next: BuildHandler<any, Output>): BuildHandler<any, Output> => async (
    args: BuildHandlerArguments<any>
  ): Promise<BuildHandlerOutput<Output>> => {
    let request = args.request;
    if (HttpRequest.isInstance(request)) {
      const { body, headers } = request;
      if (
        body &&
        Object.keys(headers)
          .map((str) => str.toLowerCase())
          .indexOf(CONTENT_LENGTH_HEADER) === -1
      ) {
        const length = bodyLengthChecker(body);
        if (length !== undefined) {
          request.headers = {
            ...request.headers,
            [CONTENT_LENGTH_HEADER]: String(length),
          };
        }
      }
    }

    return next({
      ...args,
      request,
    });
  };
}

export const contentLengthMiddlewareOptions: BuildHandlerOptions = {
  step: "build",
  tags: ["SET_CONTENT_LENGTH", "CONTENT_LENGTH"],
  name: "contentLengthMiddleware",
};

export const getContentLengthPlugin = (options: { bodyLengthChecker: BodyLengthCalculator }): Pluggable<any, any> => ({
  applyToStack: (clientStack) => {
    clientStack.add(contentLengthMiddleware(options.bodyLengthChecker), contentLengthMiddlewareOptions);
  },
});
