/*  ****************
    *   CONSTANTS  *
    **************** */
CO_APP_TITLE = "OpenAPI to ABAP structures"
CO_APP_VERSION = "0.6"
CO_APP_SUBTITLE = "Browser compatibility:\tTested on google Chrome only\nInput compatibility:\t\tJSON of Swagger 2.x or OpenAPI 3.0.x"

CO_INPUT_ERROR_WRONG_TYPE = "*ERROR* Please select a JSON file !"
CO_INPUT_ERROR_WRONG_CONTENT = "*ERROR* The file must be in SWAGGER 2.x or OpenAPI 3.x.x specification"

CO_PANEL_MESSAGES_TITLE = "Messages"
CO_PANEL_DEFINITIONS_TITLE = "ABAP Method definition"
CO_PANEL_DECLARATIONS_TITLE = "ABAP Declaration"

CO_ACTION_COPY = "Copy"

CO_MAPPING_METHOD = "GET_MAPPING"
CO_MAPPING_ATTRIBUTE = "AT_MAPPING"

CO_BLANK_TEXT = "(empty)"

CO_ABAP_MAX_LENGTH = 30
CO_ABAP_COMMENT = "\""
CO_ABAP_INCLUDE = "INCLUDE TYPE"
CO_ABAP_INCLUDE_END = ".TYPES:"

/*  **************
    *   PARSER   *
    ************** */

class ParserBase {
    constructor(oFile) {
        this._oFileContent = oFile;
    }

    static parse(sContent) {
        return JSON.parse(sContent);
    }

    static createParser(oFile) {
        //CHECK swagger 2.0 or OpenApi 3.0
        switch (true) {
            case (oFile.hasOwnProperty("swagger") && oFile.swagger.startsWith("2.")):
                return new ParserSwagger2(oFile);
                break;
            case (oFile.hasOwnProperty("openapi") && oFile.openapi.startsWith("3.")):
                return new ParserOpenApi3(oFile);
                break;
            default:
                throw {
                    message: CO_INPUT_ERROR_WRONG_CONTENT
                };
        }
    }

    getInfo() {
        if (!this._oFileContent.hasOwnProperty("info")) {
            throw {
                message: "Aucune info trouvee dans le fichier"
            };
        }
        return this._oFileContent["info"];
    }

    getReferenceBasePath() {
        throw {
            message: "getReferenceBasePath doit être redéfini dans le parseur correspondant"
        };
    }

    getDefinition() {
        throw {
            message: "getDefinition doit être redéfini dans le parseur correspondant"
        };
    }
}

class ParserOpenApi3 extends ParserBase {

    getReferenceBasePath() {
        return "#/components/schemas/";
    }

    getDefinition() {
        if (!this._oFileContent.hasOwnProperty("components") || !this._oFileContent.components.hasOwnProperty("schemas")) {
            throw {
                message: "Aucune definition trouvee dans le fichier"
            };
        }
        return this._oFileContent.components.schemas;
    }
}

class ParserSwagger2 extends ParserBase {

    getReferenceBasePath() {
        return "#/definitions/";
    }

    getDefinition() {
        if (!this._oFileContent.hasOwnProperty("definitions")) {
            throw {
                message: "Aucune definition trouvee dans le fichier"
            };
        }
        return this._oFileContent["definitions"];
    }
}

function setParser(oParser) {
    this.parser = oParser;
}
function getParser() {
    return this.parser;
}

/*  ******************
    *   USER EVENTS  *
    ****************** */
window.onload = function () {
    //Handle file upload
    var fileInput = document.getElementById("fileInput");
    var fileDisplayArea = document.getElementById("input");

    fileInput.addEventListener('change', function (e) {
        var file = fileInput.files[0];
        var textType = /json.*/;

        if (file.type.match(textType)) {
            var reader = new FileReader();

            reader.onload = function (e) {
                fileDisplayArea.value = reader.result;
            }

            reader.readAsText(file);
        } else {
            fileDisplayArea.value = CO_INPUT_ERROR_WRONG_TYPE;
        }
    });

    //Set text values from constants
    document.getElementById('appTitle').appendChild(document.createTextNode(CO_APP_TITLE));
    document.getElementById('appVersionInfo').appendChild(document.createTextNode("Version " + CO_APP_VERSION));
    document.getElementById('appSubtitle').appendChild(document.createTextNode(CO_APP_SUBTITLE));

}

