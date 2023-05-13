import {getLogger} from "./logger";
import swaggerJSDocs from 'swagger-jsdoc';

const log = getLogger();

export function swaggerDoc({configuration, version, name, homepage}) {
  log.debug('generating swaggerDoc');
  
  const serverUrl = configuration.api.host || 'http://localhost:8080'
  const serverDescription = configuration.ui.siteName || 'Development server'

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Oni',
        version: version,
        description:
          'Oni Rest API',
        license: {
          name: 'GNU GENERAL PUBLIC LICENSE v3',
          url: 'https://www.gnu.org/licenses/gpl-3.0.en.html',
        },
        contact: {
          name: name,
          url: homepage,
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

  const swaggerSpec = swaggerJSDocs(options);

  return swaggerSpec;
}

