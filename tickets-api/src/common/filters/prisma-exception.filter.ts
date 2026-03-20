import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientRustPanicError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    // Prisma known errors (con code)
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      let status = HttpStatus.BAD_REQUEST;
      let message = 'Database error';

      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = `Unique constraint failed: ${
            (exception.meta as any)?.target?.join?.(', ') ?? ''
          }`;
          break;

        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint failed';
          break;

        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;

        default:
          status = HttpStatus.BAD_REQUEST;
          message = `Prisma error ${exception.code}`;
      }

      return res.status(status).json({
        statusCode: status,
        error: HttpStatus[status],
        message,
      });
    }

    // Prisma validation errors (query inválida)
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: HttpStatus[HttpStatus.BAD_REQUEST],
        message: 'Invalid database query',
      });
    }

    // Prisma unknown/init/panic -> 500 controlado
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
      message: 'Database internal error',
    });
  }
}