function run() {
    //INIT & Clear output content
    this.clearData();
    this.clearOutput();

    //Read input
    try {
        var oFile = ParserBase.parse(document.getElementById("input").value);
        let oParser = ParserBase.createParser(oFile);
        this.setParser(oParser);

        //Read version
        let oSwaggerInfo = oParser.getInfo();

        //Browse/Load models
        let oDefinitions = oParser.getDefinition();

        var oModels = {};
        Object.keys(oParser.getDefinition()).forEach(function (key) {
            oModels[key] = this.loadDefinition(oParser, key, oDefinitions[key]);
        }.bind(this));

        //Build object definition array (Reordering) and add it to output
        var tModel = this.buildModel(oModels);

        //Write output
        this.writeOutput(oSwaggerInfo["version"], oSwaggerInfo["title"], this.getMessages(), this.getMappings(), tModel);

    } catch (error) {
        this.addMessage("ERROR", error.message, error.stack);

        //Write output
        this.writeOutput("unknown", "unknown", this.getMessages(), this.getMappings(), tModel);
    }
}

function clearData() {
    var tOutput = [];
    this.setParser(null);
    this.clearReferences();
    this.clearMappings();
    this.clearMessages();
}

function clearOutput() {
    var oOutput = document.getElementById("output");
    while (oOutput.firstChild) {
        oOutput.removeChild(oOutput.firstChild);
    }
}

/*  **************
    *   OUTPUT   *
    ************** */
function writeOutput(sVersion, sTitle, tMessages, tMapping, tModel) {
    oOutput = document.getElementById("output");

    //Messages
    oOutput.appendChild(this.messagesRenderer(tMessages));

    //Method implementation
    oOutput.appendChild(this.definitionsRenderer(tMapping));

    //declarations
    oOutput.appendChild(this.declarationsRenderer(sVersion, sTitle, tMapping, tModel));
}

/*  ***************
    *   RENDERER  *
    *************** */
function panelRenderer(sTitle, oContent) {
    var oPanel = document.createElement("p");
    oPanel.classList.add("panel");

    //HEADER
    var oHeader = document.createElement("div");
    oHeader.classList.add("panelHeader");
    oHeader.classList.add("contrast");

    var oTitle = document.createElement("h3");
    oTitle.appendChild(document.createTextNode(sTitle));
    oTitle.classList.add("panelHeaderItem");
    oTitle.classList.add("panelHeaderTitle");
    oHeader.appendChild(oTitle);

    var oSpacer = document.createElement("div");
    oSpacer.classList.add("panelHeaderItem");
    oSpacer.classList.add("flexBoxSpacer");
    oHeader.appendChild(oSpacer);

    var oButton = document.createElement("button");
    oButton.appendChild(document.createTextNode(CO_ACTION_COPY));
    oButton.classList.add("panelHeaderItem");
    oButton.classList.add("panelHeaderAction");

    oButton.onclick = function () {
        this.copyPanelContentToClipboard(oContent);
    }.bind(this);

    oHeader.appendChild(oButton);

    oPanel.appendChild(oHeader);

    //CONTENT
    oContent.classList.add("panelContent");
    oPanel.appendChild(oContent);

    return oPanel;
}

function messagesRenderer(tMessages) {
    var oContent = document.createElement("p");
    if (typeof tMessages === "object" && tMessages.length > 0) {
        var oTable,
            oRow,
            oCell;
        oTable = document.createElement("table");
        tMessages.forEach(function (oMessage) {
            oRow = oTable.insertRow();
            Object.keys(oMessage).forEach(function (sPropertyName) {
                oCell = oRow.insertCell();
                oCell.innerHTML = oMessage[sPropertyName];
            });
        });
        oTable.classList.add("messageTable");
        oContent.appendChild(oTable);
    } else {
        oContent.innerHTML = "No problem detected";
    }
    return this.panelRenderer(CO_PANEL_MESSAGES_TITLE, oContent);
}

