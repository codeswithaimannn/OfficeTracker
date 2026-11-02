import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter.js';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();
  const path = '/api/test';

  it('keeps the status and message of an HttpException', () => {
    const body = filter.toErrorBody(
      new NotFoundException('No such thing'),
      path,
    );

    expect(body).toMatchObject({
      statusCode: HttpStatus.NOT_FOUND,
      error: 'NOT_FOUND',
      message: 'No such thing',
      path,
    });
  });

  it('keeps the list of messages from a validation error', () => {
    const messages = ['name must be a string', 'name should not be empty'];
    const body = filter.toErrorBody(new BadRequestException(messages), path);

    expect(body.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.message).toEqual(messages);
  });

  it('hides the details of an unexpected error', () => {
    const body = filter.toErrorBody(
      new Error('connection to db at 10.0.0.5 failed'),
      path,
    );

    expect(body.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.message).toBe('Something went wrong');
    expect(JSON.stringify(body)).not.toContain('10.0.0.5');
  });

  it('adds an ISO timestamp', () => {
    const body = filter.toErrorBody(new NotFoundException(), path);

    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});
