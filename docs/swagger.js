const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'LinkEduHub API',
            version: '1.0.0',
            description: 'Документація REST API для вебзастосунку LinkEduHub'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Resource: {
                    type: 'object',
                    properties: {
                        resource_id: {
                            type: 'integer',
                            example: 1
                        },
                        title: {
                            type: 'string',
                            example: 'Node.js Documentation'
                        },
                        url: {
                            type: 'string',
                            example: 'https://nodejs.org'
                        },
                        type_id: {
                            type: 'integer',
                            example: 1
                        },
                        created_by: {
                            type: 'integer',
                            example: 1
                        }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            example: 'admin@gmail.com'
                        },
                        password: {
                            type: 'string',
                            example: '123456'
                        }
                    }
                },
                RegisterRequest: {
                    type: 'object',
                    required: ['username', 'email', 'password', 'confirmPassword'],
                    properties: {
                        username: {
                            type: 'string',
                            example: 'Ivan'
                        },
                        email: {
                            type: 'string',
                            example: 'ivan@gmail.com'
                        },
                        password: {
                            type: 'string',
                            example: '123456'
                        },
                        confirmPassword: {
                            type: 'string',
                            example: '123456'
                        },
                        role_id: {
                            type: 'integer',
                            example: 2
                        }
                    }
                }
            }
        }
    },
    apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;