function definitionsRenderer(tMapping) {
    var oContent = this.mappingDefinitionsRenderer(tMapping);
    return this.panelRenderer(CO_PANEL_DEFINITIONS_TITLE, oContent);
}

function declarationsRenderer(sVersion, sTitle, tMapping, tModel) {
    var oContent = document.createElement("p");

    oContent.appendChild(this.declarationsTitleRenderer(sVersion, sTitle));
    oContent.appendChild(this.mappingDeclarationsRenderer(tMapping));
    oContent.appendChild(this.modelDeclarationsRenderer(tModel));
    oContent.appendChild(document.createTextNode("*****************************************************************************************"));

    return this.panelRenderer(CO_PANEL_DECLARATIONS_TITLE, oContent);
}

function mappingDefinitionsRenderer(tMapping) {
    var oContent = document.createElement("p");
    if (typeof tMapping === "object" && tMapping.length > 0) {
        var declarationTitle,
            oTable,
            oRow,
            oCell;

        //WRITE METHOD CONTENT
        if (typeof tMapping === "object" && tMapping.length > 0) {
            declarationTitle = document.createElement("h4");
            declarationTitle.appendChild(document.createTextNode(CO_ABAP_COMMENT + "METHOD " + CO_MAPPING_METHOD + ". For name_mapping parameter of /ui2/cl_json=>serialize/deserialize"));
            declarationTitle.classList.add("panelContentItemTitle");
            oContent.appendChild(declarationTitle);

            oTable = document.createElement("table");
            oRow = oTable.insertRow();
            oCell = oRow.insertCell();
            oCell.innerHTML = "METHOD " + CO_MAPPING_METHOD + ".";

            oRow = oTable.insertRow();
            oCell = oRow.insertCell();
            oCell.innerHTML = "IF lines( " + CO_MAPPING_ATTRIBUTE + " ) = 0.";

            oRow = oTable.insertRow();
            oCell = oRow.insertCell();
            oCell.innerHTML = CO_MAPPING_ATTRIBUTE + " = VALUE #(";

            tMapping.forEach(function (oMapping) {
                oRow = oTable.insertRow();
                oCell = oRow.insertCell();
                oCell.classList.add("cellNoWrap")
                oCell.innerHTML = "( abap = '" + oMapping["abap"] + "'";
                oCell = oRow.insertCell();
                oCell.classList.add("cellNoWrap")
                oCell.innerHTML = "json = '" + oMapping["json"] + "' )";
                oCell = oRow.insertCell();
                oCell.innerHTML = " " + CO_ABAP_COMMENT + "Found in definition " + oMapping["reference"];
            });

            oRow = oTable.insertRow();
            oCell = oRow.insertCell();
            oCell.innerHTML = ").";

            oRow = oTable.insertRow();
            oCell = oRow.insertCell();
            oCell.innerHTML = "ENDIF.";

            oRow = oTable.insertRow();
            oCell = oRow.insertCell();
            oCell.innerHTML = "et_mapping = " + CO_MAPPING_ATTRIBUTE + ".";

            oRow = oTable.insertRow();
            oCell = oRow.insertCell();
            oCell.innerHTML = "ENDMETHOD.";

            oContent.appendChild(oTable);
        }
    } else {
        oContent.innerHTML = CO_BLANK_TEXT;
    }

    return oContent;
}

function declarationsTitleRenderer(sVersion, sTitle) {
    var oContent = document.createElement("p");
    oContent.appendChild(document.createTextNode("***** Done with " + CO_APP_TITLE + " tool (version: " + CO_APP_VERSION + ") **********************"));
    oContent.appendChild(document.createElement("br"));
    oContent.appendChild(document.createTextNode("***** From file: " + (sTitle ? sTitle : CO_BLANK_TEXT) + " - version: " + sVersion));
    return oContent;
}

