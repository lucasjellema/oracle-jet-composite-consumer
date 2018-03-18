define(
    ['ojs/ojcore', 'knockout', 'jquery', 'input-country/ol', 'ojs/ojbutton', 'ojs/ojpopup'], function (oj, ko, $, ol) {
        'use strict';

        function InputCountryComponentModel(context) {
            var self = this;
            // save a reference to the unique identity of the composite component instance - also used in generating the element id values in view.html
            // see https://blogs.oracle.com/groundside/jet-composite-components-xvii-beware-the-ids for reference 
            self.unique = context.unique;
            self.composite = context.element;

            self.popupFirstTime = true;
            self.openPopup = function () {
                $('#countrySelectionPopup' + self.unique).ojPopup("open");
                // if the map has not yet been initialized, then do the initialization now (this is the case the first time the popup opens)
                if (!self.map) initMap();
                // set the currently selected country - but only if this is not the first time the popup opens (and we can be sure that the country vector has been loaded)
                // note: as soon as the vector has finished loading, a listener fires () and sets the currently selected country ; see var listenerKey in function initMap();
                if (!self.popupFirstTime) {
                    self.selectInteraction.getFeatures().clear();
                    if (self.properties['countryName'])
                        self.setSelectedCountry(self.properties['countryName'])
                } else
                    self.popupFirstTime = false;
            }//openPopup

            self.setSelectedCountry = function (country) {
                //programmatic selection of a feature; based on the name, a feature is searched for in countriesVector and when found is highlighted
                var countryFeatures = self.countriesVector.getFeatures();
                var c = self.countriesVector.getFeatures().filter(function (feature) { return feature.values_.name == country });
                self.selectInteraction.getFeatures().push(c[0]);
            }

            context.props.then(function (propertyMap) {
                //Store a reference to the properties for any later use
                self.properties = propertyMap;
                //Parse your component properties here 

                // property countrySelectionHandler may contain a function to be called when a country has been selected by the user
                self.callbackHandler = self.properties['countrySelectionHandler'];
            });

            self.raiseCountrySelectedEvent = function (countryName, countryCode) {
                var eventParams = {
                    'bubbles': true,
                    'cancelable': false,
                    'detail': {
                        'countryName': countryName
                        , 'countryCode': countryCode
                    }
                };
                //Raise the custom event
                self.composite.dispatchEvent(new CustomEvent('countrySelected',
                    eventParams));
            }


            // this function writes the selected country name to the two way bound countryName property, calls the callback function and publishes the countrySelected event
            // (based on the currently selected country in self.countrySelection)
            self.save = function () {
                if (self.countrySelection && self.countrySelection.name) {
                    // set selected country name on the observable
                    self.properties['countryName'] = self.countrySelection.name;
                    // notify the world about this change
                    if (self.callbackHandler) { self.callbackHandler(self.countrySelection.name, self.countrySelection.code) }
                    // report the country selection event
                    self.raiseCountrySelectedEvent(self.countrySelection.name, self.countrySelection.code);
                }
                // close popup
                $('#countrySelectionPopup' + self.unique).ojPopup("close");
            }//save

            self.startAnimationListener = function (data, event) {
                var ui = event.detail;
                if (!$(event.target).is("#countrySelectionPopup" + self.unique))
                    return;

                if ("open" === ui.action) {
                    event.preventDefault();
                    var options = { "direction": "top" };
                    oj.AnimationUtils.slideIn(ui.element, options).then(ui.endCallback);
                    // if the map has not yet been initialized, then do the initialization now (this is the case the first time the popup opens)
                    if (!self.map) initMap();

                }
                else if ("close" === ui.action) {
                    event.preventDefault();
                    ui.endCallback();
                }
            }

            function initMap() {
                var style = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.6)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#319FD3',
                        width: 1
                    }),
                    text: new ol.style.Text()
                }); //style


                self.countriesVector = new ol.source.Vector({
                    url: require.toUrl('input-country/countries.geo.json'),
                    format: new ol.format.GeoJSON()
                });
                // register a listener on the vector; as soon as it has loaded, we can select the feature for the currently selected country
                var listenerKey = self.countriesVector.on('change', function (e) {
                    if (self.countriesVector.getState() == 'ready') {
                        // and unregister the "change" listener 
                        ol.Observable.unByKey(listenerKey);
                        if (self.properties['countryName'])
                            self.setSelectedCountry(self.properties['countryName'])
                    }
                });

       
                self.map = new ol.Map({
                    layers: [
                        new ol.layer.Vector({
                            id: "countries",
                            renderMode: 'image',
                            source: self.countriesVector,
                            style: function (feature) {
                                style.getText().setText(feature.get('name'));
                                return style;
                            }
                        })
                        ,
                        new ol.layer.Tile({
                            id: "world",
                            source: new ol.source.OSM()
                        })
                        // , new ol.layer.Vector({
                        //     id: "cities",
                        //     renderMode: 'image',
                        //     source: new ol.source.Vector({
                        //         url: 'js/jet-composites/input-country/cities.geojson',
                        //         format: new ol.format.GeoJSON()
                        //     }),
                        // })                        
                    ],
                    target: 'mapContainer'+self.unique,
                    view: new ol.View({
                        center: [0, 0],
                        zoom: 2
                    })
                });

                // define the style to apply to selected countries
                var selectCountryStyle = new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#ff0000',
                        width: 2
                    })
                    , fill: new ol.style.Fill({
                        color: 'red'
                    })
                });
                self.selectInteraction = new ol.interaction.Select({
                    condition: ol.events.condition.singleClick,
                    toggleCondition: ol.events.condition.shiftKeyOnly,
                    layers: function (layer) {
                        return layer.get('id') == 'countries';
                    },
                    style: selectCountryStyle

                });

                self.map.getInteractions().extend([self.selectInteraction]);

                // add an event handler to the interaction
                self.selectInteraction.on('select', function (e) {
                    //to ensure only a single country can be selected at any given time
                    // find the most recently selected feature, clear the set of selected features and add the selected the feature (as the only one)
                    var f = self.selectInteraction.getFeatures()
                    var selectedFeature = f.getArray()[f.getLength() - 1]
                    self.selectInteraction.getFeatures().clear();
                    self.selectInteraction.getFeatures().push(selectedFeature);
                    self.countrySelection = { "code": selectedFeature.id_, "name": selectedFeature.values_.name };
                });


                // layer to hold (and highlight) currently hovered over highlighted (not yet selected) feature(s) 
                var featureOverlay = new ol.layer.Vector({
                    source: new ol.source.Vector(),
                    map: self.map,
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#f00',
                            width: 1
                        }),
                        fill: new ol.style.Fill({
                            color: 'rgba(255,0,0,0.1)'
                        })
                    })
                });

                var highlight;

                // function to get hold of the feature under the current mouse position;
                // the country associated with that feature is displayed in the info box
                // the feature itself is highlighted (added to the featureOverlay defined just ovehead)
                var displayFeatureInfo = function (pixel) {
                    var feature = self.map.forEachFeatureAtPixel(pixel, function (feature) {
                        return feature;
                    });

                    var info = document.getElementById('countryInfo'+self.unique);
                    if (feature) {
                        info.innerHTML = feature.getId() + ': ' + feature.get('name');
                    } else {
                        info.innerHTML = '&nbsp;';
                    }

                    if (feature !== highlight) {
                        if (highlight) {
                            featureOverlay.getSource().removeFeature(highlight);
                        }
                        if (feature) {
                            featureOverlay.getSource().addFeature(feature);
                        }
                        highlight = feature;
                    }

                };

                self.map.on('pointermove', function (evt) {
                    if (evt.dragging) {
                        return;
                    }
                    var pixel = self.map.getEventPixel(evt.originalEvent);
                    displayFeatureInfo(pixel);
                });


                // handle the singleclick event- in case a country is clicked that is already selected
                self.map.on('singleclick', function (evt) {
                    var feature = self.map.forEachFeatureAtPixel(evt.pixel,
                        function (feature, layer) {
                            var clickCountrySelection = { "code": feature.id_, "name": feature.values_.name };
                            if (self.countrySelection && self.countrySelection.name && (self.countrySelection.name == clickCountrySelection.name)) {
                                // the current selection is confirmed (clicked on a second time). We interpret this as: Save the selected country and close the popup  
                                self.save();
                                return;
                            }
                            return [feature, layer];
                        });
                });



            }//initMap
        };

        //Lifecycle methods - uncomment and implement if necessary 
        //ExampleComponentModel.prototype.activated = function(context){
        //};

        //ExampleComponentModel.prototype.attached = function(context){
        //};

        //ExampleComponentModel.prototype.bindingsApplied = function(context){
        //};

        //ExampleComponentModel.prototype.detached = function(context){
        //};

        return InputCountryComponentModel;
    });