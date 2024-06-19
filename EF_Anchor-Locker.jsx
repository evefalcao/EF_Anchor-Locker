/**========================================================================
 * ?                  EF_Anchor-Locker.jsx
 * @author         :  Eveline Falcão (https://evelinefalcao.com)
 * @email          :  hello@evelinefalcao.com
 * @version        :  1.0.0
 * @createdFor     :  Adobe After Effects CC 2024 (Version 24.1.0 Build 78)
 * @description    :  Locks the Anchor Point to one of the nine corners of a layer, with or without an offset. Currently does not work with masked layers.
 * @thankyou       :  Charles Bordenave (https://www.nabscripts.com) for RepositionAnchorPoint (version: 3.9) and Zack Lovatt (https://lova.tt/) for zl_CreatePivotalNull (version: 1.1).
 *========================================================================**/

var resourceString = 
"group{orientation:'column', alignment: ['left', 'top'], alignChildren: ['left', 'top'],\
    anchorPointGroup: Panel{alignment: ['fill', 'fill'], alignChildren: ['center', 'center'], text: 'Anchor Point',\
        row1: Group{orientation:'row',\
            a: RadioButton{},\
            b: RadioButton{},\
            c: RadioButton{},\
        },\
        row2: Group{orientation:'row',\
            a: RadioButton{},\
            b: RadioButton{},\
            c: RadioButton{},\
        },\
        row3: Group{orientation:'row',\
            a: RadioButton{},\
            b: RadioButton{},\
            c: RadioButton{},\
        },\
    },\
    offsetAnchorPoint: Panel{orientation: 'row', alignment: ['fill', 'fill'], alignChildren: ['center', 'center'], text: 'Offset Point',\
        xLabel: StaticText{text:'X'},\
        xText: EditText{text: '0', characters: 4},\
        yLabel: StaticText{text:'Y'},\
        yText: EditText{text: '0', characters: 4},\
        zLabel: StaticText{text:'Z'},\
        zText: EditText{text: '0', characters: 4}\
    },\
    buttonsGroup: Group{orientation: 'row', alignment: ['fill', 'fill'], alignChildren: ['center', 'center'],\
        removeExpressions: Button{text: 'Delete', alignment: ['center', 'bottom'], strokeColor:'transparent'},\
        applyButton: Button{text: 'Apply', alignment: ['center', 'bottom']}\
    },\
}"

function createUserInterface(thisObj, userInterfaceString, scriptName){

    var pal = (thisObj instanceof Panel) ? thisObj : new Window("palette", scriptName, undefined, {resizeable: true});
    if (pal == null) return pal;

    var UI = pal.add(userInterfaceString);

    pal.layout.layout(true);
    pal.layout.resize();
    pal.onResizing = pal.onResize = function(){
        this.layout.resize();
    }
    if ((pal != null) && (pal instanceof Window)){
        pal.show();
    }

    var anchorPointGroup = UI.anchorPointGroup;
    var offsetAnchorPoint = UI.offsetAnchorPoint;
    
    // Check the radio button states
    // Row 1
    for(var c = 0; c < anchorPointGroup.row1.children.length; c++){
        anchorPointGroup.row1.children[c].onClick = function() {
            for (var i = 0; i < anchorPointGroup.row1.children.length; i++) {
                anchorPointGroup.row2.children[i].value = false;
                anchorPointGroup.row3.children[i].value = false;
            }
        };
    }
    // Row 2
    for(var c = 0; c < anchorPointGroup.row2.children.length; c++){
        anchorPointGroup.row2.children[c].onClick = function() {
            for (var i = 0; i < anchorPointGroup.row2.children.length; i++) {
                anchorPointGroup.row1.children[i].value = false;
                anchorPointGroup.row3.children[i].value = false;
            }
        };
    }
    // Row 3
    for(var c = 0; c < anchorPointGroup.row3.children.length; c++){
        anchorPointGroup.row3.children[c].onClick = function() {
            for (var i = 0; i < anchorPointGroup.row3.children.length; i++) {
                anchorPointGroup.row1.children[i].value = false;
                anchorPointGroup.row2.children[i].value = false;
            }
        };
    }

    // Default state for the offset value
    offsetAnchorPoint.xText.onChange = function(){
        var xVal = parseFloat(offsetAnchorPoint.xText.text);
        if(isNaN(xVal)){
            offsetAnchorPoint.xText.text = 0;
        }
    }
    offsetAnchorPoint.yText.onChange = function(){
        var yVal = parseFloat(offsetAnchorPoint.yText.text);
        if(isNaN(yVal)){
            offsetAnchorPoint.yText.text = 0;
        }
    }
    offsetAnchorPoint.zText.onChange = function(){
        var zVal = parseFloat(offsetAnchorPoint.zText.text);
        if(isNaN(zVal)){
            offsetAnchorPoint.zText.text = 0;
        }
    }

    // Other buttons default states
    anchorPointGroup.row2.b.value = true;

    return UI;
}