function mappingDeclarationsRenderer(tMapping) {
    var oContent = document.createElement("p");
    if (typeof tMapping === "object" && tMapping.length > 0) {
        var declarationTitle,
            oTable,
            oRow,
            oCell;

        declarationTitle = document.createElement("h4");
        declarationTitle.appendChild(document.createTextNode(CO_ABAP_COMMENT + "MAPPING (Statics elements for name_mapping parameter of /ui2/cl_json=>serialize/deserialize)"));
        declarationTitle.classList.add("panelContentItemTitle");
        oContent.appendChild(declarationTitle);

        oTable = document.createElement("table");

        //Declare the constant
        oRow = oTable.insertRow();
        oCell = oRow.insertCell();
        oCell.innerHTML = "CLASS-DATA:";
        oCell = oRow.insertCell();
        oCell.innerHTML = CO_MAPPING_ATTRIBUTE;
        oCell = oRow.insertCell();
        oCell.innerHTML = "TYPE";
        oCell = oRow.insertCell();
        oCell.innerHTML = "/UI2/CL_JSON=>NAME_MAPPINGS.";

        //Declare the method
        oRow = oTable.insertRow();
        oCell = oRow.insertCell();
        oCell.innerHTML = "CLASS-METHODS:";
        oCell = oRow.insertCell();
        oCell.innerHTML = CO_MAPPING_METHOD;
        oCell = oRow.insertCell();
        oCell.innerHTML = "returning";
        oCell = oRow.insertCell();
        oCell.innerHTML = "value(ET_MAPPING) type /UI2/CL_JSON=>NAME_MAPPINGS .";

        oContent.appendChild(oTable);
        oContent.classList.add("panelContentItem");
    }
    return oContent;
}

function modelDeclarationsRenderer(tModel) {
    var oContent = document.createElement("p");
    if (typeof tModel === "object" && tModel.length > 0) {
        var oPara,
            oDeclarationTitle,
            oTable,
            oRow,
            oCell;

        tModel.forEach(function (oObject) {
            oPara = document.createElement("p");

            oDeclarationTitle = document.createElement("h4");
            oDeclarationTitle.appendChild(document.createTextNode(CO_ABAP_COMMENT + oObject["key"]));
            oDeclarationTitle.classList.add("panelContentItemTitle");
            oPara.appendChild(oDeclarationTitle);

            oTable = document.createElement("table");
            oObject["definition"].forEach(function (tProperty) {
                oRow = oTable.insertRow();
                tProperty.forEach(function (sProperty) {
                    oCell = oRow.insertCell();
                    oCell.innerHTML = sProperty;
                    //Wrapper cellule seulement si le contenu est un commentaire
                    if (sProperty.substring(0, 1) !== CO_ABAP_COMMENT) {
                        oCell.classList.add("cellNoWrap")
                    }
                });
            });
            oPara.appendChild(oTable);
            oPara.classList.add("panelContentItem");

            oContent.appendChild(oPara);
        });
    }
    return oContent;
}

/*  *********************
    *   DATA LOADER     *
    ********************* */
function getProperties(sKey, oProperties, sLineEnd) {
    let tPropertiesOutput = [];
    Object.keys(oProperties).forEach(function (sPropertyName) {
        if (sPropertyName) {
            tProperty = [];
            tProperty.push(this.formatPropertyName(sKey, sPropertyName, true));
            tProperty.push("TYPE");
            tProperty.push(this.getPropertyType(sKey, sPropertyName, oProperties[sPropertyName]) + sLineEnd);

            if (oProperties[sPropertyName]["format"]) {
                tProperty.push(CO_ABAP_COMMENT + "FORMAT: " + oProperties[sPropertyName]["type"] + "(" + oProperties[sPropertyName]["format"] + ")");
            }
            if (oProperties[sPropertyName]["description"] && oProperties[sPropertyName]["description"].length < 30) {
                tProperty.push(CO_ABAP_COMMENT + "DESCRIPTION: " + oProperties[sPropertyName]["description"]);
            }
            if (oProperties[sPropertyName]["enum"]) {
                tProperty.push(CO_ABAP_COMMENT + "ENUM: " + oProperties[sPropertyName]["enum"]);
            }
            tPropertiesOutput.push(tProperty);
        }
    }.bind(this));
    return tPropertiesOutput;
}

