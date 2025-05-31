import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const message =
          context.switchToHttp().getResponse().locals.message || 'Success';
        const statusCode =
          context.switchToHttp().getResponse().statusCode || HttpStatus.OK;

        return {
          statusCode,
          message: data.message || message,
          data: data?.data
            ? data?.data
            : data?.message && !data?.data
              ? undefined
              : data,
          meta: data?.meta,
        };
      }),
      catchError((error) => {
        const status = error?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
          error?.response?.message || error?.message || 'Internal server error';

        return throwError(() => ({
          statusCode: status,
          message: message,
          error: error?.response?.error || error?.name || 'Error',
          data: null,
        }));
      }),
    );
  }
}
