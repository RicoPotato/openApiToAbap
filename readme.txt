/****************************************
 * OpenAPI to ABAP structures *
 ****************************************

* 08.01.2024 Création répertoire GIT

***************************************
* V0.6 - 31.08.2023
 - Permettre d'intepreter "allOf" d'un document openAPI. allOf permet d'inclure les proprieté d'une structure au même niveau. L'équivalent ABAP est INCLUDE TYPE
 - Ne pas inclure la description si elle fait plus de 30 charactères
 
***************************************
* V0.5 - 13.10.2020
 - Modifier mapping integer (avant en abap: integer maintenant int8 -> permet un nombre à 20 chiffres au lieu de 10)
 
**************************************
 * V0.4 - 17.09.2020
 - Pouvoir convertir depuis OpenAPI 3.0
 - Renommer en OpenAPIToAbap
 - Remplacer "-" par "_" dans le nom des proprietés
 - Ne pas se limiter au Swagger 2.0 et Open API 3.0.0 mais 2.x et 3.x

***************************************
 * V0.3 - 11.02.2018
 - Ajout d'un bouton copier sur chaque ouput panel + ajout de message toast (pour informé du résultat de la copy)
 - Amélioration du design
 - Ne pas duppliquer les déclarations de table en dessous des structures
 - Mapping, ne pas duppliquer les entrées (mais citer les entitées qui utilisent l'element)
 - Amélioration vue cellule (no wrap si non commenté + align top)
 - Detecter et commenter proprieté lié à une reference circulaire ou cross circulaire
 - Ajout de messages d'info
 - Ajout de "**** Version xxxx ****" en haut et en base de la déclaration ABAP (pour informaer sur la version de l'outil utilisé)
 - Modification de la conversion du type js boolean: Maintenant vers ABAP_BOOL au lieu de BOOLEAN (sinon false devient "-" au lieu de abap_false
 - Passer la methode et l'attribut en rapport aux mapping en static

***************************************
 * PLUS TARD...
 - Gérer les mapping qui possède le même nom en abap
 - Option pour générer les ENUM (type constant ou utiliser enum abap?)

***************************************
 * INFO
 Côté ABAP, il faut utiliser /UI2/CL_JSON pour serializer et serialiser
 - avec pretty_name = /ui2/cl_json=>pretty_mode-camel_case
 - Si des champs de + de 30 charactères sont présent, il faut en plus passer la table de mapping: NAME_MAPPINGS = get_mapping( )

***************************************
 * PREREQUIS SAP
 - SAP Note 2526405 pour pourvoir integrer automatiquement les champs de plus de 30 characters