function getAllOf(sKey, tAllOf) {
    let tPropertiesOutput = [];
    let sLineEnd;
    for (let i = 0; i < tAllOf.length; i++) {
        let oItem = tAllOf[i];
        if (oItem.hasOwnProperty("$ref")) {
            let sRefEntityName = oItem["$ref"].substring(oItem["$ref"].lastIndexOf("/") + 1);
            tPropertiesOutput.push([this.CO_ABAP_INCLUDE, this.formatPropertyName(sKey, this.formatStructureName(sRefEntityName), true) + this.CO_ABAP_INCLUDE_END]);
            this.addReference(sKey, null, sRefEntityName, "allOf"); //NEW 0.6
        } else {
            if ((i + 1 < tAllOf.length) && (tAllOf[i + 1].hasOwnProperty("$ref"))) {
                sLineEnd = ".";
            } else {
                sLineEnd = ",";
            }
            tPropertiesOutput.push(...this.getProperties(sKey, oItem.properties, sLineEnd));
        }
    }
    return tPropertiesOutput;
}

function loadDefinition(oParser, sKey, oDefinition) {
    var tDefinition = [];
    var tProperty = [];

    var sStructureName = this.formatStructureName(sKey);

    if (oDefinition.hasOwnProperty("properties")) {
        tDefinition.push(...this.getProperties(sKey, oDefinition["properties"], ","));
    } else if (oDefinition.hasOwnProperty("allOf")) {
        tDefinition.push(...this.getAllOf(sKey, oDefinition["allOf"]));
    }

    if (tDefinition[0][0] === CO_ABAP_INCLUDE) {
        tDefinition.unshift(["TYPES: BEGIN OF " + sStructureName + "."]);
    } else {
        tDefinition.unshift(["TYPES: BEGIN OF " + sStructureName + ","]);
    }

    tDefinition.push(["END OF " + sStructureName + "."]);
    return tDefinition;
}

function getPropertyType(sKey, sPropertyName, oPropertyDetails) {
    var sRefType;
    if (oPropertyDetails["type"] === "array") {

        if (oPropertyDetails["items"]["$ref"]) {

            sRefType = oPropertyDetails["items"]["$ref"].replace(this.getParser().getReferenceBasePath(), "");
            this.addReference(sKey, sPropertyName, sRefType, "array");
            return this.formatTableName(sRefType);

        } else if (oPropertyDetails["items"]["type"]) {
            return this.formatTableType(oPropertyDetails["items"]["type"], oPropertyDetails["items"]["format"]);
        }
    }

    if (oPropertyDetails["$ref"]) {
        sRefType = oPropertyDetails["$ref"].replace(this.getParser().getReferenceBasePath(), "");
        this.addReference(sKey, sPropertyName, sRefType, "structure");
        return this.formatStructureName(sRefType);
    }

    return this.formatType(oPropertyDetails["type"], oPropertyDetails["format"]);
}

/*  ************************
    *   REFERENCE HANDLER  *
    ************************ */
function addReference(sKey, sPropertyName, sRefType, sType) {
    this.getReferences().push({
        key: sKey,
        propertyName: sPropertyName,
        refType: sRefType,
        type: sType
    });
}

function clearReferences() {
    this.tDefinitionNeeded = [];
}

function getReferences() {
    if (!this.tDefinitionNeeded) {
        this.clearReferences();
    }
    return this.tDefinitionNeeded;
}

/*  **********************************
    *   Handle JSON => ABAP mapping  *
    ********************************** */
