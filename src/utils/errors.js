import { GraphQLError } from 'graphql';

export class ClientError extends GraphQLError {
    constructor(message, statusCode = 400) {
        super(message, {
            extensions: { code: statusCode },
        });

        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AuthorizationError extends ClientError {
    constructor(message = 'Unauthorized User') {
        super(message, 401);
    }
}

export class BadRequestError extends ClientError {
    constructor(message = "Invalid request") {
        super(message, 400);
    }
}