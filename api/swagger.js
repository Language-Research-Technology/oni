const swaggerJsdoc = require('swagger-jsdoc');
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
const base = process.env.BASE || '/docs';
const serverUrl = process.env.URL || 'http://localhost:8080'
const serverDescription = process.env.DESCRIPTION || 'Development server'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Oni API',
      version: '1.0.0',
      description:
        'This is a REST API application made with Express to document Oni\'s API.',
      license: {
        name: 'GNU GENERAL PUBLIC LICENSE v3',
        url: 'https://www.gnu.org/licenses/gpl-3.0.en.html',
      },
      contact: {
        name: 'Arkisto Oni',
        url: 'https://github.com/arkisto-Platform/oni',
      },
    },
    servers: [
      {
        url: serverUrl,
        description: serverDescription
      },
    ],
    components: {
      schemas: {},
      securitySchemes: {
        Bearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
    }
  },
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/**/*.js']
};

const swaggerSpec = swaggerJsdoc(options);
const app = express();
app.use(express.json());

const swaggerUiOpts = {
  customSiteTitle: 'Swagger - Oni Api Docs',
  swaggerOptions: {
    syntaxHighlight: {
      activated: false, //Disabled because it crashed on large response payloads
      theme: "agate"
    }
  },
};

app.use(base, swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOpts));

app.listen(port, () => {
  console.log('Swagger docs:');
  console.log(`http://${host}:${port}${base}`);
});
