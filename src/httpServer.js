import { ApolloServer } from "@apollo/server";

import express from 'express';
import cors from 'cors';
import http from 'http';

import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } from "@apollo/server/plugin/landingPage/default";

import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws'


import { resolvers, typeDefs } from "./schema/todoSchema.js";
import { AuthorizationError, BadRequestError, ClientError } from "./utils/errors.js";
import { validateToken } from "./utils/auth.js";
import { GraphQLError } from "graphql";


const app = express();
const httpServer = http.createServer(app);
const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/subscriptions',
});

const serverCleanup = useServer({
    schema,
    context: async (ctx, msg, args) => {
        const { Authorization } = ctx.connectionParams;
        const user = validateToken(Authorization);
        return { user };
    },
    onError: (ctx, msg, errors) => {
        errors.forEach((error) => {
            const formatted =
                error instanceof ClientError
                    ? { message: error.message, code: error.extensions?.code }
                    : { message: 'Internal server error', code: 500 };
            console.error('WS Error:', formatted);
        });
    }
}, wsServer);

const server = new ApolloServer({
    schema,
    formatError: (formattedError, error) => {
        if (error.originalError instanceof GraphQLError) {
            if (formattedError.extensions && formattedError.extensions.code == 'BAD_USER_INPUT')
                return {
                    message: formattedError.message,
                    code: 'BAD_USER_INPUT',
                };
        }
        if (error.originalError instanceof BadRequestError) {
            const clientError = error.originalError;
            return {
                message: clientError.message,
                code: clientError.extensions?.code || 400,
            };
        }

        if (error.originalError instanceof AuthorizationError) {
            const clientError = error.originalError;
            return {
                message: clientError.message,
                code: clientError.extensions?.code || 401,
            };
        }



        console.log(error);

        return {
            message: 'Internal server error',
            code: 500,
        };
    },
    plugins: [
        process.env.NODE_ENV === 'development' ?
            ApolloServerPluginLandingPageLocalDefault({
                footer: false,
                embed: {
                    endpointIsEditable: true
                }
            }) :
            ApolloServerPluginLandingPageProductionDefault(),
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ],
});

await server.start()

app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
        context: async ({ req }) => {
            try {
                const { authorization: Authorization } = req.headers;
                const user = validateToken(Authorization)
                return { user };
            } catch (error) {
                return;
            }
        }
    }),
);

await new Promise((resolve) =>
    httpServer.listen({ port: 4000 }, resolve),
);