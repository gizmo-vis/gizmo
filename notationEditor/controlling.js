
!function(){
    var alreadyAddedElements=[];

    // ["defaultNodeElement", "defaultPropertyElement",
    //     "defaultDatatypeElement","collapsedLoops","collapsedDatatypes",
    //     "collapsedMultiLinkProperty"];
    var currentlyDrawnInGraph=undefined;
    var aDtMap={};
    var prefixInput;
    var iriInput;

    // definitions of the elements;
    var nodes=["defaultNodeElement",
        // "ExternalClass",
        "owl:Thing",
        "owl:Class",
        // "owl:complementOf",
        // "owl:DeprecatedClass",
        // "owl:disjointUnionOf",
        // "owl:equivalentClass",
        // "owl:intersectionOf",
        // "owl:Nothing",
        // "owl:unionOf",
        // "rdfs:Class",
        "rdfs:Resource"
    ];
    var properties=["defaultPropertyElement",
        // "owl:allValuesFrom",
        "owl:DatatypeProperty",
        // "owl:DeprecatedProperty",
        // "owl:disjointWith",
        // "owl:equivalentProperty",
        // "owl:FunctionalProperty",
        // "owl:InverseFunctionalProperty",
        "owl:ObjectProperty",
        // "owl:someValuesFrom",
        // "owl:SymmetricProperty",
        // "owl:TransitiveProperty",
        // "rdf:Property",
        "rdfs:subClassOf",
        "setOperatorProperty"
    ];
    var datatypes=["defaultDatatypeElement","rdfs:Datatype","rdfs:Literal"];

    var map_nodes=[];
    var map_properties=[];
    var map_datatypes=[];
    var notationsObject={
        graphBgColor:"#ECF0F1",
        layoutAlgorithm:"force",
        applyNestedElements:"true"
    };

    function createmappings() {
        var i,nameInConfig;
        for ( i=0;i<nodes.length;i++){
            nameInConfig=nodes[i];
            if (nameInConfig.indexOf(":")!==-1){
                nameInConfig=nameInConfig.replace(":","");
            }
            map_nodes.push(nameInConfig);
        }
        for ( i=0;i<properties.length;i++){
            nameInConfig=properties[i];
            if (nameInConfig.indexOf(":")!==-1){
                nameInConfig=nameInConfig.replace(":","");
            }
            map_properties.push(nameInConfig);
        }
        for ( i=0;i<datatypes.length;i++){
            nameInConfig=datatypes[i];
            if (nameInConfig.indexOf(":")!==-1){
                nameInConfig=nameInConfig.replace(":","");
            }
            map_datatypes.push(nameInConfig);
        }
    }

    createmappings();


    rws.createCSSSelector(".menu_element_class", "background-color: #18202a;" +
        "cursor: pointer;" +
        "color: #fff;"
    );
    rws.createCSSSelector(".hidden", "display: none;");
    rws.createCSSSelector(".menu_element_class2", "background-color: #ccc;" +
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
    graphRenderer.initialize("graphRenderer",_continueCallBack);
    var lsb = rws.addSideMenu("", rws.SIDE_MENU_LEFT, false);
    lsb.setLookUpMap(nodes,properties,datatypes);
    var rsb = rws.addSideMenu("", rws.SIDE_MENU_RIGHT, false);

    function _continueCallBack() {
        graphRenderer.updateCanvasAreaSize("100%", "100%", "0px", "-40px");
        graphRenderer.showFpsAndElementStatistic(false);
        graphRenderer.setFunctionReEvalPauseButton(function(){ return ; });
        console.log(graphRenderer.elementsConfig);
        lsb.setBackgroundColor("#18202a");
        lsb.setSize("220px", "50%", "0px", "-40px");
        lsb.setAPI(graphRenderer);

        rsb.setBackgroundColor("#18202a");
        rsb.setSize("300px", "100%", "0px", "-40px");
        rsb.setAPI(graphRenderer);

        var me1 = m1.addMenuEntry("New", "center");
        me1.setStyle("menu_element_class").setHoverStyle("me_hovered");
        me1.getMenuEntryDOM().on("click",function(){location.reload();});

        // add save as json
        var me2 = m1.addMenuEntry("Save ", "center");
        me2.setStyle("menu_element_class").setHoverStyle("me_hovered");

        var saveJSON=me2.addEntryElement("As JSON");
        saveJSON.connectOnClick(refactoredSaveCurrentConfigAsJSON);

        var saveTTL=me2.addEntryElement("As TTL");
        saveTTL.connectOnClick(refactoredSaveAsTTL);

        var me3 = m1.addMenuEntry("Load", "center");
        me3.setStyle("menu_element_class").setHoverStyle("me_hovered");
        me3.getMenuEntryDOM().on("click",function(){loadConfigFromJSON();});
        // me3.hideAllMenus();

        d3.select(window).on("resize", adjustSize);
        addDefaultElements();
        adjustSize();
        m1.hideAllMenus();
        // read the default JSON
        readDatatypeAssertionFile("gizmoCore.json");
    }

    function readDatatypeAssertionFile(fname){
        d3.xhr(fname, "application/json", function (error, request) {
            if (error !== null && error.status === 500) {
                console.log(error);
                console.log("HAS AN ERROR AND A STATUS WHILE LOADING " + fname);
                return;
            }
            parseDatatypeAssertion(request.responseText);
        });
    }

    function adjustSize(){
        graphRenderer.updateCanvasAreaSize("100%","100%","0px","-40px");
        m1.updateScrollButtonVisibility();
        lsb.setSize("220px","100%","0px","-40px");
        rsb.setSize("300px","100%","0px","-40px");
    }


    // create the left sideBar Handling;
    function initOntologyOptions(container){
        var iriLabel=container.append("label");
        iriLabel.node().innerHTML="IRI:  <br> ";
        iriInput=container.append("input");
        iriInput.node().value="http://example.org/ontologies/notation_1";
        var prefixLabel=container.append("label");
        prefixLabel.node().innerHTML="Prefix";
        prefixInput=container.append("input");
        prefixInput.node().value="notation_1"



    }

    function redrawNotationOptions(){
        while (layoutOpts.node().firstChild) {
            layoutOpts.node().removeChild(layoutOpts.node().firstChild);
        }

        addGraphOptions(layoutOpts,notationsObject);

    }
    var layoutOpts;
    function addDefaultElements(){
        // create a dropdown menu with an add entry;

        // dropdown menu
        var elementArray=[];
        elementArray.push("----------   Nodes   -----------");
        elementArray=[].concat(elementArray,nodes.slice(1));
        elementArray.push("---------- Properties ----------");
        elementArray=[].concat(elementArray,properties.slice(1));
        elementArray.push("---------- Datatypes  ----------");
        elementArray=[].concat(elementArray,datatypes.slice(1));


        // create the things we need for now;

        // 0] ontology information
        var OntologyOpts=lsb.appendAccordionElement("Ontology Options",true);
        initOntologyOptions(OntologyOpts);

        // 1] layout
        layoutOpts=lsb.appendAccordionElement("Layout Options",true);

        addGraphOptions(layoutOpts,notationsObject);

        // 2] collapsed elements handler
        // 3] owl constructor handler , is actually down below;

        var defaultElements=lsb.appendAccordionElement("Default Elements Options",true);


        lsb.addDropDownBoxWithButton("Add Element","_addElement_Selection",elementArray,"Add",addElementHandler);


        // we need default class, default property, default link;
        addAccordionElement(defaultElements,"defaultNodeElement");
        addAccordionElement(defaultElements,"defaultPropertyElement");
        addAccordionElement(defaultElements,"defaultDatatypeElement");
        addAccordionElement(defaultElements,"collapsedMultiLinkProperty");
        // addAccordionElement(defaultElements,"collapsedDatatypes");
        // addAccordionElement(defaultElements,"collapsedLoops");
        addAccordionElement(defaultElements,"nestedNode");



    }

    function addElementHandler(){
        var selection=d3.select("#_addElement_Selection");
        var optsArray=selection.node().options;
        var selectedIndex=optsArray.selectedIndex;
        var nameOfElementToAdd=optsArray[selectedIndex].innerHTML;
        addElement(nameOfElementToAdd,"top");

    }

    function addGraphOptions(parent,cfgObject){
        // console.log("The config object is what?");
        // console.log(configObject);
        createGraphBgColorOptions(parent,cfgObject,"Graph bg color ");
        createSelectionOption(parent,cfgObject,"LayoutAlg", "layoutAlgorithm",["force"],["Dynamic Layout Optimization"]);
        createSelectionOption(parent,cfgObject,"Nested", "applyNestedElements",["true","false"],["UML-Styled visualization","Native Graph Visualization"]);
        // createShapeColor(title,configObject,["inshapeStrokeColor"]);
        //
        // // inshape parameters;
        //
        // // use like radius and
        // var subTitle_ShapeParameter=document.createElement('div');
        // rsb.appendHTML_Child(subTitle_ShapeParameter);
        // subTitle_ShapeParameter.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>inShape parameter</h5>";
        //
        // createSelectionOptions(title,configObject,"inshapeType",["indicator","segment"]);
        // createSelectionOptions(title,configObject,"inshapeStrokeType",["solid","dashed","dotted"]);
        // createShapeColor(title,configObject,["inshapeStrokeColor"]);
        // createSpinOption(title,configObject,["inshapeStrokeStrokeWidth"]);
        // createSpinOption(title,configObject,"inshapeIndicatorOffset");
        // // if is segment
        //
        // createSelectionOptions(title,configObject,"segmentType",["full","half", "quarter"]);
        // createSpinOption(title,configObject,"segmentStartAngle");
        // createSpinOption(title,configObject,"segmentHeight");
        // createSpinOption(title,configObject,"segmentOffset");
        // createSpinOption(title,configObject,"segmentLabelSize");
        // createSpinOption(title,configObject,"segmentAdjustmentMargin");
        // createSelectionOptions(title,configObject,"showLabelInSegment",["true","false"]);
        //
        //
        //
        // // umlStyle
        // createSelectionOptions(title,configObject,"umlShapeAdjustsShapeSize",["none","header", "datatypes", "loops"]);
        // createScaleSpinOption(title,configObject,"umlElementScaleFactor");
        // createSpinOption(title,configObject,"umlHeightOffset");
        // createSpinOption(title,configObject,"umlOffsetToHeader");
        // createSpinOption(title,configObject,"umlOffsetToAfterLastElement");




    }

    function addAccordionElement(parent,name,pos){
        if (alreadyAddedElements.indexOf(name)===-1){
            alreadyAddedElements.push(name);
            lsb.addRenderingElement_Accordion(parent,name,pos,onClickFunction);
        }
    }

    function addElement(name,pos){
        if (alreadyAddedElements.indexOf(name)===-1){
            alreadyAddedElements.push(name);
            lsb.addRenderingElement(name,pos,onClickFunction);
        }
    }

    function getNameInConfig(name) {
        var nameInConfig=name;
        if (name.indexOf(":")!==-1){
            nameInConfig=name.replace(":","");
        }
        return nameInConfig;
    }

    function onClickFunction(withParam,configObject,labelText) {
        var nodeCfg,dataTypeCfg;
        var nodeCfgName,propertyCfgName;

        console.log("withParam:"+ withParam);
        if(currentlyDrawnInGraph===withParam) {
            graphRenderer.graph.zoomToExtentOfGraph();
            return;
        } // already drawn in graph

        currentlyDrawnInGraph=withParam;
        if (nodes.indexOf(withParam)!==-1){
            // create this element in the graph
            graphRenderer.graph.clearGraphData();
            console.log("adding node");
            var node=graphRenderer.graph.addNode(labelText,configObject);
            node.setPosition(0,0);
            nodeCfgName=getNameInConfig(withParam);
            node.setConfigName(nodeCfgName);
            graphRenderer.graph.drawElements();
            graphRenderer.graph.updateAllConfigObjects();
            graphRenderer.graph.redraw();
            graphRenderer.graph.stopForce();
            graphRenderer.graph.zoomToExtentOfGraph(true);
        }

        if (properties.indexOf(withParam)!==-1){
            // create this element in the graph
            graphRenderer.graph.clearGraphData();
            nodeCfg=graphRenderer.elementsConfig.owlClass;
            nodeCfgName="owlClass";
            if (nodeCfg===undefined) {
                nodeCfg = graphRenderer.elementsConfig.defaultNodeElement;
                nodeCfgName="defaultNodeElement";
            }
            var domain=graphRenderer.graph.addNode("Domain",nodeCfg);
            // try range when we are owlDatatypeProperty
            if (withParam==="owl:DatatypeProperty"){
                nodeCfg=graphRenderer.elementsConfig.rdfsLiteral;
                nodeCfgName="rdfsLiteral";
                if (nodeCfg===undefined) {
                    nodeCfg=graphRenderer.elementsConfig.defaultDatatypeElement;
                    nodeCfgName="defaultDatatypeElement";
                }
            }

            var range=graphRenderer.graph.addNode("Range",nodeCfg);
            range.setConfigName(nodeCfgName);
            domain.setPosition(0,0);
            range.setPosition(400,0);
            var property=graphRenderer.graph.addProperty(labelText,configObject);
            var propertyCfgName=getNameInConfig(withParam);
            property.setConfigName(propertyCfgName);
            property.getPropertyNode().setConfigName(propertyCfgName);
            property.domain(domain);
            property.range(range);
            graphRenderer.graph.updateAllConfigObjects();
            graphRenderer.graph.redraw();
            graphRenderer.graph.stopForce();
            graphRenderer.graph.zoomToExtentOfGraph();
        }
        if (datatypes.indexOf(withParam)!==-1){
            graphRenderer.graph.clearGraphData();
            nodeCfg=graphRenderer.elementsConfig.owlClass;
            nodeCfgName="owlClass";
            if (nodeCfg===undefined) {
                nodeCfg = graphRenderer.elementsConfig.defaultNodeElement;
                nodeCfgName="defaultNodeElement";
            }

            dataTypeCfg=graphRenderer.elementsConfig.owlDatatypeProperty;
            var dataTypePropertyCfgName="owlDatatypeProperty";

            if (dataTypeCfg===undefined) {
                dataTypeCfg = graphRenderer.elementsConfig.defaultPropertyElement;
                dataTypePropertyCfgName ="defaultPropertyElement";
            }



            var domain=graphRenderer.graph.addNode("Domain",nodeCfg);
            domain.setConfigName(nodeCfgName);
            var range=graphRenderer.graph.addNode(labelText,configObject);
            var elementConfigName=getNameInConfig(withParam);
            range.setConfigName(elementConfigName);
            domain.setPosition(0,0);
            range.setPosition(400,0);
            var property=graphRenderer.graph.addProperty("datatypeProperty",dataTypeCfg);
            property.setConfigName(dataTypePropertyCfgName);
            //  console.log("Set datatypePropertyCfg Name "+ dataTypePropertyCfgName);
            property.getPropertyNode().setConfigName(dataTypePropertyCfgName);
            property.domain(domain);
            property.range(range);
            graphRenderer.graph.updateAllConfigObjects();
            graphRenderer.graph.redraw();
            graphRenderer.graph.stopForce();
            graphRenderer.graph.zoomToExtentOfGraph();
        }


        if (datatypes.indexOf(withParam)===-1 && properties.indexOf(withParam)===-1 && nodes.indexOf(withParam)===-1){

            console.log("This is a collapse elemenent handler ! "+ withParam);

            if (withParam==="nestedNode"){
                // create two classes and add multiple properties; // then collapse the ml;
                graphRenderer.graph.clearGraphData();
                nodeCfg=graphRenderer.elementsConfig.owlClass;
                graphRenderer.graph.applyNestedVisualization(notationsObject.applyNestedElements);
                graphRenderer.graph.forceDtandLoopCollapse(graphRenderer.graph.applyNestedVisualization());

                nodeCfgName="owlClass";
                var dtPropCfgName="owlDatatypeProperty";
                var dtConfName="rdfsLiteral";

                var dtConfig=graphRenderer.elementsConfig.rdfsLiteral;

                var dtPropConfig=graphRenderer.elementsConfig.owlDatatypeProperty;

                if (dtConfig===undefined){
                    dtConfig=graphRenderer.elementsConfig.defaultDatatypeElement;
                    dtConfName="defaultDatatypeElement";
                }
                if (dtPropConfig===undefined){
                    dtPropConfig=graphRenderer.elementsConfig.defaultPropertyElement;
                    dtPropCfgName="defaultPropertyElement";
                }

                if (nodeCfg===undefined) {
                    nodeCfg = graphRenderer.elementsConfig.defaultNodeElement;
                    nodeCfgName="defaultNodeElement"
                }

                // create nodeStructure;

               // console.log(nodeCfg);

                var domain=graphRenderer.graph.addNode("Nested Node");
                domain.setConfigName(nodeCfgName);
                domain.updateConfig();
                domain.setPosition(0,0);


                // add 3 datatypes
                var l1=graphRenderer.graph.addNode("Literal");
                var l2=graphRenderer.graph.addNode("Literal");
                var l3=graphRenderer.graph.addNode("Literal");





                l1.setConfigName(dtConfName);
                l1.updateConfig();
                l2.setConfigName(dtConfName);
                l2.updateConfig();
                l3.setConfigName(dtConfName);
                l3.updateConfig();


                l1.setPosition(200,0);
                l2.setPosition(200,-50);
                l3.setPosition(200,50);

                // add properties;

                var p1=graphRenderer.graph.addProperty("owl:DatatypeProperty 1");
                var p2=graphRenderer.graph.addProperty("owl:DatatypeProperty 2");
                var p3=graphRenderer.graph.addProperty("owl:DatatypeProperty N");

                p1.setConfigName(dtPropCfgName);
                p1.updateConfig();
                p2.setConfigName(dtPropCfgName);
                p2.updateConfig();
                p3.setConfigName(dtPropCfgName);
                p3.updateConfig();


                p1.getPropertyNode().setConfigName(dtPropCfgName);
                p1.getPropertyNode().updateConfig();
                p2.getPropertyNode().setConfigName(dtPropCfgName);
                p2.getPropertyNode().updateConfig();
                p3.getPropertyNode().setConfigName(dtPropCfgName);
                p3.getPropertyNode().updateConfig();

                p1.domain(domain);
                p1.range(l1);
                p2.domain(domain);
                p2.range(l2);
                p3.domain(domain);
                p3.range(l3);

                objPropTypeName="owlObjectProperty";
                var objPropType=graphRenderer.elementsConfig.owlObjectProperty;
                if (objPropType===undefined) {
                    objPropType = graphRenderer.elementsConfig.defaultPropertyElement;
                    objPropTypeName="defaultPropertyElement";
                    // console.log("using default property cfg");
                    // console.log(objPropType);
                }
                var loop1=graphRenderer.graph.addLoopProperty("owl:ObjectProperty (loop) 1");
                var loop2=graphRenderer.graph.addLoopProperty("owl:ObjectProperty (loop) 2");
                var loop3=graphRenderer.graph.addLoopProperty("owl:ObjectProperty (loop) N");

                loop1.setConfigName(objPropTypeName);
                loop2.setConfigName(objPropTypeName);
                loop3.setConfigName(objPropTypeName);

                loop1.getPropertyNode().setConfigName(objPropTypeName);
                loop2.getPropertyNode().setConfigName(objPropTypeName);
                loop3.getPropertyNode().setConfigName(objPropTypeName);

                loop1.getPropertyNode().elementTypeConstructorName("owl:ObjectProperty");
                loop2.getPropertyNode().elementTypeConstructorName("owl:ObjectProperty");
                loop3.getPropertyNode().elementTypeConstructorName("owl:ObjectProperty");

                loop1.updateConfig();
                loop2.updateConfig();
                loop3.updateConfig();

                loop1.getPropertyNode().updateConfig();
                loop2.getPropertyNode().updateConfig();
                loop3.getPropertyNode().updateConfig();


                loop1.domain(domain);
                loop1.range(domain);
                loop2.domain(domain);
                loop2.range(domain);
                loop3.domain(domain);
                loop3.range(domain);


                graphRenderer.graph.redraw();
               // console.log("Upadted Config");
                // hide them;

                domain.setTemporalCollapsedElements([p1,p2,p3,loop1,loop2,loop3]);
                domain.hasCollapsibleNodes(true);
                domain.hasCollapsibleLoops(true);
                domain.collapseTempElements(true);
                // domain.setCollapsedDatatypesConfigName("collapsedDatatypes");

                domain.connectDoubleClickAction(function(){
                    console.log("Execute double click action");
                    graphRenderer.graph.ignoreEvents();
                    domain.collapseTempElements();
                    graphRenderer.graph.redraw();
                    graphRenderer.graph.stopForce();

                });
                graphRenderer.graph.drawElements(true);
                graphRenderer.graph.updateAllConfigObjects();
                // console.log("updatedAll Config Objects ");
                graphRenderer.graph.redraw();
                graphRenderer.graph.stopForce();
                graphRenderer.graph.zoomToExtentOfGraph();

                createRightSideBarOptionsForCollapsed(withParam, graphRenderer.elementsConfig.nestedNode);
                return;
            }

            if (withParam==="collapsedMultiLinkProperty"){
                // create two classes and add multiple properties; // then collapse the ml;
                graphRenderer.graph.clearGraphData();
                nodeCfg=graphRenderer.elementsConfig.owlClass;

                var nodeCfgName="owlClass";
                var objPropTypeName="owlObjectProperty";

                var objPropType=graphRenderer.elementsConfig.owlObjectProperty;
                if (nodeCfg===undefined) {
                    nodeCfg = graphRenderer.elementsConfig.defaultNodeElement;
                    nodeCfgName="defaultNodeElement";

                }if (objPropType===undefined) {
                    objPropType = graphRenderer.elementsConfig.defaultPropertyElement;
                    objPropTypeName="defaultPropertyElement";
                }
                var domain=graphRenderer.graph.addNode("Domain",nodeCfg);
                var range=graphRenderer.graph.addNode("Range",nodeCfg);
                domain.setPosition(0,0);
                range.setPosition(400,0);
                domain.setConfigName(nodeCfgName);
                range.setConfigName(nodeCfgName);

                // create multiple properties; (e.g 3 )


                // add collapsed element
                var collapsedProperty=graphRenderer.graph.addCollapsedMLProperty("< >",configObject);
                collapsedProperty.setConfigName("collapsedMultiLinkProperty");
                var numOfProps=5; // used for dynamic strokeWidth
                collapsedProperty.setLabelText("< "+numOfProps+" >");
                collapsedProperty.domain(domain);
                collapsedProperty.range(range);
                collapsedProperty.getPropertyNode().setLabelText("< "+numOfProps+" >");
                collapsedProperty.getPropertyNode().setConfigName("collapsedMultiLinkProperty");

                graphRenderer.graph.updateAllConfigObjects();
                graphRenderer.graph.redraw();
                graphRenderer.graph.stopForce();
                graphRenderer.graph.zoomToExtentOfGraph();

            }


            if (withParam==="collapsedDatatypes"){
                // create two classes and add multiple properties; // then collapse the ml;
                graphRenderer.graph.clearGraphData();
                nodeCfg=graphRenderer.elementsConfig.owlClass;
                nodeCfgName="owlClass";
                var dtPropCfgName="";
                var dtConfName="";

                var dtConfig=graphRenderer.elementsConfig.rdfsLiteral;
                var dtPropConfig=graphRenderer.elementsConfig.owlDatatypeProperty;

                if (dtConfig===undefined){
                    dtConfig=graphRenderer.elementsConfig.defaultDatatypeElement;
                    dtConfName="defaultDatatypeElement";
                }
                if (dtPropConfig===undefined){
                    dtPropConfig=graphRenderer.elementsConfig.defaultPropertyElement;
                    dtPropCfgName="defaultPropertyElement";
                }

                if (nodeCfg===undefined) {
                    nodeCfg = graphRenderer.elementsConfig.defaultNodeElement;
                    nodeCfgName="defaultNodeElement"
                }

                // create nodeStructure;



                var domain=graphRenderer.graph.addNode("Nested Node",nodeCfg);
                domain.setConfigName(nodeCfgName);
                domain.setPosition(0,0);


                // add 3 datatypes
                var l1=graphRenderer.graph.addNode("Literal",dtConfig);
                var l2=graphRenderer.graph.addNode("Literal",dtConfig);
                var l3=graphRenderer.graph.addNode("Literal",dtConfig);





                l1.setConfigName(dtConfName);
                l2.setConfigName(dtConfName);
                l3.setConfigName(dtConfName);


                l1.setPosition(200,0);
                l2.setPosition(200,-50);
                l3.setPosition(200,50);

                // add properties;

                var p1=graphRenderer.graph.addProperty("owl:DatatypeProperty 1",dtPropConfig);
                var p2=graphRenderer.graph.addProperty("owl:DatatypeProperty 2",dtPropConfig);
                var p3=graphRenderer.graph.addProperty("owl:DatatypeProperty N",dtPropConfig);

                p1.setConfigName(dtPropCfgName);
                p2.setConfigName(dtPropCfgName);
                p3.setConfigName(dtPropCfgName);

                p1.getPropertyNode().setConfigName(dtPropCfgName);
                p2.getPropertyNode().setConfigName(dtPropCfgName);
                p3.getPropertyNode().setConfigName(dtPropCfgName);

                p1.domain(domain);
                p1.range(l1);
                p2.domain(domain);
                p2.range(l2);
                p3.domain(domain);
                p3.range(l3);

                // hide them;

                domain.setTemporalCollapsedElements([p1,p2,p3]);
                domain.hasCollapsibleNodes(true);
                domain.collapseTempElements(true);
                // domain.setCollapsedDatatypesConfigName("collapsedDatatypes");

                domain.connectDoubleClickAction(function(){
                    console.log("Execute double click action");
                    graphRenderer.graph.ignoreEvents();
                    domain.collapseTempElements();
                    graphRenderer.graph.redraw();
                    graphRenderer.graph.stopForce();

                });

                graphRenderer.graph.updateAllConfigObjects();
                // console.log("updatedAll Config Objects ");
                graphRenderer.graph.redraw();
                graphRenderer.graph.stopForce();
                graphRenderer.graph.zoomToExtentOfGraph();

                createRightSideBarOptionsForCollapsed(withParam, graphRenderer.elementsConfig.collapsedDatatypes);
                return;

            }

            if (withParam==="collapsedLoops"){
                // create two classes and add multiple properties; // then collapse the ml;
                graphRenderer.graph.clearGraphData();
                nodeCfg=graphRenderer.elementsConfig.owlClass;
                nodeCfgName="owlClass";
                objPropTypeName="owlObjectProperty";
                var objPropType=graphRenderer.elementsConfig.owlObjectProperty;
                if (nodeCfg===undefined) {
                    nodeCfg = graphRenderer.elementsConfig.defaultNodeElement;
                    nodeCfgName="defaultNodeElement";
                    // console.log("USING DEFAULT NODE CFG ");
                    // console.log(nodeCfg);
                }if (objPropType===undefined) {
                    objPropType = graphRenderer.elementsConfig.defaultPropertyElement;
                    objPropTypeName="defaultPropertyElement";
                    // console.log("using default property cfg");
                    // console.log(objPropType);
                }
                var domain=graphRenderer.graph.addNode("Nested Node",nodeCfg);
                domain.setPosition(0,0);
                domain.setConfigName(nodeCfgName);


                var loop1=graphRenderer.graph.addLoopProperty("owl:ObjectProperty (loop) 1",objPropType);
                var loop2=graphRenderer.graph.addLoopProperty("owl:ObjectProperty (loop) 2",objPropType);
                var loop3=graphRenderer.graph.addLoopProperty("owl:ObjectProperty (loop) N",objPropType);

                loop1.setConfigName(objPropTypeName);
                loop2.setConfigName(objPropTypeName);
                loop3.setConfigName(objPropTypeName);

                loop1.getPropertyNode().setConfigName(objPropTypeName);
                loop2.getPropertyNode().setConfigName(objPropTypeName);
                loop3.getPropertyNode().setConfigName(objPropTypeName);

                loop1.getPropertyNode().elementTypeConstructorName("owl:ObjectProperty");
                loop2.getPropertyNode().elementTypeConstructorName("owl:ObjectProperty");
                loop3.getPropertyNode().elementTypeConstructorName("owl:ObjectProperty");



                loop1.domain(domain);
                loop1.range(domain);
                loop2.domain(domain);
                loop2.range(domain);
                loop3.domain(domain);
                loop3.range(domain);



                // hide them;

                domain.setTemporalCollapsedElements([loop1,loop2,loop3]);
                domain.hasCollapsibleLoops(true);
                domain.collapseTempElements();
                // domain.setCollapsedDatatypesConfigName("collapsedDatatypes");

                domain.connectDoubleClickAction(function(){
                    console.log("Execute double click action");
                    graphRenderer.graph.ignoreEvents();
                    domain.collapseTempElements();
                    graphRenderer.graph.redraw();
                    graphRenderer.graph.stopForce();

                });

                graphRenderer.graph.updateAllConfigObjects();
                graphRenderer.graph.redraw();
                graphRenderer.graph.stopForce();
                graphRenderer.graph.zoomToExtentOfGraph();
                createRightSideBarOptionsForCollapsed(withParam,  graphRenderer.elementsConfig.collapsedLoops);
                return;

            }
        }

        createRightSideBarOptions(withParam,configObject);
    }

    function createDynamicDropDownSelection(title, selectionArray, configObject,eventHandler){

        var selection= createSelectionOptions(title,configObject,eventHandler,selectionArray);
        selection.attr("hideElements",eventHandler+"_hidder");
        console.log("Selection Value is "+ selection.node().value);
        if (selection.node().value==="none"){
            var subTitle_ShapeParameter=document.createElement('div');
            rsb.appendHTML_Child(subTitle_ShapeParameter);
            subTitle_ShapeParameter.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>Hidden Nested Elements</h5>";

        }
        if (selection.node().value==="inshape") {
            console.log("rendering inshape stuff")
            var subTitle_ShapeParameter = document.createElement('div');
            rsb.appendHTML_Child(subTitle_ShapeParameter);
            subTitle_ShapeParameter.innerHTML = "<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>in shape indicator parameter</h5>";
            var inSeg=createSelectionOptions(title, configObject, "inshapeType", ["indicator", "segment"]);
            console.log("Insegment:"+ inSeg.node().value);
            if (inSeg.node().value==="indicator") {
                createSelectionOptions(title, configObject, "inshapeStrokeType", ["solid", "dashed", "dotted"]);
                createShapeColor(title, configObject, ["inshapeStrokeColor"]);
                createSpinOption(title, configObject, ["inshapeStrokeStrokeWidth"]);
                createSpinOption(title, configObject, "inshapeIndicatorOffset");
            }else {
                // if is segment
                console.log("rendering segmentS stuff")
                subTitle_ShapeParameter.innerHTML = "<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>inshape segment parameter</h5>";
                createSelectionOptions(title, configObject, "segmentType", ["full", "half", "quarter"]);
                createSpinOption(title, configObject, "segmentStartAngle");
                createSpinOption(title, configObject, "segmentHeight");
                createSpinOption(title, configObject, "segmentOffset");
                createSpinOption(title, configObject, "segmentLabelSize");
                createSpinOption(title, configObject, "segmentAdjustmentMargin");
                createSelectionOptions(title, configObject, "showLabelInSegment", ["true", "false"]);
            }
            inSeg.on("change",function() {

                configObject["inshapeType"]=this.value;
                graphRenderer.graph.redraw();
                graphRenderer.graph.stopForce();
                // graphRenderer.graph.zoomToExtentOfGraph();

                /// redraw menu
                rsb.clearMenuContainer();
                rsb.setTitle(title,"center");

                createDynamicDropDownSelection(title,["umlStyle"],configObject,"renderingType");

            });

        }


        if (selection.node().value==="umlStyle") {
            // umlStyle var subTitle_ShapeParameter=document.createElement('div');
            var subTitle_ShapeParameter = document.createElement('div');
            rsb.appendHTML_Child(subTitle_ShapeParameter);
            subTitle_ShapeParameter.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>UML Style Nested Options</h5>";
            createSelectionOptions(title, configObject, "umlNestElements", ["dt_loops"]);
            createSelectionOptions(title, configObject, "umlShapeAdjustsShapeSize", ["none", "header", "datatypes", "loops", "allElements"]);
            createScaleSpinOption(title, configObject, "umlElementScaleFactor");
            createSpinOption(title, configObject, "umlHeightOffset");
            createSpinOption(title, configObject, "umlOffsetToHeader");
            createSpinOption(title, configObject, "umlOffsetToAfterLastElement");
            createSpinOption(title, configObject, "umlMarginLeft");
            createSpinOption(title, configObject, "umlMarginRight");
            createSpinOption(title, configObject, "umlMarginBetween");
            createSelectionOptions(title, configObject, "umlShowDatatypeProperty", ["true", "false", "icon"]);
            createSelectionOptions(title, configObject, "umlDrawHeaderLine", ["true", "false"]);
            createSelectionOptions(title, configObject, "umlHeaderAlign", ["left", "center", "right"]);
            createSelectionOptions(title, configObject, "umlPropertyAlign", ["left", "center", "right"]);
        }



        selection.on("change",function() {

            configObject[eventHandler]=this.value;
            graphRenderer.graph.redraw();
            graphRenderer.graph.stopForce();
            // graphRenderer.graph.zoomToExtentOfGraph();

            /// redraw menu
            rsb.clearMenuContainer();
            rsb.setTitle(title,"center");

            createDynamicDropDownSelection(title,["umlStyle"],configObject,"renderingType");

        });



        return selection;
    }


    function createDynamicBooleanSelection(title,configObject,eventHandler,_function){
        var selection= createSelectionOptions(title,configObject,eventHandler,["true","false"]);
        selection.attr("hideElements",eventHandler+"_hidder");
        _function(title,configObject,eventHandler+"_hidder");


        var _oldSelectionFuncion=selection.on("change");
        selection.on("change",function() {

            var optsArray = this.options;
            var selectedIndex = optsArray.selectedIndex;
            var nameOfElement = optsArray[selectedIndex].innerHTML;

            var toHide=d3.select(this).attr("hideElements");
            var nodesToHide=d3.selectAll("."+toHide);

            if (nameOfElement==="true") {
                nodesToHide.classed("hidden", false);
            } else {
                nodesToHide.classed("hidden", true);
            }
            // call old selection fucntion
            _oldSelectionFuncion();
        });

        // execute the hidder ;
        var nodesToHide=d3.selectAll("."+eventHandler+"_hidder");
        var nameOfElement=configObject[eventHandler];
        // console.log(eventHandler + "  nameOfElement:"+nameOfElement);
        if (nameOfElement==="true") {
            nodesToHide.classed("hidden", false);
        } else {
            nodesToHide.classed("hidden", true);
        }

        return selection;

    }

    function createSelectionOptions(objName,configObj,propertyName,optionsArray,eventHidderId){
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
            graphRenderer.graph.redraw();
            graphRenderer.graph.stopForce();
            // graphRenderer.graph.zoomToExtentOfGraph();
            redrawLeftSideElement(objName);
            if (propertyName==="renderingType") {
                updateShapeParamVisibility(configObj[propertyName]);
            }

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
                    redrawLeftSideElement(title);
                    graphRenderer.graph.updateAllConfigObjects();
                    graphRenderer.graph.redraw();
                    graphRenderer.graph.stopForce();

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
                    graphRenderer.graph.updateAllConfigObjects();
                    graphRenderer.graph.redraw();
                    graphRenderer.graph.stopForce();
                    redrawLeftSideElement(title);
                    graphRenderer.graph.redraw();
                    graphRenderer.graph.stopForce();
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
                redrawLeftSideElement(title);
                graphRenderer.graph.updateAllConfigObjects();
                graphRenderer.graph.redraw();
                graphRenderer.graph.stopForce();
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
    function createGraphBgColorOptions(parent,configObejct){
        var thisDiv=parent.append("div");

        thisDiv.style("width","100%");
        thisDiv.style("padding","2px 5px");
        var paramDiv=thisDiv.append("div");
        paramDiv.node().id="color_param_graphBg";
        paramDiv.style("padding","0 0 5px 0");
        paramDiv.node().innerHTML="Graph BG color";
        var color=paramDiv.append("input");
        color.style("position","absolute");
        color.style("right","10px");
        color.node().type="color";
        if (configObejct.graphBgColor)
            graphRenderer.graphBGColor(configObejct.graphBgColor);
        color.node().value=graphRenderer.graphBGColor();

        color.on("input", function(){
            graphRenderer.graphBGColor(this.value);
            configObejct.graphBgColor=this.value;
        })
    }

    function createShapeColor(title,configObject,params,eventHidderId){
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
                redrawLeftSideElement(title);
                graphRenderer.graph.redraw();
                graphRenderer.graph.stopForce();
            })

        }



    }
    function createRightSideBarOptionsForCollapsed(title, configObject){
        rsb.clearMenuContainer();
        rsb.setTitle(title,"center");

        // console.log("The config object is what?");
        // console.log(configObject);
        //createSelectionOptions(title,configObject,"renderingType");
        createDynamicDropDownSelection(title,["umlStyle"],configObject,"renderingType");
        // inshape parameters;

        // // use like radius and
        // var subTitle_ShapeParameter=document.createElement('div');
        // rsb.appendHTML_Child(subTitle_ShapeParameter);
        // subTitle_ShapeParameter.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>inShape parameter</h5>";
        //
        // createSelectionOptions(title,configObject,"inshapeType",["indicator","segment"]);
        // createSelectionOptions(title,configObject,"inshapeStrokeType",["solid","dashed","dotted"]);
        // createShapeColor(title,configObject,["inshapeStrokeColor"]);
        // createSpinOption(title,configObject,["inshapeStrokeStrokeWidth"]);
        // createSpinOption(title,configObject,"inshapeIndicatorOffset");
        // // if is segment
        //
        // createSelectionOptions(title,configObject,"segmentType",["full","half", "quarter"]);
        // createSpinOption(title,configObject,"segmentStartAngle");
        // createSpinOption(title,configObject,"segmentHeight");
        // createSpinOption(title,configObject,"segmentOffset");
        // createSpinOption(title,configObject,"segmentLabelSize");
        // createSpinOption(title,configObject,"segmentAdjustmentMargin");
        // createSelectionOptions(title,configObject,"showLabelInSegment",["true","false"]);
        //
        //
        //
        // // umlStyle
        // createSelectionOptions(title,configObject,"umlShapeAdjustsShapeSize",["none","header", "datatypes", "loops","allElements"]);
        // createScaleSpinOption(title,configObject,"umlElementScaleFactor");
        // createSpinOption(title,configObject,"umlHeightOffset");
        // createSpinOption(title,configObject,"umlOffsetToHeader");
        // createSpinOption(title,configObject,"umlOffsetToAfterLastElement");
        // createSpinOption(title,configObject,"umlMarginLeft");
        // createSpinOption(title,configObject,"umlMarginRight");
        // createSpinOption(title,configObject,"umlMarginBetween");
        // createSelectionOptions(title,configObject,"umlShowDatatypeProperty",["true","false", "icon"]);
        // createSelectionOptions(title,configObject,"umlDrawHeaderLine",["true","false"]);
        // createSelectionOptions(title,configObject,"umlHeaderAlign",["left","center","right"]);
        // createSelectionOptions(title,configObject,"umlPropertyAlign",["left","center","right"]);





    }

    function createRightSideBarOptions(title, configObject){
        // console.log("Want to create right sidebar options for "+ title);

        rsb.clearMenuContainer();
        rsb.setTitle(title,"center");
        // rendering type and colors;
        createSelectionOptions(title,configObject,"renderingType",["circle","rect","ellipse"]);
        createShapeColor(title,configObject,["bgColor"]);

        // shape parameter;
        var subTitle_ShapeParameter=document.createElement('div');
        rsb.appendHTML_Child(subTitle_ShapeParameter);
        subTitle_ShapeParameter.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>Shape parameter</h5>";
        createShapeParameter(title,configObject,["width","height","radius","roundedCorner"]);
        createSelectionOptions(title,configObject,"fontSizeOverWritesShapeSize",["true","false"]);
        createSpinOption(title,configObject,"overWriteOffset");
        // strokeParameter
        var subTitle_strokeParameter=document.createElement('div');
        rsb.appendHTML_Child(subTitle_strokeParameter);
        subTitle_strokeParameter.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>Stroke parameter</h5>";
        //  createSelectionOptions(title,configObject,"strokeElement",["true","false"]);
        // createSelectionOptions(title,configObject,"strokeStyle",["solid","dashed","dotted"]);
        // createSpinOption(title,configObject,"strokeWidth");
        // createShapeColor(title,configObject,["strokeColor"]);

        createDynamicBooleanSelection(title,configObject,"strokeElement",function(title,configObject,eventHidderId){
            createSelectionOptions(title,configObject,"strokeStyle",["solid","dashed","dotted"],eventHidderId);
            createSpinOption(title,configObject,"strokeWidth",eventHidderId);
            createShapeColor(title,configObject,["strokeColor"],eventHidderId);
        });





        if (configObject.link_strokeWidth){
            // add linkParameters;
            var subTitle_linkParameters=document.createElement('div');
            rsb.appendHTML_Child(subTitle_linkParameters);
            subTitle_linkParameters.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>Link parameter</h5>";
            createSelectionOptions(title,configObject,"link_strokeStyle",["solid","dashed","dotted"]);
            createSpinOption(title,configObject,"link_strokeWidth");
            createShapeColor(title,configObject,["link_strokeColor","link_hoverColor"]);

            createDynamicBooleanSelection(title,configObject,"link_arrowHead",function(title,configObject,eventHidderId){
                    createSelectionOptions(title,configObject,"link_arrowHead_renderingType",["triangle","diamond"],eventHidderId);
                    createSpinOption(title,configObject,"link_arrowHead_scaleFactor",eventHidderId);
                    createSpinOption(title,configObject,"link_arrowHead_strokeWidth",eventHidderId);
                    createSelectionOptions(title,configObject,"link_arrowHead_strokeStyle",["solid","dashed","dotted"],eventHidderId);
                    createShapeColor(title,configObject,["link_arrowHead_strokeColor","link_arrowHead_fillColor"],eventHidderId);
                }
            )
        }

        // fontParameters;
        var subTitle_fontParameters=document.createElement('div');
        rsb.appendHTML_Child(subTitle_fontParameters);
        subTitle_fontParameters.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>Font parameter</h5>";
        createLineEditOption(title,configObject,["fontFamily"]);
        createShapeColor(title,configObject,["fontColor"]);
        createSpinOption(title,configObject,"fontSize");




        // hoverInParameters .. [hoverInColor]
        var cursorArray= ["alias"
            ,"all-scroll"
            ,"auto"
            ,"cell"
            ,"context-menu"
            ,"col-resize"
            ,"copy"
            ,"crosshair"
            ,"default"
            ,"e-resize"
            ,"ew-resize"
            ,"grab"
            ,"grabbing"
            ,"help"
            ,"move"
            ,"n-resize"
            ,"ne-resize"
            ,"nesw-resize"
            ,"ns-resize"
            ,"nw-resize"
            ,"nwse-resize"
            ,"no-drop"
            ,"none"
            ,"not-allowed"
            ,"pointer"
            ,"progress"
            ,"row-resize"
            ,"s-resize"
            ,"se-resize"
            ,"sw-resize"
            ,"text"
            ,"url"
            ,"w-resize"
            ,"wait"
            ,"zoom-in"
            ,"zoom-out"];

        var subTitle_hoverInParameters=document.createElement('div');
        rsb.appendHTML_Child(subTitle_hoverInParameters);
        subTitle_hoverInParameters.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>Hovering parameter</h5>";
        createSelectionOptions(title,configObject,"hoverInCursor",cursorArray);
        createShapeColor(title,configObject,["hoverInColor","hoverInStrokeColor","hoverInFontColor"]);
        createLineEditOption(title,configObject,["hoverInFontFamily"]);
        createSpinOption(title,configObject,"hoverInFontSize");


        if (configObject.defaultCollapsedDatatypes){
            var cdtHeader=document.createElement('div');
            rsb.appendHTML_Child(cdtHeader);
            cdtHeader.innerHTML="<h5 style='margin:5px 0 5px 0;text-align: center;background-color: royalblue;'>Collapsed Options</h5>";
            createSelectionOptions(title,configObject,"defaultCollapsedDatatypes",["true","false"]);
            createSelectionOptions(title,configObject,"allowDatatypeCollapseExpand",["true","false"]);
            createSelectionOptions(title,configObject,"defaultCollapsedLoops",["true","false"]);
            createSelectionOptions(title,configObject,"allowLoopCollapseExpand",["true","false"]);


        }




    }
    function redrawLeftSideElement(name){

        var nameInConfig=name;
        if (nameInConfig.indexOf(":")!==-1){
            nameInConfig=nameInConfig.replace(":","");
        }
        var aDiv=d3.select("#"+nameInConfig);
        var htmlContainer=aDiv.node().children;
        var numChildren=htmlContainer.length;
        for (var i=0;i<numChildren;i++){
            htmlContainer[0].remove();
        }
        lsb.drawElementAndConnect(aDiv,name,undefined,onClickFunction);

    }


    function clearLeftSideMenu(){
        lsb.clearMenuContainer();
        var b_cml = graphRenderer.elementsConfig.collapsedMultiLinkProperty,
            b_cdt = graphRenderer.elementsConfig.collapsedDatatypes,
            b_clp = graphRenderer.elementsConfig.collapsedLoops,
            b_dn  = graphRenderer.elementsConfig.defaultNodeElement,
            b_dp  = graphRenderer.elementsConfig.defaultPropertyElement,
            b_dd  = graphRenderer.elementsConfig.defaultDatatypeElement,
            b_nn  = graphRenderer.elementsConfig.nestedNode;

        graphRenderer.elementsConfig={};
        graphRenderer.elementsConfig.collapsedMultiLinkProperty=b_cml;
        graphRenderer.elementsConfig.collapsedDatatypes=b_cdt;
        graphRenderer.elementsConfig.collapsedLoops=b_clp;
        graphRenderer.elementsConfig.defaultNodeElement=b_dn;
        graphRenderer.elementsConfig.defaultPropertyElement=b_dp;
        graphRenderer.elementsConfig.defaultDatatypeElement=b_dd;
        graphRenderer.elementsConfig.nestedNode=b_nn;

        alreadyAddedElements=[];
        addDefaultElements();
        adjustSize();
    }


    function loadConfigFromJSON(){
        var hidden_FileInput=document.createElement('input');
        hidden_FileInput.id="HIDDEN_FILE_JSON_INPUT";
        hidden_FileInput.type="file";
        hidden_FileInput.accept = ".json , .ttl";
        hidden_FileInput.accept = ".json";
        //hidden_solutionInput.style.display="none";
        hidden_FileInput.autocomplete="off";
        hidden_FileInput.placeholder="load a json File";

        var loaderSolutionPathNode=d3.select(hidden_FileInput);
        var fileElement;
        var fileName;
        var readText;
        // simulate click event;
        hidden_FileInput.click();
        loaderSolutionPathNode.on("change",function (){
            var files= loaderSolutionPathNode.property("files");
            if (files.length>0) {
                // console.log("file?"+files[0].name);
                fileElement = files[0];
                fileName = fileElement.name;
                loaderSolutionPathNode.remove();

                if (fileElement.name.endsWith(".json")) {
                    // read this file;
                    var reader = new FileReader();
                    reader.readAsText(fileElement);
                    reader.onload = function () {
                        readText = reader.result;
                        // the the communication module about this
                        //  console.log("have read the text");
                        //  console.log(readText);
                        clearLeftSideMenu();
                        parseGizmoConfig(readText);
                    };
                }
                else{
                    var dialogBox=new graphRenderer.dialogBoxConstrucor(graphRenderer);
                    dialogBox.initialize("warning","Input file is not a JSON file. <br>TTL loading support is disabled in this version! (ISWC 2019 blind submission)");
                    graphRenderer.setDialogBox(dialogBox);
                }
            }
        });
    }

    function parseDatatypeAssertion(text){
        var jObj=JSON.parse(text);
        var classes=jObj.gizmoAnnotations;
        for (var i=0;i<classes.length;i++){
            var iri=classes[i].iri;
            var hashId=iri.lastIndexOf("#");
            var assertionPropertyId;
            if (hashId>0)
                assertionPropertyId= iri.substr(hashId+1);
            if (classes[i].annotations)
                createDatatypeValueMap(assertionPropertyId,classes[i]);

        }

    }
    function createDatatypeValueMap(pName,dtAssertion){

        if (dtAssertion===undefined) return;
        aDtMap[pName]=prefixedName(dtAssertion.annotations.assertionDatatypeValue);
    }

    function prefixedName(longName) {
        if (!longName) return "undefined";
        var prefixList={
            rdf:'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            rdfs:'http://www.w3.org/2000/01/rdf-schema#',
            owl:'http://www.w3.org/2002/07/owl#',
            xsd:'http://www.w3.org/2001/XMLSchema#',
            dc:'http://purl.org/dc/elements/1.1/#',
            xml:'http://www.w3.org/XML/1998/namespace'
        };


        for (var name in prefixList){
            if (prefixList.hasOwnProperty(name)){
                if (longName.indexOf(prefixList[name])===0){
                    var prefix=name;
                    var suffix=longName.split(prefixList[name])[1];
                    return prefix+":"+suffix;
                }
            }
        }



        if (longName.indexOf("http")===-1 && longName.indexOf(":")!==-1){
            var prefix=longName.split(":")[0];
            var suffix=longName.split(":")[1];
            if (prefixList.hasOwnProperty(prefix)){
                return prefix+suffix
            }
            return suffix;
        }
        return longName;

    }

    function parseGizmoConfig(text){
        clearLeftSideMenu();
        var jObj=JSON.parse(text);

        var header=jObj.header;
        var foundIRI=false;
        var foundPrefix=false;

        if (header){
            var iriForSpecification=header.iri;
            if (iriForSpecification){
                // try to find it in the prefixList;
                foundIRI=true;
                var prefixList=header.prefixList;
                if (prefixList){
                    for (var name in prefixList){
                        if (prefixList.hasOwnProperty(name)){
                            var tIri=prefixList[name];
                            if (tIri.indexOf(iriForSpecification)!==-1){
                                prefixInput.node().value=name;
                                iriInput.node().value=iriForSpecification;
                                foundPrefix=true;
                                break;
                            }
                        }
                    }
                }
            }
        }
        var classes=jObj.gizmoAnnotations;
        for (var i=0;i<classes.length;i++){
            var iri=classes[i].iri;
            // console.log(iri);
            var hashId=iri.lastIndexOf("#");
            var classId;
            if (hashId>0)
                classId= iri.substr(hashId+1);
            assignAnnotations(classId,classes[i].annotations);
        }

        redrawLeftSideElement("collapsedMultiLinkProperty");
        //  redrawLeftSideElement("collapsedDatatypes");
        //   redrawLeftSideElement("collapsedLoops");
        redrawLeftSideElement("nestedNode");

    }

    function assignAnnotations(element,annotations) {

        var target=annotations.targetElement;
        var prefixedObj=prefixedName(target);
        if (prefixedObj===target){
            var tokens=target.split("#");
            prefixedObj=tokens[1];
        }

        //remove :
        if (prefixedObj.indexOf(":")){
            prefixedObj=prefixedObj.replace(":","");
        }

        element=prefixedObj;


        if (annotations.isTypeOf==="gizmo:NotationAnnotationObject"){
            // parse the values;

            for (var notationProperty in annotations) {
                if (annotations.hasOwnProperty(notationProperty)) { // allow to add Values
                    notationsObject[notationProperty]=annotations[notationProperty];
                }
            }
            redrawNotationOptions();
            return;
        }

        var cfgObj=graphRenderer.elementsConfig[element];

        if (alreadyAddedElements.indexOf(element)===-1)
            cfgObj=undefined;
        var realNameElement=element;
        if (cfgObj===undefined){
            // backwards mapping
            // try to find the element name in nodes, properties, or datatypes
            var rnE_Index=-1;
            if (map_nodes.indexOf(element)!==-1) {
                rnE_Index = map_nodes.indexOf(element);
                realNameElement=nodes[rnE_Index];
            }
            if (map_properties.indexOf(element)!==-1) {
                rnE_Index = map_properties.indexOf(element);
                realNameElement=properties[rnE_Index];
            }
            if (map_datatypes.indexOf(element)!==-1) {
                rnE_Index = map_datatypes.indexOf(element);
                realNameElement=datatypes[rnE_Index];
            }
            addElement(realNameElement);
        }

        cfgObj=graphRenderer.elementsConfig[element]; // reload the values
        for (var cfgElement in annotations){
            if (annotations.hasOwnProperty(cfgElement)){ // allow to add Values
                // extract the name
                var newValue=annotations[cfgElement];

                if (cfgElement==="roundedCorner"){
                    // parse as array;
                    var tokens=newValue.split(",");
                    newValue=[parseInt(tokens[0]),parseInt(tokens[1])];

                }
                var oldValue=cfgObj[cfgElement];
                if (newValue!==oldValue) {
                    cfgObj[cfgElement] = newValue;
                }
            }
        }


        redrawLeftSideElement(realNameElement);
    }

    function getRealNameElement(objName){
        // map parent Element;
        var rnE_Index;
        var realNameElement=objName;
        if (map_nodes.indexOf(objName)!==-1) {
            rnE_Index = map_nodes.indexOf(objName);
            realNameElement=nodes[rnE_Index];
            if (realNameElement==="defaultNodeElement")
                realNameElement=prefixInput.node().value+":defaultNodeElement";
        }
        if (map_properties.indexOf(objName)!==-1) {
            rnE_Index = map_properties.indexOf(objName);
            realNameElement=properties[rnE_Index];
            if (realNameElement==="defaultPropertyElement")
                realNameElement=prefixInput.node().value+":defaultPropertyElement";
        }
        if (map_datatypes.indexOf(objName)!==-1) {
            rnE_Index = map_datatypes.indexOf(objName);
            realNameElement=datatypes[rnE_Index];
            if (realNameElement==="defaultDatatypeElement"){
                realNameElement=prefixInput.node().value+":defaultDatatypeElement";
            }
        }

        if (objName==="collapsedMultiLinkProperty") realNameElement=prefixInput.node().value+":collapsedMultiLinkProperty";
        if (objName==="collapsedDatatypes") realNameElement=prefixInput.node().value+":collapsedDatatypes";
        if (objName==="collapsedLoops") realNameElement=prefixInput.node().value+":collapsedLoops";
        if (objName==="nestedNode") realNameElement=prefixInput.node().value+":nestedNode";

        return realNameElement;
    }

    function filterProperties(objName, cfgObj){
        var propertyNamesAsArray=[];

        // special cases
        if (objName==="notationOptions") {
            propertyNamesAsArray.push("graphBgColor");
            propertyNamesAsArray.push("layoutAlgorithm");
            propertyNamesAsArray.push("applyNestedElements");
        }

        // special cases
        if (objName==="collapsedDatatypes" || objName==="collapsedLoops" || objName==="nestedNode"){
            // get the rendering type
            propertyNamesAsArray.push("renderingType");
            if (cfgObj.renderingType==="none"){
                return propertyNamesAsArray; // we dont need more;
            }

            if (cfgObj.renderingType==="inshape"){
                propertyNamesAsArray.push("inshapeType");
                if (cfgObj.inshapeType==="indicator"){
                    propertyNamesAsArray.push("inshapeIndicatorOffset");
                    propertyNamesAsArray.push("inshapeStrokeType");
                    propertyNamesAsArray.push("inshapeStrokeColor");
                    propertyNamesAsArray.push("inshapeStrokeStrokeWidth");
                }
                if (cfgObj.inshapeType==="segment"){
                    propertyNamesAsArray.push("segmentType");
                    propertyNamesAsArray.push("segmentStartAngle");
                    propertyNamesAsArray.push("segmentHeight");
                    propertyNamesAsArray.push("segmentOffset");
                    propertyNamesAsArray.push("showLabelInSegment");
                    propertyNamesAsArray.push("segmentLabelSize");
                    propertyNamesAsArray.push("segmentAdjustmentMargin");
                }
            }
            if (cfgObj.renderingType==="umlStyle"){
                propertyNamesAsArray.push("umlShapeAdjustsShapeSize");
                propertyNamesAsArray.push("umlElementScaleFactor");
                propertyNamesAsArray.push("umlHeightOffset");
                propertyNamesAsArray.push("umlOffsetToHeader");
                propertyNamesAsArray.push("umlOffsetToAfterLastElement");
                propertyNamesAsArray.push("umlMarginLeft");
                propertyNamesAsArray.push("umlMarginRight");
                propertyNamesAsArray.push("umlShowDatatypeProperty");
                propertyNamesAsArray.push("umlMarginBetween");
                propertyNamesAsArray.push("umlDrawHeaderLine");
                propertyNamesAsArray.push("umlHeaderAlign");
                propertyNamesAsArray.push("umlPropertyAlign");
                propertyNamesAsArray.push("umlNestElements");

            }
        }

        if (objName==="collapsedMultiLinkProperty" || map_properties.indexOf(objName)!==-1){

            propertyNamesAsArray.push("renderingType");
            propertyNamesAsArray.push("bgColor");

            // shape parameter
            if (cfgObj.renderingType==="rect"){
                propertyNamesAsArray.push("roundedCorner");
                propertyNamesAsArray.push("fontSizeOverWritesShapeSize");

                if (cfgObj.fontSizeOverWritesShapeSize==="true"){
                    propertyNamesAsArray.push("overWriteOffset");
                }else{
                    propertyNamesAsArray.push("width");
                    propertyNamesAsArray.push("height");
                }
            }
            if (cfgObj.renderingType==="circle"){
                propertyNamesAsArray.push("fontSizeOverWritesShapeSize");
                if (cfgObj.fontSizeOverWritesShapeSize==="true"){
                    propertyNamesAsArray.push("overWriteOffset");
                }else{
                    propertyNamesAsArray.push("radius");
                }

            }
            if (cfgObj.renderingType==="ellipse"){
                propertyNamesAsArray.push("fontSizeOverWritesShapeSize");
                if (cfgObj.fontSizeOverWritesShapeSize==="true"){
                    propertyNamesAsArray.push("overWriteOffset");
                }else{
                    propertyNamesAsArray.push("width");
                    propertyNamesAsArray.push("height");
                }
            }

            // stroke parameter for the property Shape;
            propertyNamesAsArray.push("strokeElement");
            if (cfgObj.strokeElement==="true"){
                propertyNamesAsArray.push("strokeStyle");
                propertyNamesAsArray.push("strokeWidth");
                propertyNamesAsArray.push("strokeColor");
            }


            // link parameter
            propertyNamesAsArray.push("link_strokeStyle");
            propertyNamesAsArray.push("link_strokeWidth");
            propertyNamesAsArray.push("link_strokeColor");
            propertyNamesAsArray.push("link_hoverColor");
            propertyNamesAsArray.push("link_arrowHead");
            propertyNamesAsArray.push("link_renderingType");

            if (cfgObj.link_arrowHead==="true"){
                propertyNamesAsArray.push("link_arrowHead_renderingType");
                propertyNamesAsArray.push("link_arrowHead_scaleFactor");
                propertyNamesAsArray.push("link_arrowHead_strokeWidth");
                propertyNamesAsArray.push("link_arrowHead_strokeStyle");
                propertyNamesAsArray.push("link_arrowHead_strokeColor");
                propertyNamesAsArray.push("link_arrowHead_fillColor");
            }

            // font parameter ;
            propertyNamesAsArray.push("fontFamily");
            propertyNamesAsArray.push("fontColor");
            propertyNamesAsArray.push("fontSize");


            // hoverIn Parameter
            propertyNamesAsArray.push("hoverInCursor");
            propertyNamesAsArray.push("hoverInColor");
            propertyNamesAsArray.push("hoverInStrokeColor");
            propertyNamesAsArray.push("hoverInFontColor");
            propertyNamesAsArray.push("hoverInFontFamily");
            propertyNamesAsArray.push("hoverInFontSize");
        }



        if (objName==="defaultNodeElement" ||objName==="defaultDatatypeElement" || map_nodes.indexOf(objName)!==-1 || map_datatypes.indexOf(objName)!==-1){
            propertyNamesAsArray.push("renderingType");
            propertyNamesAsArray.push("bgColor");

            if (!(objName==="defaultDatatypeElement") && !(map_datatypes.indexOf(objName)!==-1)) {
                propertyNamesAsArray.push("defaultCollapsedDatatypes");
                propertyNamesAsArray.push("allowDatatypeCollapseExpand");
                propertyNamesAsArray.push("defaultCollapsedLoops");
                propertyNamesAsArray.push("allowLoopCollapseExpand");
            }



            // shape parameter
            if (cfgObj.renderingType==="rect"){
                propertyNamesAsArray.push("roundedCorner");
                propertyNamesAsArray.push("fontSizeOverWritesShapeSize");

                if (cfgObj.fontSizeOverWritesShapeSize==="true"){
                    propertyNamesAsArray.push("overWriteOffset");
                }else{
                    propertyNamesAsArray.push("width");
                    propertyNamesAsArray.push("height");
                }
            }
            if (cfgObj.renderingType==="circle"){
                propertyNamesAsArray.push("fontSizeOverWritesShapeSize");
                if (cfgObj.fontSizeOverWritesShapeSize==="true"){
                    propertyNamesAsArray.push("overWriteOffset");
                }else{
                    propertyNamesAsArray.push("radius");
                }

            }
            if (cfgObj.renderingType==="ellipse"){
                propertyNamesAsArray.push("fontSizeOverWritesShapeSize");
                if (cfgObj.fontSizeOverWritesShapeSize==="true"){
                    propertyNamesAsArray.push("overWriteOffset");
                }else{
                    propertyNamesAsArray.push("width");
                    propertyNamesAsArray.push("height");
                }
            }

            // stroke parameter for the property Shape;
            propertyNamesAsArray.push("strokeElement");
            if (cfgObj.strokeElement==="true"){
                propertyNamesAsArray.push("strokeStyle");
                propertyNamesAsArray.push("strokeWidth");
                propertyNamesAsArray.push("strokeColor");
            }


            // font parameter ;
            propertyNamesAsArray.push("fontFamily");
            propertyNamesAsArray.push("fontColor");
            propertyNamesAsArray.push("fontSize");


            // hoverIn Parameter
            propertyNamesAsArray.push("hoverInCursor");
            propertyNamesAsArray.push("hoverInColor");
            propertyNamesAsArray.push("hoverInStrokeColor");
            propertyNamesAsArray.push("hoverInFontColor");
            propertyNamesAsArray.push("hoverInFontFamily");
            propertyNamesAsArray.push("hoverInFontSize");

        }



        // end of special case for
        return propertyNamesAsArray;






    }

    function refactoredSaveAsTTL(){
        var currentConfig = graphRenderer.elementsConfig;

        // write preamble (prefix and stuff)
        var writingString;
        writingString = "@prefix "+prefixInput.node().value+": <"+iriInput.node().value+"#> . \n";
        writingString+= "@prefix owl: <http://www.w3.org/2002/07/owl#> .\n";
        writingString+= "@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n";
        writingString+= "@prefix xml: <http://www.w3.org/XML/1998/namespace> .\n";
        writingString+= "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n";
        writingString+= "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n";
        writingString+= "@prefix gizmo: <http://example.org/ontologies/gizmo-core#> .\n";
        writingString+= "@base <"+iriInput.node().value+"> .\n";
        writingString+= "<"+iriInput.node().value+"> rdf:type owl:Ontology ;\n";
        writingString+= "\t\t\t owl:imports <http://example.org/ontologies/gizmo-core> .\n";
        writingString+= "\n";


        writingString+= "\n#################################################################\n";
        writingString+= "# GIZMO Element Assignment \n";
        writingString+= "#################################################################\n";



        // add Notation Object;
        var addedElements=0;
        writingString+= "\n####---- Notation Options ----####\n";
        var notationIndividualName="notationOptions";
        writingString+=prefixInput.node().value+":notationOptions rdf:type owl:NamedIndividual ; \n";
        var notationProperties=filterProperties("notationOptions",notationsObject);
        var notationConstrutor="";
        for (var n=0;n<notationProperties.length;n++){
            var n_propName=notationProperties[n];
            var n_el = notationsObject[n_propName];
            var n_dtAssertion=aDtMap[n_propName];
            var n_writtenType="rdfs:Literal";
            if (n_dtAssertion) n_writtenType=n_dtAssertion;
            notationConstrutor+="         gizmo:"+n_propName+" "+'"'+n_el+'"^^'+n_writtenType+' ;\n';

            addedElements++;
        }

        notationConstrutor+="         gizmo:isTypeOf gizmo:NotationAnnotationObject .\n";

        writingString+=notationConstrutor;
        var tempArray=[];
        for (var x=0;x<alreadyAddedElements.length;x++){
            tempArray.push(alreadyAddedElements[x].replace(":",""))
        }

        for (var objName in currentConfig) {
            if (currentConfig.hasOwnProperty(objName) &&  tempArray.indexOf(objName)!==-1) {

                var elementConfig = currentConfig[objName];
                var realNameElement=getRealNameElement(objName);
                writingString+= "\n####---- "+realNameElement+" ----####\n";
                writingString+=prefixInput.node().value+":"+objName+" rdf:type owl:NamedIndividual ; \n";
                addedElements=0;

                // filter elements that are required for specific type;

                var filteredProperties=filterProperties(objName,elementConfig);
                var constructorDefinitionString="";
                for (var i=0;i<filteredProperties.length;i++){
                    var propName=filteredProperties[i];
                    var el = elementConfig[propName];
                    var dtAssertion=aDtMap[propName];
                    var writtenType="rdfs:Literal";
                    if (dtAssertion) writtenType=dtAssertion;
                    // if (addedElements===0){
                    //     constructorDefinitionString+=prefixInput.node().value+":"+objName+ " gizmo:"+propName+" "+'"'+el+'"^^'+writtenType+' ;\n';
                    // }else {
                    constructorDefinitionString+="         gizmo:"+propName+" "+'"'+el+'"^^'+writtenType+' ;\n';
                    // }
                    addedElements++;
                }
                constructorDefinitionString+="         gizmo:targetElement "+realNameElement+" ;\n";
                constructorDefinitionString+="         gizmo:isTypeOf gizmo:GlyphAnnotationObject ;\n";
                // adjust the last element;
                if (addedElements>0){ // unlikely to happen but lets do this anyways
                    // we want to adjust the constructorDefinitionString by removing ;\n and add .\n
                    var updatedCDS=constructorDefinitionString.slice(0,constructorDefinitionString.length-2);
                    updatedCDS+=".\n"; // << closing this element;
                    writingString+=updatedCDS;
                    // console.log(updatedCDS);
                }
            }
        }
        download(writingString, prefixInput.node().value+".ttl", "text/plain");
    }

    function saveCurrentConfigAsTTL() {
        // general idea: we define first all annotation properties
        // then assign them to the individual rendering types;

        var currentConfig = graphRenderer.elementsConfig;

        // write preamble (prefix and stuff)
        var writingString;
        writingString = "@prefix "+prefixInput.node().value+": <"+iriInput.node().value+"#> . \n";
        writingString+= "@prefix owl: <http://www.w3.org/2002/07/owl#> .\n";
        writingString+= "@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n";
        writingString+= "@prefix xml: <http://www.w3.org/XML/1998/namespace> .\n";
        writingString+= "@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n";
        writingString+= "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n";
        writingString+= "@prefix gizmo: <http://example.org/ontologies/gizmo-core#> .\n";
        writingString+= "@base <"+iriInput.node().value+"> .\n";
        writingString+= "<"+iriInput.node().value+"> rdf:type owl:Ontology; \n";
        writingString+= "\t\t\t owl:imports http://example.org/ontologies/gizmo-core . \n";


        writingString+= "\n";
        // writingString+= "#################################################################\n";
        // writingString+= "# GIZMO Annotation properties\n";
        // writingString+= "#################################################################\n";
        //
        // var arrayOfSeenAnnotations=[];
        // for (var objName in currentConfig) {
        //     if (currentConfig.hasOwnProperty(objName)) {
        //         if (objName === "defaultNodeElement" || objName === "defaultDatatypeElement" ||
        //             objName === "defaultPropertyElement") {
        //             console.log(objName + " -> Skipped");
        //             continue;
        //         }
        //         var elementConfig = currentConfig[objName];
        //
        //         for (var propName in elementConfig) {
        //             if (elementConfig.hasOwnProperty(propName)) {
        //                 if (arrayOfSeenAnnotations.indexOf(propName)==-1){
        //                     // add this as an annotation property;
        //                     arrayOfSeenAnnotations.push(propName);
        //                     writingString+="gizmo:"+propName+" rdf:type owl:AnnotationProperty. \n";
        //                     // todo: figure out additional comments and stuff;
        //                 }
        //             }
        //         }
        //     }
        // }
        //  console.log(writingString);

        // assingn now to the given OWL constructors the annotations;

        writingString+= "\n#################################################################\n";
        writingString+= "# GIZMO Element Assignment \n";
        writingString+= "#################################################################\n";
        var addedElements=0;
        for (var objName in currentConfig) {
            if (currentConfig.hasOwnProperty(objName)) {
                // if (objName === "defaultNodeElement" || objName === "defaultDatatypeElement" ||
                //     objName === "defaultPropertyElement") {
                //     console.log(objName + " -> Skipped");
                //     continue;
                // }
                var elementConfig = currentConfig[objName];
                // map parent Element;
                var rnE_Index;
                var realNameElement=objName;
                if (map_nodes.indexOf(objName)!==-1) {
                    rnE_Index = map_nodes.indexOf(objName);
                    realNameElement=nodes[rnE_Index];
                    if (realNameElement==="defaultNodeElement")
                        realNameElement=prefixInput.node().value+":defaultNodeElement";
                }
                if (map_properties.indexOf(objName)!==-1) {
                    rnE_Index = map_properties.indexOf(objName);
                    realNameElement=properties[rnE_Index];
                    if (realNameElement==="defaultPropertyElement")
                        realNameElement=prefixInput.node().value+":defaultPropertyElement";
                }
                if (map_datatypes.indexOf(objName)!==-1) {
                    rnE_Index = map_datatypes.indexOf(objName);
                    realNameElement=datatypes[rnE_Index];
                    if (realNameElement==="defaultDatatypeElement"){
                        realNameElement=prefixInput.node().value+":defaultDatatypeElement";
                    }
                }

                if (objName==="collapsedMultiLinkProperty") realNameElement=prefixInput.node().value+":collapsedMultiLinkProperty";
                if (objName==="collapsedDatatypes") realNameElement=prefixInput.node().value+":collapsedDatatypes";
                if (objName==="collapsedLoops") realNameElement=prefixInput.node().value+":collapsedLoops";

                console.log("Mapping "+objName+" To->  "+realNameElement);
                writingString+= "\n####---- "+realNameElement+" ----####\n";
                writingString+=prefixInput.node().value+":"+objName+" rdf:type owl:NamedIndividual . \n";
                addedElements=0;
                var constructorDefinitionString="";
                for (var propName in elementConfig) {
                    if (elementConfig.hasOwnProperty(propName)) {
                        var el = elementConfig[propName];

                        var dtAssertion=aDtMap[propName];
                        var writtenType="rdfs:Literal";
                        if (dtAssertion)
                            writtenType=dtAssertion;
                        if (addedElements===0){
                            // use the object defenition
                            constructorDefinitionString+=prefixInput.node().value+":"+objName+ " gizmo:"+propName+" "+'"'+el+'"^^'+writtenType+' ;\n';
                        }
                        else {
                            constructorDefinitionString+="         gizmo:"+propName+" "+'"'+el+'"^^'+writtenType+' ;\n';
                        }
                        addedElements++;
                    }
                }
                constructorDefinitionString+="         gizmo:targetElement "+realNameElement+" ;\n";
                // adjust the last element;
                if (addedElements>0){ // unlikely to happen but lets do this anyways

                    // we want to adjust the constructorDefinitionString by removing ;\n and add .\n
                    var updatedCDS=constructorDefinitionString.slice(0,constructorDefinitionString.length-2);
                    updatedCDS+=".\n"; // << closing this element;
                    writingString+=updatedCDS;
                    console.log(updatedCDS);
                }

            }
        }








        download(writingString, "helloWorld.ttl", "text/plain");
    }

    function refactoredSaveCurrentConfigAsJSON(){
        var currentConfig=  graphRenderer.elementsConfig;
        var writingString='{\n';
        writingString+='"header" : {\n';
        writingString+='"baseIris" : [ "http://www.w3.org/2000/01/rdf-schema", "http://www.w3.org/2001/XMLSchema" ],\n';
        writingString+='"prefixList" : {\n';
        writingString+='"owl" : "http://www.w3.org/2002/07/owl#",\n';
        writingString+='"rdf" : "http://www.w3.org/1999/02/22-rdf-syntax-ns#",\n';
        writingString+='"gizmo" : "http://example.org/ontologies/gizmo-core#",\n';
        writingString+='"'+prefixInput.node().value+'" : "'+iriInput.node().value+'#",\n';
        writingString+='"xsd" : "http://www.w3.org/2001/XMLSchema#",\n';
        writingString+='"xml" : "http://www.w3.org/XML/1998/namespace",\n';
        writingString+='"rdfs" : "http://www.w3.org/2000/01/rdf-schema#"\n';
        writingString+='},\n';
        writingString+='"iri" : "'+iriInput.node().value+'"\n';
        writingString+='},\n';
        writingString+='"gizmoAnnotations" : [ \n';


        // add Notation Object;
        writingString += '{\n"iri" : "'+iriInput.node().value+'#notationOptions",\n';
        writingString += '"annotations" : {\n';
        var notationConstrutor="";
        var notationProperties=filterProperties("notationOptions",notationsObject);

        for (var n=0;n<notationProperties.length;n++){
            var n_propName=notationProperties[n];
            var n_el = notationsObject[n_propName];
            var n_dtAssertion=aDtMap[n_propName];
            var n_writtenType="rdfs:Literal";
            if (n_dtAssertion) n_writtenType=n_dtAssertion;
            notationConstrutor +='"'+n_propName+'" : "'+n_el+'",\n';


        }
        notationConstrutor += '"isTypeOf" : "gizmo:NotationAnnotationObject"\n}\n},';


        writingString+=notationConstrutor;

        //go through the filtered objects;

        var tempArray=[];
        for (var x=0;x<alreadyAddedElements.length;x++){
            tempArray.push(alreadyAddedElements[x].replace(":",""))
        }


        for (var objName in currentConfig) {

            if (currentConfig.hasOwnProperty(objName) &&   tempArray.indexOf(objName)!==-1) {
                var elementConfig = currentConfig[objName];
                var realNameElement=getRealNameElement(objName);


                writingString += '{\n"iri" : "'+iriInput.node().value+'#'+objName+'",\n';
                writingString += '"annotations" : {\n';
                var constructorDefinitionString = '';
                var filteredProperties=filterProperties(objName,elementConfig);

                for (var i=0;i<filteredProperties.length;i++){
                    var propName=filteredProperties[i];
                    var el = elementConfig[propName];
                    constructorDefinitionString +='"'+propName+'" : "'+el+'",\n';
                }

                constructorDefinitionString += '"isTypeOf" : "gizmo:GlyphAnnotationObject",\n';
                constructorDefinitionString += '"targetElement" : "' + realNameElement + '"\n}\n},';

                writingString+=constructorDefinitionString;
            }

        }
        var updatedCDS = writingString.slice(0, writingString.length - 1);
        updatedCDS += "]\n}"; // << closing this element;
        writingString=updatedCDS;
        download(writingString,prefixInput.node().value+".json","text/plain");



    }

    function saveCurrentConfigAsJSON(){
        var currentConfig=  graphRenderer.elementsConfig;
        //  console.log("Parsing new Config");
        var writingString='{\n'+
            '"classAttribute":[ \n';
        var addedElements=0;
        var tempArray=[];
        for (var x=0;x<alreadyAddedElements.length;x++){
            tempArray.push(alreadyAddedElements[x].replace(":",""))
        }

        for (var objName in currentConfig){
            if (currentConfig.hasOwnProperty(objName) &&   tempArray.indexOf(objName)!==-1) {

                if (objName === "defaultNodeElement" || objName === "defaultDatatypeElement" ||
                    objName === "defaultPropertyElement"  ){
                    console.log(objName+" -> Skipped");
                    continue;
                }
                var elementConfig=currentConfig[objName];
                writingString+='\t{ \n';
                writingString+='\t"iri" : "'+iriInput.node().value+'"#"+'+objName+'",\n';
                writingString+='\t"annotations" : {\n';
                for (var propName in elementConfig){
                    if (elementConfig.hasOwnProperty(propName )) {
                        var el=elementConfig[propName];
                        //  console.log("Type of element "+ propName+ " is "+ typeof el);
                        writingString+= '\t\t"'+propName+'":[{';
                        if (typeof el === "string") {
                            writingString += '"value":"' + el + '"}], \n';
                        }
                        if (typeof el === "number") {
                            writingString += '"value":' + el + '}], \n';
                        }
                        if (typeof el === "object") { // assume it is an array
                            if (el.constructor === Array)
                                writingString += '"value":[' + el + ']}], \n';
                        }
                    }
                }
                writingString=writingString.slice(0,writingString.length-3);
                writingString+='\t\t}\n\t},';

                //     strokeWidth" : [ {
                //     "identifier" : "strokeWidth",
                //         "language" : "undefined",
                //         "value" : "2px",
                //         "type" : "label"
                // } ],



                //    console.log(elementConfig);
                addedElements++;
            }
        }
        writingString=writingString.slice(0,writingString.length-1);
        writingString+='] \n }';
        //  console.log(writingString);
        download(writingString,prefixInput.node().value+".json","text/plain");



    }

    function download(data, filename, type) {
        var file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob) // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else { // Others
            var a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }

}();
