import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ErrorHandler {
  static async execute<T>(
    action: () => Promise<T>,
    context: string,
  ): Promise<T> {
    try {
      return await action();
    } catch (error) {
      ErrorHandler.handle(error, context);
      throw error; // satisfies TS
    }
  }

  // Generic error handler
  static handle(error: unknown, context = 'Unknown'): never {
    if (error instanceof HttpException) {
      throw error;
    }

    console.error(`[${context}] Error:`, error);

    // Prisma known errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const field = ErrorHandler.extractField(error);
        throw new ConflictException(`${field} already exists`);
      }

      if (error.code === 'P2003') {
        throw new BadRequestException('Foreign key constraint violation');
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Requested record not found');
      }

      throw new BadRequestException(`Database error: ${error.code}`);
    }

    // Prisma validation error
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new BadRequestException('Invalid database query');
    }

    // Database unavailable
    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientRustPanicError
    ) {
      throw new ServiceUnavailableException('Database service unavailable');
    }

    // Fallback
    throw new InternalServerErrorException(`${context}: Operation failed`);
  }

  // 🔹 NEW helper (added)
  private static extractField(
    error: Prisma.PrismaClientKnownRequestError,
  ): string {
    const match = error.message.match(/\(`(.+?)`\)/);
    return match?.[1] ?? 'field';
  }

  /* =======================
     Convenience helpers
     ======================= */

  static alreadyExists(resource: string): never {
    throw new ConflictException(`${resource} already exists`);
  }

  static notFound(resource: string): never {
    throw new NotFoundException(`${resource} not found`);
  }

  static invalidCredentials(message = 'Invalid Credentials!'): never {
    throw new BadRequestException(message);
  }

  static unauthorized(message = 'Unauthorized'): never {
    throw new UnauthorizedException(message);
  }

  static serviceUnavailable(service = 'service'): never {
    throw new ServiceUnavailableException(
      `${service} is currently unavailable`,
    );
  }

  static operationFailed(operation = 'operation'): never {
    throw new ServiceUnavailableException(`${operation} failed`);
  }
}
