import { GraphQLError } from 'graphql';

export class ClientError extends GraphQLError {
    constructor(message, statusCode = 400, code='SOMETHING_BAD_HAPPENED' ) {
        super(message, {
            extensions: {
                code: code,
                http: {
                    status: statusCode,
                },
            },

        });

        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AuthorizationError extends ClientError {
    constructor(message = 'Unauthorized User') {
        super(message, 401, 'AUTHORIZATION_ERROR');
    }
}

export class BadRequestError extends ClientError {
    constructor(message = "Invalid request") {
        super(message, 400, 'BAD_USER_INPUT');
    }
}