var UI = createUserInterface(this, resourceString, "EF_Lock Anchor Point");

function setPropertyValue(comp, property, value){
    // Function inspired by zl_CreatePivotalNull_setKeys
    var currentTime = comp.time;
    if(property.isTimeVarying == true){
        var nearestKeyframeIndex = property.nearestKeyIndex(currentTime);
        property.setValueAtKey(nearestKeyframeIndex, value);
    } else {
        property.setValue(value);
    }
}

function getBoundingBox(layer, currentTime){
    var sourceRect = layer.sourceRectAtTime(currentTime, true);
    var top = sourceRect.top;
    var left = sourceRect.left;
    var width = sourceRect.width;
    var height = sourceRect.height;
}

function removeAnchorPointExpressions(){
    var comp = app.project.activeItem;
    var layers = comp.selectedLayers;

    app.beginUndoGroup("'Remove Anchor Point Expressions'");
    for(var l = 0; l < layers.length; l++){
        var currentLayer = layers[l];
        var currentTime = comp.time;
        var anchorPointProp = currentLayer.property("ADBE Transform Group").property("ADBE Anchor Point");
        var newAnchorValue = anchorPointProp.valueAtTime(currentTime, false);
        anchorPointProp.expression = "";
        setPropertyValue(comp, anchorPointProp, newAnchorValue);
    }
    app.endUndoGroup();
}