function addMapping(sDefinitionName, sJsonName, sAbapName) {
    var tMapping = this.getMappings();
    var bAlreadyDefined = false;

    tMapping.some(function (oMapping) {
        if (oMapping.json === sJsonName && oMapping.abap === sAbapName) {
            oMapping.reference = oMapping.reference + " and " + sDefinitionName;
            bAlreadyDefined = true;
            return true;
        }
        return false;
    });

    if (!bAlreadyDefined) {
        tMapping.push({
            reference: sDefinitionName,
            json: sJsonName,
            abap: sAbapName
        });
    }
}

function clearMappings() {
    this.tMapping = [];
}

function getMappings() {
    if (!this.tMapping) {
        this.clearMappings();
    }
    return this.tMapping;
}

/*  *********************
    *   Handle MESSAGES *
    ********************* */
function addMessage(sSeverity, sTitle, sDetail) {
    var bIsNewEntry = true;

    this.getMessages().some(function (oMessage) {
        if (sSeverity === oMessage.severity && sTitle === oMessage.title && sDetail === oMessage.detail) {
            bIsNewEntry = false;
            return true;
        }
        return false;
    });

    if (bIsNewEntry) {
        this.getMessages().push({
            severity: sSeverity,
            title: sTitle,
            detail: sDetail
        });
    }
}

function clearMessages() {
    this.tMessages = [];
}

function getMessages() {
    if (!this.tMessages) {
        this.clearMessages();
    }
    return this.tMessages;
}

/*  **************
    *   BUILDER  *
    ************** */
function buildModel(oModels) {
    var oModelsClone = JSON.parse(JSON.stringify(oModels));
    var tObjectDefinition = [];
    var tSortedObjectDefinition = [];

    //Complete with table definition needed
    var oTableDeclaration;
    this.getReferences().forEach(function (oDefinition) {
        if (oDefinition["type"] === "array") {
            //Add table declaration only if not already added
            oTableDeclaration = this.formatTableDefinition(oDefinition["refType"]);
            if (oModelsClone[oDefinition["refType"]].slice(-1)[0].toString() !== oTableDeclaration.toString()) { //No proper but fine here..
                oModelsClone[oDefinition["refType"]].push(oTableDeclaration);
            }
        }
    }.bind(this));

    //Build output array (it includes ordering for reference declaration)
    var tRefNeededForThisObject = [];
    var bError = false;
    var sParentKey;

    //Declare local function
    var addDeclaration = function (sKey) {
        //Get references needed (if any)
        tRefNeededForThisObject = this.getReferences().filter(oDefinitionNeeded => oDefinitionNeeded["key"] === sKey);

        if (typeof tRefNeededForThisObject === "object" && tRefNeededForThisObject.length > 0) {
            tRefNeededForThisObject.forEach(function (oRef) {
                if (oRef["refType"] !== sKey && sParentKey !== oRef.refType) {
                    sParentKey = sKey;
                    addDeclaration(oRef["refType"]);
                    return;
                }

                //Si relatif à une proprieté : Warning, circular reference detected
                if (oRef["propertyName"]) {
                    var sTitle;
                    var sDetail = "Structure '" + sKey + "', Property '" + oRef.propertyName + "' has been commented";

                    if (oRef["refType"] === sKey) { //Circular reference detected
                        sTitle = "Circular reference found";
                    } else if (sParentKey === oRef.refType) { //CROSS circular reference detected
                        sTitle = "Cross Circular reference found";
                    }

                    this.addMessage("WARNING", sTitle, sDetail);

                    if (typeof oModelsClone[sKey] === "object") {
                        oModelsClone[sKey].some(function (tRow) {
                            if (tRow[0] === oRef.propertyName) {
                                tRow[0] = CO_ABAP_COMMENT + "*WARNING* (" + sTitle + ") on: " + tRow[0];
                                return true;
                            }
                            return false;
                        });

                        //Delete reference needed entry
                        delete this.tDefinitionNeeded[oRef];
                    }

                }
            }.bind(this));
        }

        //Add declaration to output (check if it was not removed first)
        if (oModelsClone[sKey]) {
            tObjectDefinition.push({
                key: sKey,
                definition: oModelsClone[sKey]
            });

            //Remove it from model once done
            delete oModelsClone[sKey];
        }
    }

    //Launch build for each element
    Object.keys(oModelsClone).forEach(function (sKey) {
        addDeclaration(sKey);
    }.bind(this));

    return tObjectDefinition;
}

