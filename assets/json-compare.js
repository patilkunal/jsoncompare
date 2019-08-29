'use strict';

class JsonComparator {
    constructor(allowNullForArrays) {
        this.allowNullForArrays = allowNullForArrays;
        this.lhsErrors = new Array();
        this.rhsErrors = new Array();
        this.lhsXpath = new Array();
        this.rhsXpath = new Array();
		this.isEqual = false;
    }
    
    getLhsErrors() {
        return this.lhsErrors;
    }

    getRhsErrors() {
        return this.rhsErrors;
    }
    
    formatXpath(xpathArr) {
        let retval = "";
        xpathArr.forEach(path => {
            if(! (path.charAt(0) == '[') ) {
                retval += '.';
            }
            retval += path;
        })

        return retval.substring(1, retval.length);
    }

    compareJsonString(lhsJson, rhsJson) {
        this.lhsErrors.length = 0;
        this.rhsErrors.length = 0;
        this.lhsXpath.length = 0;
        this.rhsXpath.length = 0;

        let lhsRoot = null;
        let rhsRoot = null;
        if (lhsJson != '' && rhsJson != '') {
            lhsRoot = this.isValidJSON(lhsJson);
            rhsRoot = this.isValidJSON(rhsJson);
        }
        if (lhsRoot != null && rhsRoot != null) {
            this.lhsXpath.push("root");
            this.rhsXpath.push("root");
            if (this.isEqual = this.isSameType(lhsRoot, rhsRoot)) {
                if (jQuery.isArray(lhsRoot) && jQuery.isArray(rhsRoot)) {
                    this.isEqual = this.compareAsArray(lhsRoot, rhsRoot);
                }
                else if (this.isObject(lhsRoot) && this.isObject(rhsRoot)) {
                    this.isEqual = this.compareAsObject(lhsRoot, rhsRoot);
                }
            }
        } else {
            throw new Error("Error parsing JSON");
        }
        return (this.rhsErrors.length == 0 && this.lhsErrors.length == 0);
    }

    compareAsArray(lhsArr, rhsArr) {
        let lhsCount = 0;
        let rhsCount = 0;
        this.isEqual = this.validateArrayTypes(lhsArr, this.lhsXpath, this.lhsErrors);
        if(this.isEqual) {
            this.isEqual = this.validateArrayTypes(rhsArr, this.rhsXpath, this.rhsErrors);
        }
        if(this.isObject(lhsArr[0]) && this.isObject(rhsArr[0])) {
            //Do we want to compare arrays to it's min length?
            //Or we compare to max length array and stop incrementing min length array?
            let len = Math.min(lhsArr.length, rhsArr.length);
            for(let i=0;  (i < len); i++) {
                this.lhsXpath.push("[" + i + "]");
                this.rhsXpath.push("[" + i + "]");
                this.isEqual = this.compareAsObject(lhsArr[i], rhsArr[i]);
                if(!this.isEqual) {
                    this.lhsErrors.push("Mismatch objects at: " + this.formatXpath(this.lhsXpath));
                    this.rhsErrors.push("Mismatch objects at: " + this.formatXpath(this.rhsXpath));
                }
                this.lhsXpath.pop();
                this.rhsXpath.pop();
            }
        } 
        //no need to compare arrays of primitive types
        return this.isEqual;
    }

    validateArrayTypes(arr, xpath, errors) {
        let count = 0;
        let hasOnlyObjects = this.isObject(arr[0]);
        arr.forEach(obj => {
            xpath.push("[" + count + "]");
            if(hasOnlyObjects) {
                if(! this.isObject(obj) ) {
                    //error
                    this.isEqual = false;
                    errors.push("Found mix values of object and primitive types at " + this.formatXpath(xpath));
                }                
            } else {
                if(this.isObject(obj)) {
                    //error
                    this.isEqual = false;
                    errors.push("Found mix values of object and primitive types at " + this.formatXpath(xpath));
                }
            }
            xpath.pop();
            count++;
        });
        return this.isEqual;
    }

    compareAsObject(lhsObj, rhsObj) {
        
        let lhsProperties = Object.getOwnPropertyNames(lhsObj);
        let rhsProperties = Object.getOwnPropertyNames(rhsObj);

        lhsProperties.forEach(prop => {
            this.lhsXpath.push(prop);
            if(rhsProperties.findIndex( rkey => { return rkey ==  prop}) == -1) {
                //we found property missing in RHS
                this.isEqual = false;
                this.rhsErrors.push("Missing property: " + this.formatXpath(this.lhsXpath));
            }
            this.lhsXpath.pop()
        });

        rhsProperties.forEach(prop => {
            this.rhsXpath.push(prop);
            if(lhsProperties.findIndex( lkey => { return prop ==  lkey}) == -1) {
                this.isEqual = false;
                this.lhsErrors.push("Missing property: " + this.formatXpath(this.rhsXpath));
            }
            this.rhsXpath.pop()
        });
        
        lhsProperties.forEach(ele => {
            this.lhsXpath.push(ele);
            this.rhsXpath.push(ele);
            let lhsEle = lhsObj[ele];
            let rhsEle = rhsObj[ele];
			this.isEqual = this.isSameType(lhsEle, rhsEle)
            if(this.isEqual) {
                if (jQuery.isArray(lhsEle) && jQuery.isArray(rhsEle)) {
                    this.isEqual = this.compareAsArray(lhsEle, rhsEle);
                }
                else if (this.isObject(lhsEle) && this.isObject(rhsEle)) {
                    this.isEqual = this.compareAsObject(lhsEle, rhsEle);
                }                        
            } else {
				this.isEqual = false;
                this.lhsErrors.push(this.formatXpath(this.lhsXpath) + " property type (" + this.getType(lhsEle) + " and " + this.getType(rhsEle) + ") do not match.");
                this.rhsErrors.push(this.formatXpath(this.rhsXpath) + " property type (" + this.getType(rhsEle) + " and " + this.getType(lhsEle) + ") do not match.");
            }
            
            this.lhsXpath.pop();
            this.rhsXpath.pop();
        });

        return (this.rhsErrors.length == 0 && this.lhsErrors.length == 0);
    }

    getType(ele) {
        if(ele === null) { return "null"}
        else if(jQuery.isArray(ele)) { return 'Array'; }
        else { return typeof(ele); }
    }

    isValidJSON(str) {
        try {
            return JSON.parse(str);
        } catch(e) {
            console.log(e);
            return null;
        }
    }
    
    isSameType(lhsObj, rhsObj) {
        console.log("Xpath: " + this.lhsXpath);
        let same = false;
        same = (lhsObj == null) && (rhsObj == null);
        if (!same) {
            same = (
                (this.isArray(lhsObj) && this.isArray(rhsObj)) ||
                (this.isObject(lhsObj) && this.isObject(rhsObj)) ||
                (this.isNumber(lhsObj) && this.isNumber(rhsObj)) ||
                (this.isString(lhsObj) && this.isString(rhsObj)) ||
                (this.isBoolean(lhsObj) && this.isBoolean(rhsObj) )
            );
        }
        return same;
    }
    
    isObject(obj) {
        return (obj != null) && jQuery.isPlainObject(obj);
    }
    
    isNumber(obj) {
        return (obj != null) && (typeof (obj) === 'number');
    }
    
    isString(obj) {
        return (obj != null) && (typeof (obj) === 'string');
    }

    isBoolean(obj) {
        return (obj != null) && (typeof (obj) ===  'boolean')
    }
    
    isArray(obj) {
        return (jQuery.isArray(obj) || (this.allowNullForArrays && (obj === null)));
    }
}







