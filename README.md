# README

This project is a template for building new web apps.

The template features the following:

- TypeScript capability.
- Path aliasing for TypeScript modules.
- Basic styling with Bootstrap.
- Stylesheets for customizing the look-and-feel.
- Standard zooming capability.
- Pages with favicon enabled.
- Cookie access capability with flash message functionality.
- Function for serializing objects containing Date objects.
- Wrapper function around `fetch` to streamline the retrieval of JSON payloads.
- Server logging facility.
- JWT creation and verification capability.
- Command line scripts for generating JWTs and password hashes.

Below are the defaults that should be changed for a new project:

- Headings and body font: Work Sans (_src/styles/customization.scss_)
- Favicon (_src/public/favicon.png_, _src/public/favicon.svg_)
- Logging details in _.env.development_ and _.env.production_.
- Name of the cookies. (_src/constants.ts_)
- Environment variables for JWT (_.env.development_ and _.env.production_).
