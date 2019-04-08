
!function(){
    // why is the order important here? does not make any sense to me -,-
    rws.createCSSSelector(".menu_element_class", "background-color: #18202a;" +
        "cursor: pointer;" +
        "color: #fff;"
    );

    rws.createCSSSelector(".menu_element_class2", "background-color: #0f0;" +
        "cursor: pointer;" +
        "color: #fff;"
    );

    rws.createCSSSelector(".me_hovered","background-color: #18202a;" +
        "color: #aaa;");



    rws.createCSSSelector(".mEntry", "background-color: #fff;" +
        "cursor: pointer;"
    );
    rws.createCSSSelector(".mEntry_hovered","background-color: #3A4E66;");
    // This is where we create the gui  and its handler;
    rws.createCSSSelector(".hidden","display: none");




    var m1=rws.addNavigationMenu("",rws.NAV_POSITION_BOTTOM,"horizontal");
    m1.setBackgroundColor("#18202a");

    var graphRenderer= wapi.createAPI();
    rws.setCentralWidget(graphRenderer,"graphRenderer");
    graphRenderer.initialize("graphRenderer");

    graphRenderer.readDatatypeAssertionFile("core/gizmoCore.json");

    graphRenderer.updateCanvasAreaSize("100%","100%","0px","-40px");
    graphRenderer.showFpsAndElementStatistic(true);



    // create right sideBar
    var rsb = rws.addSideMenu("", rws.SIDE_MENU_RIGHT, false);
    rsb.setBackgroundColor("#18202a");
    rsb.setSize("300px", "100%", "0px", "-40px");
    rsb.setAPI(graphRenderer);

    /**  ONTOLOGY LOADER ELEMENTS **/

    var ontologyLoader= m1.addMenuEntry("Ontology","center");
    ontologyLoader.setStyle("menu_element_class").setHoverStyle("me_hovered");
    // add buttons and connect them
    var bt0=ontologyLoader.addEntryElement("Example Container JSON");
    var bt2=ontologyLoader.addEntryElement("Muto Container JSON");
    var bt1=ontologyLoader.addEntryElement("Example Ontology");
    var bt3=ontologyLoader.addEntryElement("Muto");
    var ontoLoader= ontologyLoader.addEntryElement("Load Ontology as File (JSON)");


    ontoLoader.connectOnClick(function(){
        graphRenderer.graph.clearGraphData();
        graphRenderer.loadGizmoConfig("gizmoNotations/default.json");
        graphRenderer.loadOntologyFromFile();
    });

    bt1.connectOnClick(function(){
        graphRenderer.graph.clearGraphData();
        loadLocalJson("exampleOntologies/exampleOntology.json");
    });

    bt0.connectOnClick(function(){
        graphRenderer.graph.clearGraphData();
        loadLocalJson("exampleOntologies/Container1.json");
    });
    bt2.connectOnClick(function(){
        graphRenderer.graph.clearGraphData();
        loadLocalJson("exampleOntologies/Container2.json");
    });



    bt3.connectOnClick(function(){
        graphRenderer.graph.clearGraphData();
        loadLocalJson("exampleOntologies/muto.json");
    });



    ontologyLoader.addSvgIconInFront();



    /**  NOTATION LOADER ELEMENTS **/

    var notationOpts= m1.addMenuEntry("Notations","center");
    notationOpts.setStyle("menu_element_class").setHoverStyle("me_hovered");

    var notationLoader  = notationOpts.addEntryElement("Load Custom Notation");
    var notation1       = notationOpts.addEntryElement("VOWL");
    var notation2       = notationOpts.addEntryElement("UML Style");
    var notation3       = notationOpts.addEntryElement("RDF Style");
    var notation4       = notationOpts.addEntryElement("Example Notation");


    notation1.connectOnClick(function(){
        graphRenderer.loadGizmoConfig("gizmoNotations/vowl.json");
    });

    notation2.connectOnClick(function(){
        graphRenderer.loadGizmoConfig("gizmoNotations/umlStyle.json");
    });
    notation3.connectOnClick(function(){
        graphRenderer.loadGizmoConfig("gizmoNotations/default.json");
    });
    notation4.connectOnClick(function(){
        graphRenderer.loadGizmoConfig("gizmoNotations/exampleNotation.json");
    });


    notationLoader.connectOnClick(function () {
        // TODO MAKE IT LOAD TTL FILES
        graphRenderer.loadNotationFromJSONFile();
    });



    var viewOpts= m1.addMenuEntry("Create View","center");
    viewOpts.setWidth("220px");
    viewOpts.setStyle("menu_element_class").setHoverStyle("me_hovered");

    var bt_appendNewView=viewOpts.addEntryElement("Append view");
     bt_appendNewView.connectOnClick(function(){
         graphRenderer.appendViewDialog();
    });
    var viewsContainer= m1.addMenuEntry("Views","center");
    viewsContainer.setStyle("menu_element_class").setHoverStyle("me_hovered");
    viewsContainer.classed("hidden",true);


    var notationContainer= m1.addMenuEntry("Provided Notations","center");
    notationContainer.setStyle("menu_element_class").setHoverStyle("me_hovered");
    notationContainer.setWidth("220px");
    notationContainer.classed("hidden",true);



    var menuExport= m1.addMenuEntry("Export","center");
    menuExport.setStyle("menu_element_class").setHoverStyle("me_hovered");
    // var bt_exportSpec      = menuExport.addEntryElement("Specification");
    var bt_exportContainer = menuExport.addEntryElement("Container");
    // bt_exportSpec.connectOnClick(graphRenderer.saveSpecificationAsTTL);
    bt_exportContainer.connectOnClick(graphRenderer.saveContainerAsTTL);
    // var bt_overWriteView=viewOpts.addEntryElement("Overwrite View");




    graphRenderer.setFunctionOnViewLoad(_viewLoadCallback);
    graphRenderer.setFunctionClearProvidedNotations(_clearProvidedNotationContainer);
    graphRenderer.setFunctionAddProvidedNotations(_notationAddEntry);
    graphRenderer.setFunctionReEvalPauseButton(_reEvalPauseButton);
    graphRenderer.setRightSideElementsFunction(_createRightSideElements);

    var pauseButton= m1.addMenuEntry("Pause","center");
    pauseButton.setStyle("menu_element_class").setHoverStyle("me_hovered");
    // overwrite onClick event;
    pauseButton.getMenuEntryDOM().on("click",function(){
       // console.log(this);
       graphRenderer.graph.forcePlayPause();
       //  console.log("Force Paused: "+val);
       //  if (val){
       //      this.innerHTML="Play";
       //  } else {
       //      this.innerHTML="Pause";
       //  }
        graphRenderer.updateForceStateString();
    });

    function _createRightSideElements(element){
        rsb.clearMenuContainer();
        var nodeElement=true;
        if (!element.getLabelText){
            nodeElement=false;
        }
        var title;
        if (nodeElement){
            title=element.getLabelText();
        } else{
            title=element.getPropertyNode().getLabelText()
        }

        rsb.setTitle(title,"center");
        var configObject;
        if (nodeElement){
            configObject=element.getLocalConfigObj();
        }else{
            configObject=element.getConfigObj();
        }
   //     console.log(configObject);
        // rendering type and colors;
        createSelectionOptions(element,title,configObject,"renderingType",["circle","rect","ellipse"]);
        createShapeColor(element,configObject,["bgColor"]);

        // // shape parameter;
        // var subTitle_ShapeParameter=document.createElement('div');
        // rsb.appendHTML_Child(subTitle_ShapeParameter);
        // subTitle_ShapeParameter.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>Shape parameter</h5>";
        // createShapeParameter(title,configObject,["width","height","radius","roundedCorner"]);
        // createSelectionOptions(title,configObject,"fontSizeOverWritesShapeSize",["true","false"]);
        // createSpinOption(title,configObject,"overWriteOffset");
        // // strokeParameter
        // var subTitle_strokeParameter=document.createElement('div');
        // rsb.appendHTML_Child(subTitle_strokeParameter);
        // subTitle_strokeParameter.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>Stroke parameter</h5>";

    }

    function _reEvalPauseButton(){
        var val=graphRenderer.graph.isForcePaused();
        var setVal="Play";
        if (!val) setVal="Pause";
       // console.log("Reevaluating Pause button "+ val +" to "+setVal);
        if (val){
            pauseButton.getMenuEntryDOM().node().innerHTML="Play";
        } else {
            pauseButton.getMenuEntryDOM().node().innerHTML="Pause";
        }

    }

    var numOfNotations=0;
    function _clearProvidedNotationContainer(){
        notationContainer.clearEntries();
        notationContainer.classed("hidden", true);
        numOfNotations=0;

    }

    function _notationAddEntry(iri,prefix){

        notationContainer.classed("hidden",false);

        var bt=notationContainer.addEntryElement(prefix);
        bt.appendAttribute("NotationIndex",numOfNotations);
        bt.appendAttribute("iri",iri);
        numOfNotations++;
        notationContainer.setTitle("Provided Notations (" + numOfNotations + ")");
        bt.connectOnClick(function(){
            console.log(this);
            var id=this.getAttribute("iri");
            console.log("telling the graph to load notation by IRI " + id);

            graphRenderer.applyProvidedNotation(id);
            console.log("redraw the graph with new notation");


        });




    }


    function _viewLoadCallback() {
        // no parameters are given but we take here the vars and stuffl

        // console.log("The Controlling Function now adds views ");
        var views= graphRenderer.graph.getViews();
        var numViews=views.length;
        if (numViews>0) {
            viewsContainer.clearEntries();
            viewsContainer.setTitle("Select Views (" + numViews + ")");
            viewsContainer.classed("hidden", false);
        }else{
            viewsContainer.clearEntries();
            viewsContainer.classed("hidden", true);
        }

        for (var i=0;i<numViews;i++){
            var ind=i+1;
            var bt=viewsContainer.addEntryElement("View "+ind);
            bt.appendAttribute("viewIndex",i);
            bt.connectOnClick(function(){
                var id=parseInt(this.getAttribute("viewIndex"));
                // console.log("telling the graph to load view by index " + id);
                graphRenderer.graph.applyViewByIndex(id);


            });


        }



    }




    m1.hideAllMenus();
    // initialized datatypes






    d3.select(window).on("resize", adjustSize);

    function adjustSize(){
        graphRenderer.updateCanvasAreaSize("100%","100%","0px","-40px");
        m1.updateScrollButtonVisibility();
    }
    adjustSize();




    function loadLocalJson(filename){
        graphRenderer.loadOntologyFromLocalJSON(filename);
    }
    //loadLocalJson("testData.json");
    // loadLocalJson("smallTest.json");

     loadLocalJson("exampleOntologies/exampleOntology.json");
     // graphRenderer.loadGizmoConfig("gizmoNotations/default.json");

     console.log("Loading Done!");

    // graphRenderer.loadGizmoConfig("defaultSpecification-byGE.json");



    // ***************** RIGHT SIDE BAR FUNCTIONS ******/////////////


    function createSelectionOptions(element,objName,configObj,propertyName,optionsArray,eventHidderId){
        var thisDiv=document.createElement('div');
        rsb.appendHTML_Child(thisDiv);
        var thisDivNode=d3.select(thisDiv);
        thisDivNode.style("dispay","grid");
        thisDivNode.style("margin-top","5px");
        thisDivNode.style("width","100%");
        thisDivNode.style("padding","2px 5px");

        if (eventHidderId){
            // console.log("Event HIder ID "+ eventHidderId);
            thisDivNode.classed(eventHidderId,true);
        }



        var lb=thisDivNode.append('label');
        lb.node().innerHTML=propertyName;
        var sel=thisDivNode.append('select');
        sel.node().id="_"+propertyName+"_Selection";
        sel.style("position","absolute");
        sel.style("right","10px");


        for (var i=0;i<optionsArray.length;i++){
            var optA=sel.append('option');
            optA.node().innerHTML=optionsArray[i];
        }

        // set the selected value;
        var givenRenderingType=configObj[propertyName];
        // console.log(givenRenderingType);
        var selectionIndex=optionsArray.indexOf(givenRenderingType);
        var selection=d3.select("#_"+propertyName+"_Selection");
        selection.node().options.selectedIndex=selectionIndex;
        selection.on("change",function(){
            var parent=d3.select("#_"+propertyName+"_Selection");
            var optsArray=parent.node().options;
            var selectedIndex=optsArray.selectedIndex;
            var nameOfElement=optsArray[selectedIndex].innerHTML;
            // console.log("That thing has Changed Selection to value: "+nameOfElement);
            configObj[propertyName]=nameOfElement;

            var nodeElement=true;
            if (!element.getLabelText){
                nodeElement=false;
                element.getPropertyNode().getConfigObj()[propertyName]=nameOfElement;
            }
            // graphRenderer.graph.zoomToExtentOfGraph();
            if (nodeElement)
                element.handleLocal_GizmoRepresentationChanges();
            else
                element.getPropertyNode().handleLocal_GizmoRepresentationChanges();
            // if (propertyName==="renderingType") {
            //     updateShapeParamVisibility(configObj[propertyName]);
            // }

        });
        return selection;
    }

    function createLineEditOption(title,configObject,params,eventHandlerId){
        var thisDiv=document.createElement('div');
        rsb.appendHTML_Child(thisDiv);
        var thisDivNode=d3.select(thisDiv);
        thisDivNode.style("width","100%");
        thisDivNode.style("padding","2px 5px");
        if (eventHandlerId){
            thisDiv.id=eventHandlerId;
        }


        for (var i=0;i<params.length;i++) {
            var paramDiv=thisDivNode.append("div");
            paramDiv.node().id="lineEdit_param_"+params[i];

            var lb=paramDiv.append('label');
            lb.node().innerHTML=params[i];
            var lineEdit=paramDiv.append("input");
            lineEdit.node().type="text";
            lineEdit.node().paramName=params[i];
            lineEdit.node().value=configObject[params[i]];
            lineEdit.style("width","150px");
            lineEdit.style("position","absolute");
            lineEdit.style("right","10px");
            lineEdit.on("change", function(){
                configObject[this.paramName]=this.value;
                redrawLeftSideElement(title);
                graphRenderer.graph.redraw();
                graphRenderer.graph.stopForce();
            });
        }


    }

    function createScaleSpinOption(title,configObject,params,eventHidderId) {
        var thisDiv = document.createElement('div');
        rsb.appendHTML_Child(thisDiv);
        var thisDivNode = d3.select(thisDiv);
        thisDivNode.style("width", "100%");
        thisDivNode.style("padding", "2px 5px");
        var paramDiv = thisDivNode.append("div");
        paramDiv.node().id = "spin_param_" + params;

        if (eventHidderId) {
            thisDivNode.classed(eventHidderId, true);
        }

        var lb = paramDiv.append('label');
        lb.node().innerHTML = params;
        var spin = paramDiv.append("input");
        spin.node().type = "number";
        spin.node().min = "-5";
        spin.node().max = "5";
        spin.node().step = "0.1";
        spin.node().paramName = params;
        spin.node().addPixelParameter = false;
        if (typeof configObject[params] === "string" && configObject[params].indexOf("px") !== -1) {
            spin.node().value = configObject[params].split("px")[0];
            spin.node().addPixelParameter = true;
        } else {
            spin.node().value = configObject[params];
        }
        spin.style("width", "50px");
        spin.style("position", "absolute");
        spin.style("right", "10px");
        spin.on("input", function () {
            var addPixelParameter = this.addPixelParameter;
            var setValue = this.value;
            if (addPixelParameter === true)
                setValue += "px";
            else {
                console.log(this.paramName + " is given as a number Oo");
                setValue = parseFloat(setValue);
                console.log(setValue + "  " + typeof setValue);
            }
            configObject[this.paramName] = setValue;
            redrawLeftSideElement(title);


            graphRenderer.graph.updateAllConfigObjects();
            graphRenderer.graph.redraw();
            graphRenderer.graph.stopForce();
        });
    }

    function createSpinOption(title,configObject,params,eventHidderId) {
        var thisDiv=document.createElement('div');
        rsb.appendHTML_Child(thisDiv);
        var thisDivNode=d3.select(thisDiv);
        thisDivNode.style("width","100%");
        thisDivNode.style("padding","2px 5px");
        var paramDiv=thisDivNode.append("div");
        paramDiv.node().id="spin_param_"+params;

        if (eventHidderId){
            thisDivNode.classed(eventHidderId,true);
        }

        var lb=paramDiv.append('label');
        lb.node().innerHTML=params;
        var spin=paramDiv.append("input");
        spin.node().type="number";
        spin.node().min="-360";
        spin.node().max="360";
        spin.node().step="1";
        spin.node().paramName=params;
        spin.node().addPixelParameter=false;
        if (typeof configObject[params]=== "string" && configObject[params].indexOf("px")!==-1){
            spin.node().value = configObject[params].split("px")[0];
            spin.node().addPixelParameter=true;
        }else {
            spin.node().value = configObject[params];
        }
        spin.style("width","50px");
        spin.style("position","absolute");
        spin.style("right","10px");
        spin.on("input", function(){
            console.log("SPIN INPUT >>>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<");
            var addPixelParameter=this.addPixelParameter;
            console.log("addPixelParameter : "+ addPixelParameter);
            var setValue=this.value;
            if (addPixelParameter===true)
                setValue+="px";
            else{
                console.log(this.paramName + " is given as a number Oo");
                setValue=parseInt(setValue);
                console.log(setValue+ "  "+ typeof setValue);
            }
            configObject[this.paramName]=setValue;

            console.log("SPIN INPUT >>>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<");
            redrawLeftSideElement(title);


            console.log("SPIN INPUT REDRAW STUFF >>>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<");
            graphRenderer.graph.updateAllConfigObjects();
            graphRenderer.graph.redraw();
            graphRenderer.graph.stopForce();
        });
    }

    function createShapeParameter(title,configObject,params,eventHandlerId){
        // we stick for now to px units;
        var thisDiv=document.createElement('div');
        rsb.appendHTML_Child(thisDiv);
        var thisDivNode=d3.select(thisDiv);
        thisDivNode.style("width","100%");
        thisDivNode.style("padding","2px 5px");
        if (eventHandlerId){
            thisDiv.id=eventHandlerId;
        }

        for (var i=0;i<params.length;i++){
            var element=configObject[params[i]];
            // console.log(element);
            // console.log(typeof element);

            if (params[i]==="roundedCorner") {

                var paramDiv=thisDivNode.append("div");
                paramDiv.node().id="shape_param_"+params[i];
                paramDiv.style("padding","5px 0 0 0");


                var lb=paramDiv.append('label');
                lb.node().innerHTML=params[i];
                var spin0=paramDiv.append("input");
                spin0.node().type="number";
                spin0.node().min="0";
                spin0.node().max="200";
                spin0.node().step="1";
                spin0.style("width","50px");
                spin0.style("position","absolute");
                spin0.style("right","70px");
                spin0.node().addPixelParameter=false;
                if (typeof configObject[params[i]][0]=== "string" && configObject[params[i]][0].indexOf("px")!==-1){
                    spin0.node().value = configObject.roundedCorner[0].split("px")[0];
                    spin0.node().addPixelParameter=true;
                }else {
                    spin0.node().value = configObject.roundedCorner[0];
                }
                spin0.node().value=configObject.roundedCorner[0];

                spin0.on("input", function(){
                    var addPixelParameter=this.addPixelParameter;
                    var setValue=this.value;
                    if (addPixelParameter===true)
                        setValue+="px";
                    else{
                        setValue=parseInt(setValue);
                    }
                    configObject.roundedCorner[0]=setValue;


                });
                var spin1=paramDiv.append("input");
                spin1.node().type="number";
                spin1.node().min="0";
                spin1.node().max="200";
                spin1.node().step="1";
                spin1.node().value=configObject.roundedCorner[1];
                spin1.style("width","50px");
                spin1.style("position","absolute");
                spin1.style("right","10px");
                spin1.on("input", function(){
                    configObject.roundedCorner[1]=this.value;
                    var addPixelParameter=this.addPixelParameter;
                    var setValue=this.value;
                    if (addPixelParameter===true)
                        setValue+="px";
                    else{
                        setValue=parseInt(setValue);
                    }
                    configObject.roundedCorner[1]=setValue;

                });
                continue;
            }
            var paramDiv=thisDivNode.append("div");
            paramDiv.node().id="shape_param_"+params[i];



            var lb=paramDiv.append('label');
            lb.node().innerHTML=params[i];
            var spin=paramDiv.append("input");
            spin.node().type="number";
            spin.node().min="1";
            spin.node().max="200";
            spin.node().step="1";
            spin.node().paramName=params[i];
            spin.node().value=configObject[params[i]];
            spin.style("width","50px");
            spin.style("position","absolute");
            spin.style("right","10px");


            spin.node().addPixelParameter=false;
            if (typeof configObject[params[i]]=== "string" && configObject[params[i]].indexOf("px")!==-1){
                spin.node().value = configObject[params[i]].split("px")[0];
                spin.node().addPixelParameter=true;
            }else {
                spin.node().value = configObject[params[i]];
            }

            spin.on("input", function(){
                var addPixelParameter=this.addPixelParameter;
                var setValue=this.value;
                if (addPixelParameter===true)
                    setValue+="px";
                else{
                    setValue=parseInt(setValue);
                }
                configObject[this.paramName]=setValue;

            })
        }

        updateShapeParamVisibility(configObject.renderingType);

    }

    function updateShapeParamVisibility(type){
        var width=d3.select("#shape_param_width");
        var height=d3.select("#shape_param_height");
        var radius=d3.select("#shape_param_radius");
        var roundedCorner=d3.select("#shape_param_roundedCorner");

        if (type==="circle"){
            if (width) width.classed("hidden",true);
            if (height) height.classed("hidden",true);
            if (roundedCorner) roundedCorner.classed("hidden",true);
            if (radius) radius.classed("hidden",false);
        }

        else {
            if (width) width.classed("hidden",false);
            if (height) height.classed("hidden",false);
            if (radius) radius.classed("hidden",true);
            if (roundedCorner) roundedCorner.classed("hidden",false);

        }

        if (type==="ellipse"){
            if (roundedCorner) roundedCorner.classed("hidden",true);
        }

    }

    function createSelectionOption(parent,configObj,name,selectorId,optsArray, titleArray){
        var thisDiv=parent.append("div");

        thisDiv.style("width","100%");
        thisDiv.style("padding","0 5px 5px 5px ");
        var paramDiv=thisDiv.append("div");
        paramDiv.node().id="__selection__"+selectorId;
        paramDiv.style("padding","0 0 5px 0");

        var lb=thisDiv.append('label');
        lb.node().innerHTML=name;
        var sel=thisDiv.append('select');
        sel.node().id="_"+selectorId+"_Selection";
        sel.style("position","absolute");
        sel.style("right","10px");

        var selId=0;
        for (var i=0;i<optsArray.length;i++){
            var optA=sel.append('option');
            optA.node().innerHTML=optsArray[i];
            optA.node().title=titleArray[i];

            if (configObj[selectorId]===optsArray[i]){
                selId=i;
                optA.node().selected=true;
            }


        }
        sel.selectedIndex=selId;


        sel.on("change",function() {
            configObj[selectorId] = this.value;
            console.log(configObj);

        });
    }



    function createShapeColor(element,configObject,params,eventHidderId){
        var thisDiv=document.createElement('div');
        rsb.appendHTML_Child(thisDiv);
        var thisDivNode=d3.select(thisDiv);
        thisDivNode.style("width","100%");
        thisDivNode.style("padding","2px 5px");

        if (eventHidderId){
            thisDivNode.classed(eventHidderId,true);
        }

        for (var i=0;i<params.length;i++){
            var paramDiv=thisDivNode.append("div");
            paramDiv.node().id="color_param_"+params[i];
            paramDiv.style("padding","0 0 5px 0");
            var lb=paramDiv.append('label');
            lb.node().innerHTML=params[i];
            var color=paramDiv.append("input");

            color.style("position","absolute");
            color.style("right","10px");
            color.node().type="color";
            color.node().paramName=params[i];
            color.node().value=configObject[params[i]];
            color.on("input", function(){
                configObject[this.paramName]=this.value;

                var nodeElement=true;
                if (!element.getLabelText){
                    nodeElement=false;
                    element.getPropertyNode().getConfigObj()[this.paramName]=this.value;
                }
                // graphRenderer.graph.zoomToExtentOfGraph();
                if (nodeElement)
                    element.handleLocal_GizmoRepresentationChanges();
                else
                    element.getPropertyNode().handleLocal_GizmoRepresentationChanges();
                // if (propertyName==="renderingType") {


            })

        }
    }

}();
