const Ajv = require('ajv');
const ajv = new Ajv();
const { ObjectId } = require("mongodb");

ajv.addKeyword('objectid', {
    type: 'string',
    errors: true,
    modifying: true,
    schema: false,
    validate: function validate(value, dataPath, object, key) {
        if (!ObjectId.isValid(value)) {
            validate.errors = [{
                keyword: 'objectid',
                dataPath: dataPath,
                params: { objectid: true },
                message: 'should be objectid'
            }];
            return false;
        }
        object[key] = new ObjectId(value);
        return true;
    }
});

function validate(validator, bypassPermission = "validation:bypass") {
    return (req, res, next) => {
        // Check if the user has permission to bypass validation (site admins)
        Promise.resolve(!req.user ? false : req.user.hasPermission(bypassPermission, {
            userId: req.user.id,
            reqParams: req.params
        })).then(result => {
            if (result) {
                next();
            } else {
                validator(req.body)
                    .then(() => next())
                    .catch(err => next(err));
            }
        }).catch(err => next(err))
    }
}

const userValidator = ajv.compile({
    "$async": true,
    "additionalProperties": false,
    "properties": {
        "email": {
            "type": "string",
            "format": "email",
            "maxLength": 100
        },
        "password": {
            // Maybe better validation in frontend
            "minLength": 6,
            "maxLength": 128,
            "type": "string"
        },
        "birthday": {
            "type": "string",
            "format": "date",
        }
    }
});

const businessValidator = ajv.compile({
    "$async": true,
    "additionalProperties": false,
    "properties": {
        "email": {
            "type": "string",
            "format": "email",
            "maxLength": 100
        },
        // Do we really need to validate this?
        "config": {
            "type": "object",
            "properties": {
                "pointsName": {
                    "type": "string",
                    "maxLength": 20
                }
            }
        },
        "public": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "maxLength": 100
                },
                "address": {
                    "type": "string",
                    "maxLength": 100
                },
                "description": {
                    "type": "string",
                    "maxLength": 300
                },
                "openingHours": {
                    "type": "array",
                    "properties": {
                        "dayOfWeek": {
                            "type": "number",
                            "maximum": 7,
                            "minimum": 1
                        },
                        "hours": {
                            "type": "string",
                        },
                        "validFrom": {
                            "type": "string",
                            "format": "date",
                        },
                        "validThrough": {
                            "type": "string",
                            "format": "date",
                        },
                    }
                },
                "customerLevels": {
                    "type": "array",
                    "properties": {
                        "name": {
                            "type": "string"
                        },
                        "requiredPoints": {
                            "type": "number"
                        }
                    },
                    "required": ["name"]
                }
            }
        }
    }
});

const businessRoleValidator = ajv.compile({
    "$async": true,
    "additionalProperties": false,
    "properties": {
        "userId": {
            "type": "string",
            "objectid": true
        },
        "role": {
            "enum": ["user", "business"]
        }
    },
    "required": ["userId", "role"],
});

const productValidator = ajv.compile({
    "$async": true,
    "additionalProperties": false,
    "properties": {
        "name": {
            "type": "string",
            "maxLength": 128
        },
        "description": {
            "type": "string",
            "maxLength": 1024
        },
        "categories": {
            "type": "array",
            "maxItems": 16,
            "items": {
                "type": "string",
                "objectid": true
            }
        },
        "images": {
            "type": "array",
            "maxItems": 16,
            "items": {
                // Enough good here
                "type": "string",
                "format": "uri",
            }
        },
        "price": {
            "type": "number"
        }
    },
    "required": ["name"]
});


const rawRewardSchema = {
    "properties": {
        "name": {
            "type": "string"
        },
        "description": {
            "type": "string"
        },
        "products": {
            "type": "array",
            "items": {
                "type": "string",
                "objectid": true
            }
        },
        "categories": {
            "type": "array",
            "items": {
                "type": "string",
                "objectid": true
            }
        },
        "itemDiscount": {
            "type": "string",
        },
        "customerPoints": {
            "type": "number"
        },
        "requirement": {
            "type": "string"
        },
        "expires": {
            "type": "string",
            "format": "date-time"
        }
    },
    "required": ["name", "itemDiscount"]
};

const rewardValidator = ajv.compile({
    "$async": true,
    "additionalProperties": false,
    ...rawRewardSchema
});

const campaignValidator = ajv.compile({
    "$async": true,
    "additionalProperties": false,
    "properties": {
        "start": {
            "type": "string",
            "format": "date-time"
        },
        "end": {
            "type": "string",
            "format": "date-time"
        },
        "name": {
            "type": "string",
        },
        "description": {
            "type": "string",
        },
        "requirements": {
            "type": "array",
            "items": {
                "properties": {
                    "requirement": {
                        "type": "string"
                        // Let mongoose or something else validate the requirement typ
                    },
                    "values": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    },
                    "question": {
                        "type": "string"
                    }
                }
            }
        },
        "maxRewards": {
            "type": "object",
            "properties": {
                "total": {
                    "type": "number"
                },
                "user": {
                    "type": "number"
                }
            }
        },
        "transactionPoints": {
            "type": "number"
        },
        "endReward": {
            "type": "object",
            ...rawRewardSchema
        }
    },
    "required": ["name"]
});

const purchaseValidator = ajv.compile({
    "$async": true,
    "additionalProperties": false,
    "properties": {
        "userId": {
            "type": "string",
            "objectid": true
        },
        "categories": {
            "type": "array",
            "items": {
                "type": "string",
                "objectid": true
            }
        },
        "products": {
            "type": "array",
            "items": {
                "type": "string",
                "objectid": true
            }
        },
    }
});

const customerPropertiesValidator = ajv.compile({
    "$async": true,
    "additionalProperties": false,
    "properties": {
        "points": {
            "type": "number",
        }
    }
});

const pushNotificationValidator = ajv.compile({
    "$async": true,
    "additionalProperties": false,
    "properties": {
        "title": {
            "type": "string",
        },
        "message": {
            "type": "string",
        },
        "link": {
            "type": "string",
        }
    }
})

const pageValidator = ajv.compile({
    "$async": true,
    "additionalProperties": false,
    "properties": {
        "name": {
            "type": "string",
        },
        "pathname": {
            "type": "string",
        },
        "description": {
            "type": "string",
        },
        "stage": {
            "type": "string",
        },
        "icon": {
            "type": "string",
        },
        "gjs": {
            "type": "object",
            "properties": {
                "gjs-components": {
                    "type": "string"
                },
                "gjs-styles": {
                    "type": "string"
                }
            }
        },
        // GrapesJS will only send these, use same validation for it too
        "gjs-components": {
            "type": "string"
        },
        "gjs-styles": {
            "type": "string"
        }
    }
})

module.exports = {
    validate,
    userValidator,
    businessValidator,
    businessRoleValidator,
    productValidator,
    campaignValidator,
    purchaseValidator,
    customerPropertiesValidator,
    rewardValidator,
    pushNotificationValidator,
    pageValidator
};