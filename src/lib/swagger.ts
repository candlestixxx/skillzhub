import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SkillzHub API',
      version: '0.1.5',
      description: 'API documentation for the SkillzHub MVP C2B Marketplace',
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Pass the key as "Bearer <api_key>"'
        },
      },
    },
  },
  apis: ['./src/app/api/v1/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
