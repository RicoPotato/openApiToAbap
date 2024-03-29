# OpenAPI to ABAP structures

## Purpose
Accelerate ABAP API implementation by converting openAPI/Swagger definition file to abap structures

## How execute it ?
There is no server required. Just import the project locally (via clone or zip download) and run index.html file.

## Abap implementation informations
### SAP Prerequisite
SAP Note 2526405 to allow field with more than 30 chars.
### Notes
The ABAP API implentation could be:
- A specific class which inherited from CL_REST_RESOURCE
- A SICF node which use the above class

Internally, you need to use /UI2/CL_JSON as serializer/unserialiser with:
- pretty_name = /ui2/cl_json=>pretty_mode-camel_case
- if field with more than 30 chars, you have to implement method get_mapping (provided by the tool results) and call it for NAME_MAPPINGS parameter

## Functionality
- Work with Swagger 2.x and Open API 3.x files
- Types mapping
- Automatic definition right order
- Detect circual references
- Handle allOf as ABAP "INCLUDE TYPE"

## What's next / Ideas
 - Gérer les mapping qui possède le même nom en abap
 - Option pour générer les ENUM (type constant ou utiliser enum abap?)
 

