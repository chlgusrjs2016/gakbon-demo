export type ErrorResponse = {
  code: string;
  message: string;
  detail?: string;
  retryable?: boolean;
  context?: Record<string, unknown>;
};

export function toErrorResponse(input: unknown, fallbackCode: string, fallbackMessage: string): ErrorResponse {
  if (input instanceof Error) {
    return {
      code: fallbackCode,
      message: fallbackMessage,
      detail: input.message,
      retryable: true,
    };
  }

  if (typeof input === "string" && input.trim()) {
    return {
      code: fallbackCode,
      message: fallbackMessage,
      detail: input,
      retryable: true,
    };
  }

  return {
    code: fallbackCode,
    message: fallbackMessage,
    retryable: true,
  };
}