/*  **********************************
    *   TOOLS                         *
    ********************************** */
function copyPanelContentToClipboard(oContainer) {
    var range = document.createRange();
    range.selectNode(oContainer);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy")

    this.showMessageToast("Text copied to clipboard");
}

function showMessageToast(sText) {
    // Get the snackbar DIV
    var x = document.getElementById("snackbar");

    // Add the "show" class to DIV
    x.className = "show";

    //Add text
    x.appendChild(document.createTextNode(sText));

    // After 3 seconds, remove the show class from DIV & its content
    setTimeout(function () {
        x.className = x.className.replace("show", "");
        while (x.firstChild) {
            x.removeChild(x.firstChild);
        }
    }, 3000);
}

/*  **********************************
    *   FORMATTERS                   *
    ********************************** */
function formatPropertyName(sDefinitionName, sPropertyIn, bHandleMapping, iCustomMaxLength) {
    sPropertyOut = "";
    var sAbapSeparator = "_",
        iMaxLength = (typeof iCustomMaxLength === "number" ? iCustomMaxLength : CO_ABAP_MAX_LENGTH);

    //CamelCase to camel_case
    sPropertyIn.split("").forEach(function (c) {
        if (c == c.toLowerCase()) {
            // The character is lowercase
            sPropertyOut += c;
        } else {
            // The character is uppercase
            sPropertyOut += sAbapSeparator + c.toLowerCase();
        }
    });
    if (sPropertyOut.indexOf(sAbapSeparator) === 0) {
        sPropertyOut = sPropertyOut.substring(1);
    }

    //Handle maximum length
    if (sPropertyOut.length > iMaxLength) {
        sPropertyOut = sPropertyOut.replace(/_/g, "");
        while (sPropertyOut.length > iMaxLength) {
            sPropertyOut = sPropertyOut.slice(0, -1);
        }
        //Add it to mapping table
        if (bHandleMapping) {
            this.addMapping(sDefinitionName, sPropertyIn, sPropertyOut);
        }
    }

    //Replace all "-" by "_"
    sPropertyOut = sPropertyOut.replace(/-/g, "_");

    return sPropertyOut;
}

function formatStructureName(sStructureName) {
    return "ts_" + this.formatPropertyName(sStructureName, sStructureName, false, CO_ABAP_MAX_LENGTH - 3);
}

function formatTableName(sTableName) {
    return "tt_" + this.formatPropertyName(sTableName, sTableName, false, CO_ABAP_MAX_LENGTH - 3);
}

function formatTableDefinition(sTableName) {
    return ["TYPES: " + this.formatTableName(sTableName), "TYPE TABLE OF " + this.formatStructureName(sTableName), "WITH NON-UNIQUE DEFAULT KEY."];
}

function formatType(sTypeIn, sFormatIn) {
    switch (sTypeIn) {
        case "boolean":
            return "abap_bool";
        case "number":
            //return (sFormatIn === "float" ? "float" : "int");
            return "float";
        //return (sFormatIn === "float" ? "p length 16 decimals 2" : "integer");
        case "integer":
            //return "integer";
            return "int8";
        case "string":
            return (sFormatIn === "date" ? "dats" : "string");
        default:
            return sTypeIn;
    }
}

function formatTableType(sTypeIn, sFormatIn) {
    var sBaseType = this.formatType(sTypeIn, sFormatIn);
    switch (sBaseType) {
        case "integer":
            //return "abadr_tab_int4";
            return "sapcrfc_int8_tab";
        case "float":
            return "ujp_t_float";
        case "string":
            return "string_table";
        default:
            return "TABLE OF " + sBaseType;
    }
}
