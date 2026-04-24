import { ConflictException } from '@nestjs/common';

interface MongoLikeError {
  code?: number;
}

export function throwIfDuplicateKey(error: unknown, message: string): never | void {
  const mongoError = error as MongoLikeError | undefined;
  if (mongoError?.code === 11000) {
    throw new ConflictException(message);
  }
}