function addExpression(){
    var comp = app.project.activeItem;
    var layers = comp.selectedLayers;

    app.beginUndoGroup("'Lock Anchor Point'");
    for(var l = 0; l < layers.length; l++){
        var currentLayer = layers[l];
        var currentTime = comp.time;

        var anchorPointProp = currentLayer.property("ADBE Transform Group").property("ADBE Anchor Point");
        var positionProp = currentLayer.property("ADBE Transform Group").property("ADBE Position");
        var scaleProp = currentLayer.property("ADBE Transform Group").property("ADBE Scale");

        var initialAnchorValue = anchorPointProp.value;
        var initialScaleProp = scaleProp.value;
        var initialPositionValue = positionProp.value;
        var resetScale = false;
        var pointPositionTxt, finalAnchorValue;

        // Clears any expression in the Anchor Point property
        if(anchorPointProp.expressionEnabled){
            anchorPointProp.expression = "";
        }

        // UI.buttonsGroup.removeExpressions.onClick = function(){
        //     anchorPointProp.expression = "";
        //     return;
        // }

        // Get bounding box
        var sourceRect = currentLayer.sourceRectAtTime(currentTime, true);
        var top = sourceRect.top;
        var left = sourceRect.left;
        var width = sourceRect.width;
        var height = sourceRect.height;

        // Add the "Offset Anchor Point" value
        var offsetX = parseFloat(UI.offsetAnchorPoint.xText.text);
        var offsetY = parseFloat(UI.offsetAnchorPoint.yText.text);
        var offsetZ = parseFloat(UI.offsetAnchorPoint.zText.text);

        // Radio button selection
        // Row 1
        if (UI.anchorPointGroup.row1.a.value){
            pointPositionTxt = "[left + " + offsetX + ", " + "top + " + offsetY + ", " + offsetZ + "]";
            newAnchorPositionId = 0;
        } else if (UI.anchorPointGroup.row1.b.value){
            pointPositionTxt = "[(left + width / 2) + " + offsetX + ", " + "top + " + offsetY + ", " + offsetZ + "]";
            newAnchorPositionId = 1;
        } else if (UI.anchorPointGroup.row1.c.value){
            pointPositionTxt = "[(left + width) + " + offsetX + ", " + "top + " + offsetY + ", " + offsetZ + "]";
            newAnchorPositionId = 2;
        // Row 2
        } else if (UI.anchorPointGroup.row2.a.value){
            pointPositionTxt = "[left + " + offsetX + ", " + "(top + height / 2) + " + offsetY + ", " + offsetZ + "]";
            newAnchorPositionId = 3;
        } else if (UI.anchorPointGroup.row2.b.value){
            pointPositionTxt = "[(left + width / 2) + " + offsetX + ", " + "(top + height / 2) + " + offsetY + ", " + offsetZ + "]";
            newAnchorPositionId = 4;
        } else if (UI.anchorPointGroup.row2.c.value){
            pointPositionTxt = "[(left + width) + " + offsetX + ", " + "(top + height / 2) + " + offsetY + ", " + offsetZ + "]";
            newAnchorPositionId = 5;
        // Row 3
        } else if (UI.anchorPointGroup.row3.a.value){
            pointPositionTxt = "[left + " + offsetX + ", " + "(top + height) + " + offsetY + ", " + offsetZ + "]";
            newAnchorPositionId = 6;
        } else if (UI.anchorPointGroup.row3.b.value){
            pointPositionTxt = "[(left + width / 2) + " + offsetX + ", " + "(top + height) + " + offsetY + ", " + offsetZ + "]";
            newAnchorPositionId = 7;
        } else if (UI.anchorPointGroup.row3.c.value){
            pointPositionTxt = "[(left + width) + " + offsetX + ", " + "(top + height) + " + offsetY + ", " + offsetZ + "]";
            newAnchorPositionId = 8;
        }

        // Position + Anchor Point workaround - Charles Bordenave's solution is the best I found.
        var anchorGridX = (newAnchorPositionId % 3) - 1;
		var anchorGridY = Math.floor(newAnchorPositionId / 3) - 1;
        var centerWidth = width / 2;
		var centerHeight = height / 2;
        anchorPointProp.expression = 
        "fromWorld(toWorld([" + centerWidth + "," + centerHeight + ",0] + [" + anchorGridX + "*" + centerWidth + "+" + offsetX + "," + anchorGridY + "*"+ centerHeight + "+" + offsetY + ",0" + offsetZ + "]));";
        positionProp.expression =
        "try {\r" +
        "	parent.fromWorld(toWorld([" + centerWidth + "," + centerHeight + ",0] + [" + anchorGridX + "*" + centerWidth + "+" + offsetX + "," + anchorGridY + "*"+ centerHeight + "+" + offsetY + ",0" + offsetZ + "]));\r" +
        "}\r" +
        "catch(e)\r" +
        "{\r" +
        "  toWorld([" + centerWidth + "," + centerHeight + ",0] + [" + anchorGridX + "*" + centerWidth + "+" + offsetX + "," + anchorGridY + "*"+ centerHeight + "+" + offsetY + ",0" + offsetZ + "]);\r" +
        "}";
		positionProp.expressionEnabled = false;
		positionProp.expressionEnabled = true;
        var newAnchorValue = anchorPointProp.valueAtTime(currentTime, false);
		anchorPointProp.expression = "";
		var newPositionValue = positionProp.valueAtTime(currentTime, false);
		positionProp.expression = "";
        setPropertyValue(comp, positionProp, newPositionValue);
        setPropertyValue(comp, anchorPointProp, newAnchorValue);

        anchorPointProp.expression = "let layerRect = thisLayer.sourceRectAtTime(time, false);\nlet top = layerRect.top;\nlet left = layerRect.left;\nlet width = layerRect.width;\nlet height = layerRect.height;\n\n" + pointPositionTxt;
    }
    app.endUndoGroup();
}

UI.buttonsGroup.removeExpressions.onClick = function(){
    removeAnchorPointExpressions();
}

UI.buttonsGroup.applyButton.onClick = function(){
    addExpression();
}