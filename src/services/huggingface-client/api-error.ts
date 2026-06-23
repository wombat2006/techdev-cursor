import type { AxiosError } from 'axios';
import type { HuggingFaceError } from '../../types/huggingface';

export function mapAxiosErrorToHuggingFaceError(error: AxiosError): HuggingFaceError {
  const statusCode = error.response?.status || 500;
  const errorData = error.response?.data as { error?: string } | undefined;
  const errorMessage = errorData?.error || error.message || 'Unknown HuggingFace API error';

  const hfError = new Error(errorMessage) as HuggingFaceError;
  hfError.error = errorMessage;
  hfError.statusCode = statusCode;
  hfError.details = errorData;
  hfError.model = error.config?.url?.split('/').pop();
  hfError.retryable = statusCode >= 500 || statusCode === 429;

  return hfError;
}
