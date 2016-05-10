/*
 * Copyright 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This module manages the properties viewer for Flo, showing detailed information on supported
 * properties for modules and enabling them to be edited to new values.
 * 
 * Events coming out of here:
 * 'change' - something changed!
 */
define(function(require) {
	'use strict';

	var _ = require('underscore');
    
	var CodeMirror = require('codemirror');
	
	require('codemirror/addon/mode/loadmode');
    require('codemirror/addon/edit/matchbrackets');
    require('codemirror/addon/edit/closebrackets');
	
	// languages
	require('codemirror/mode/groovy/groovy');
	require('codemirror/mode/javascript/javascript');
	require('codemirror/mode/python/python');
	require('codemirror/mode/clike/clike'); // for Java
	
	CodeMirror.modeURL = 'codemirror/mode/%N/%N';
	
	return function(domContext, metamodelService) {
		
		function cellTitle(cell, newValue) {
			var titleAttr = cell.attr('metadata/metadata/titleProperty') ? cell.attr('metadata/metadata/titleProperty') : '.label/text';
			if (newValue === undefined) {
				return cell.attr(titleAttr);
			} else {
				cell.attr(titleAttr, newValue);
			}
		}
		        
        // TODO more home grown eventing, remove!
        
		var triggerFns = {};
		
		function on(triggerEvent, fn) {
			var triggers = triggerFns[triggerEvent];
			if (!triggers) {
				triggers = [];
				triggerFns[triggerEvent] = triggers;
			}
			triggers.push(fn);				
		}
		
		function trigger(triggerEvent) { 
			var triggers = triggerFns[triggerEvent];
			if (triggers) {
				for (var i=0;i<triggers.length;i++) {
					triggers[i]();
				}
			}
		}
        
		function isTitleReadOnly(cell) {
			var titleAttr = cell.attr('metadata/metadata/titleProperty') ? cell.attr('metadata/metadata/titleProperty') : '.label/text';
			return titleAttr.indexOf('metadata') === 0;
		}
		
		function isApplicableFor(cellview) {
			return cellview && cellview.model && cellview.model.attr('metadata') &&
				   !cellview.model.attr('metadata/metadata/noEditableProps') && !cellview.model.attr('metadata/unresolved');
		}
        
        function setVisible(visible) {
			if (visible) {
				$('#properties', domContext).height('calc(30% - 1px)');
				$('#paper', domContext).height('70%');
			} else {
				$('#properties', domContext).height('0%');
				$('#paper', domContext).height('100%');
			}
		}
        
		/**
		 * Check if the properties view is currently being displayed. Optionally an element Id can
		 * be passed and if so this function will only return true if the properties view is
		 * open *and* it is displaying the properties for the specified element.
		 */
		function isVisible(optionalElementId) {
			if (optionalElementId) {
				if ($('#properties', domContext).height()===0) {
					return false;
				}
				var currentlyDisplayedElementId = $('#properties').attr('elementId');
				return currentlyDisplayedElementId === optionalElementId;
			} else {
				return $('#properties', domContext).height();
			}
		}

		function togglePropertiesView(cellview) {
			if (isApplicableFor(cellview)) {
				// change state of properties view
				// TODO crude because not detecting 'double click' just detecting a second press sometime later
				var displayState = isVisible();
				setVisible(!displayState);
			}
		}

		function resize() {
//			$('#properties', domContext).offset({left:$('#paper', domContext).position().left+$('#paper', domContext).width()+25-400});
//			$('#properties', domContext).offset({top:$('#paper', domContext).position().top+$('#paper', domContext).height()-$('#properties', domContext).height()-5});
		}
        
		function moveTooltip(x, y, offsetChoice) {
//    		var ppcPos = $('#properties', domContext).size();
			var mx = x;
	        var my = y;
	        if (offsetChoice === 'topleft') {
	        	mx = mx + 10; /*- $('.node-tooltip', domContext).width();*/
	        	my = my - 25 - $('.node-tooltip').height();
	        }
	        $('.node-tooltip').css({ top: my, left: mx });
		}
        
		function closeTooltip() {
			$('.node-tooltip').remove();
		}

		function createTooltip(tooltipText, x, y, offsetChoice) {
			var nodeTooltip = document.createElement('div');
			$(nodeTooltip).addClass('node-tooltip');
			// TODO as general purpose, append it somewhere else
			$(nodeTooltip).appendTo('body').fadeIn('fast');
    		$(nodeTooltip).addClass('tooltip-description');
			var nodeDescription = document.createElement('div');
			$(nodeDescription).text(tooltipText);
			$(nodeTooltip).append(nodeDescription);
			moveTooltip(x,y,offsetChoice);
		}
						
		function attachTooltip(element, text) {
			if (text) {
				$(element).mouseenter(function(evt) {
					createTooltip(text,evt.pageX,evt.pageY,'topleft');
				});
				$(element).mousemove(function(evt) {
					moveTooltip(evt.pageX,evt.pageY,'topleft');
				});
				$(element).mouseleave(function() {
					closeTooltip();
				});
			}
		}
        
		function addNewPropertyKeyValue(cellview, key, newvalue) {
			cellview.model.attr('props/' + key, newvalue);
//			$('#properties', domContext).trigger('property-change');
//			paper.trigger('resync-required');
			trigger('change');
		}
		
		function addNewPropertyRow(table, cellview, rowNum) {
			// Final row is where new properties can be added			
			var row = document.createElement('tr');
			rowNum++;
			if ((rowNum % 2)===1) {
				$(row).addClass('properties-row-even');
			} else {
				$(row).addClass('properties-row-odd');
			}
			$(table).append(row);
			var keytext = document.createElement('input');
			$(keytext).addClass('properties-input');
			$(keytext).val('...');
			$(keytext).addClass('properties-new-property');
			if ((rowNum%2)===1) {
				$(keytext).addClass('properties-row-text-even');
			} else {
				$(keytext).addClass('properties-row-text-odd');
			}

			var key = document.createElement('td');
			$(key).addClass('properties-key');
			key.appendChild(keytext);
			$(row).append(key);
			// TODO do something special when typing in the 'new key' row

			var value = document.createElement('td');
			var valuetext = document.createElement('input');
			$(valuetext).addClass('properties-input');
			$(valuetext).val('...');
			$(valuetext).addClass('properties-new-property');
			if ((rowNum % 2)===1) {
				$(valuetext).addClass('properties-row-text-even');
			} else {
				$(valuetext).addClass('properties-row-text-odd');
			}

			$(value).addClass('properties-value');
//			$(value).on('keyup',function(rowNumber,valueNode,evt) {
//				// cellview gives us the ID of the node that changed
//				// row gives us which entry in the properties list
//				var newKeyValue = $(valueNode).val();
//			}.bind(this,r,valuetext));

			value.appendChild(valuetext);
			$(row).append(value);
			
			$(keytext).on('focus',function(keyTextInputField, evt) { // jshint ignore:line
				console.log('properties: focus event on key in \'new value\' row');
				// Set it to blank so the user can start typing
				$(keyTextInputField).val('');
				$(this).val('placeholder');
				// Make them black and not gray for now
				$(keyTextInputField).removeClass('properties-new-property');
				$(this).removeClass('properties-new-property');
			}.bind(valuetext, keytext));
			
			$(key).on('keydown', function(rowNumber, keyTextInputField, cellview, evt) {
                if (evt.keyCode === 13) {
					var newKeyValue = $(keyTextInputField).val();
					if (newKeyValue === '') {
						// set it back to how it was...
						$(keyTextInputField).addClass('properties-new-property');
						$(this).addClass('properties-new-property');
						$(keyTextInputField).val('...');
						$(this).val('...');
					}
					else {
						addNewPropertyKeyValue(cellview, newKeyValue, $(this).val());
					} 
				}
			}.bind(valuetext, rowNum, keytext, cellview));

			
			$(key).on('focusout',function(rowNumber, keyTextInputField, cellview, evt) { // jshint ignore:line
				var newKeyValue = $(keyTextInputField).val();
				if (newKeyValue === '') {
					// set it back to how it was...
					$(keyTextInputField).addClass('properties-new-property');
					$(this).addClass('properties-new-property');
					$(keyTextInputField).val('...');
					$(this).val('...');				
				}
				else {
					addNewPropertyKeyValue(cellview, newKeyValue, $(this).val());
				}
			}.bind(valuetext, rowNum, keytext, cellview));
			
//			$(valuetext).on('keydown', function(rowNumber, keyTextInputField, cellview, evt) {
//				if (evt.keyCode == 13) {
//					var newKeyValue = $(keyTextInputField).val();
//					if (newKeyValue == '' || newKeyValue == '...') {
//						// set it back to how it was...
//						$(keyTextInputField).addClass('properties-new-property');
//						$(this).addClass('properties-new-property');
//						$(keyTextInputField).val('...');
//						$(this).val('...');				
//					}
//					else {
//						addNewPropertyKeyValue(cellview, newKeyValue, $(this).val());
//					}
//				}
//			}.bind(valuetext, r, keytext, cellview));
//			
//			$(valuetext).on('focusout',function(rowNumber, keyTextInputField, cellview, evt) {
//				var newKeyValue = $(keyTextInputField).val();
//				if (newKeyValue == '' || newKeyValue == '...') {
//					// set it back to how it was...
//					$(keyTextInputField).addClass('properties-new-property');
//					$(this).addClass('properties-new-property');
//					$(keyTextInputField).val('...');
//					$(this).val('...');				
//				}
//				else {
////					updateModelPropertyValue(cellview, key, null, newValue);
//		//OR?
//					addNewPropertyKeyValue(cellview, newKeyValue, $(this).val());
//				}
//			}.bind(valuetext, r, keytext, cellview));
		}
        
		function getDisplayDefaultValue(property) {
			if (property && property.defaultValue !== undefined && property.defaultValue !== null) {
				return property.defaultValue;
			}
			return '...';
		}
        

		function updateModelPropertyKey(cellview, oldkeyvalue, newkeyvalue) {
			var props = cellview.model.attr('props');
			if (newkeyvalue) {
				if (!props[newkeyvalue]) {
					props[newkeyvalue] = props[oldkeyvalue];
				}
			}
			delete props[oldkeyvalue];
//			$('#properties', domContext).trigger('property-change');
		}
		
		function updateModelPropertyValue(cellview, key, oldvalue, newvalue) {
			// var props = cellview.model.attr('props');
			var hasDefaultValue = false;
			var defaultValue;
			var propertyMetadata = cellview.model.attr('metadata/properties/'+key);
			if (propertyMetadata && propertyMetadata.defaultValue !== undefined && propertyMetadata.defaultValue !== null) {
				hasDefaultValue = true;
				defaultValue = propertyMetadata.defaultValue;
			}
			// Setting it back to original value (or blank, undefined or null - if no default value)
			if ((hasDefaultValue && newvalue === defaultValue) || newvalue === '' || newvalue === undefined || newvalue === null) {
				// trigger events listening in for a change
				cellview.model.removeAttr('props/'+key,{'propertyPath':'attrs/props/'+key});
			} else {
				cellview.model.attr('props/'+key,newvalue);
			}
//			$('#properties', domContext).trigger('property-change');
			trigger('change');//paper.trigger('resync-required');
		}
		
		/**
		 * Called when a selection is made or changed so that the properties view will correctly
		 * represent the properties set on the new selection.
		 */
		function updatePropertiesView(cellview) {
            /*jshint validthis:true */
			var propertiesNode = $('#properties', domContext);	
			if (!isApplicableFor(cellview)) {
				propertiesNode.empty();
				setVisible(false);
				return;
			}
			setVisible(true);
			var properties = cellview.model.attr('props');
//			propertiesNode.off('property-change');
//			propertiesNode.on('property-change',function(e) {
//				console.log("Event detected: property-change");
//				updatePropertiesView(cellview);
//			});
			var moduleName = cellTitle(cellview.model);
			
			var moduleSchema = cellview.model.attr('metadata');
			
			moduleSchema.get('properties').then(function(moduleSchemaProperties) {
				
				$(propertiesNode).empty();
				$(propertiesNode).attr('elementId',cellview.model.id);
				
				var nodename = document.createElement('input');
				if (isTitleReadOnly(cellview.model)) {
					$(nodename).prop('readonly', true);
				}
				$(nodename).addClass('properties-node-name');
				$(nodename).val(moduleName);
				
				moduleSchema.get('description').then(function(description) {
					attachTooltip(nodename, description);
				}, function(error) {
					if (error) {
						console.log(error);
					}
				});
				
				function processNewModuleName() {
					var currentValidModuleName = cellTitle(cellview.model);
					var newModuleName = $(this).val();
					if (newModuleName !== currentValidModuleName) {
						if (newModuleName === '') {
							// ignore trying to set it to blank, just reset it
							$(this).val(currentValidModuleName);
						} else {
							cellTitle(cellview.model, newModuleName);
//							$('#properties', domContext).trigger('property-change');
						}
					}
				}
				
				// Support editing of the module name - when the user presses ENTER
				$(nodename).on('keydown',function(cellview, originalModuleName, evt) {
					// TODO can't edit title of tap/namedchannel
					if (evt.keyCode === 13/*ENTER*/) {
						processNewModuleName.bind(this)();
					}
				}.bind(nodename, cellview, moduleName));
				// Support editing of the module name - when the user tabs out of the element
				$(nodename).on('focusout',function(cellview, originalModuleName, evt) { // jshint ignore:line
					processNewModuleName.bind(this)();
				}.bind(nodename, cellview, moduleName));

				// Build the table of key/value options
				var table = document.createElement('table');
				$(propertiesNode).append(table);
				
				$(table).width('100%');
				$(table).css('border', '0px');
				$(table).css('border-spacing', '0px');
				
				var row = document.createElement('tr');
				$(row).addClass('properties-node-name-row');
				var headerCell = document.createElement('th');
				headerCell.colSpan = 2;
				headerCell.appendChild(nodename);
				$(row).append(headerCell);	
				$(table).append(row);
				
				var rowNum = 0;
				
				// Special handling when a named channel has the channel property set, update the
				// label on the node in the graph (like taps, channel nodes include the channel
				// embedded in the icon)
//				function setNamedChannelLabel(namedChannel,value) {
//					// console.log("Named channel has channel updated to '"+value+"'");
//					var labelText = value;
//					if (value) {
//						var colonPos = value.indexOf(':');
//						if (colonPos !==-1) {
//							colonPos = value.indexOf(':',colonPos+1);
//							if (colonPos !== -1) {
//								labelText = value.substring(0,colonPos)+':\n'+value.substring(colonPos+1);
//							}
//						}
//					}
//					namedChannel.model.attr('.label2/text',labelText);
//				}
				

				function processPropertyKeyChange(checkKey, rowNumber, originalKeyValue, keyTextInputField, cellview, evt) {
					if (!checkKey || evt.keyCode === 13) {
						var newKeyValue = $(keyTextInputField).val();
						if (newKeyValue !== originalKeyValue) {
							console.log('properties: key changed from '+originalKeyValue+' to '+newKeyValue);
							updateModelPropertyKey(cellview, originalKeyValue, newKeyValue);
						}
						else {
							console.log('Key unchanged');
						}							
					}
				}
				function processNewPropertyValue(checkKey, rowNumber, key, valueTextInputField, cellview, evt) {
					if (!checkKey || evt.keyCode === 13) {
						// TODO need to search props for the key, it isn't a map like this - underscore helper?
						var originalValue = cellview.model.attr('props/' + key);
						var newValue = $(valueTextInputField).val();
						if (newValue !== originalValue) {
							console.log('properties: for key \''+key+'\' value changed from '+originalValue+' to '+newValue);
							if (_.isFunction(metamodelService.isValidPropertyValue)) {
								if (metamodelService.isValidPropertyValue(cellview.model, key, newValue)) {
									updateModelPropertyValue(cellview, key, originalValue, newValue);
								} else {
									updateModelPropertyValue(cellview, key, originalValue, originalValue);
								}
							} else {
								updateModelPropertyValue(cellview, key, originalValue, newValue);
							}
						}
						else {
							console.log('Value unchanged');
						}
					}
				}
				function processNewPropertyValueForCodeMirrorDoc(doc, key, cellview) {
						// TODO need to search props for the key, it isn't a map like this - underscore helper?
						var originalValue = cellview.model.attr('props/' + key);
						var newValue = doc.getValue();
						if (metamodelService && _.isFunction(metamodelService.encodeTextToDSL)) {
							newValue = metamodelService.encodeTextToDSL(newValue);
						}
						if (newValue !== originalValue) {
							console.log('properties: for key \''+key+'\' value changed from '+originalValue+' to '+newValue);
							if (_.isFunction(metamodelService.isValidPropertyValue)) {
								if (metamodelService.isValidPropertyValue(cellview.model, key, newValue)) {
									updateModelPropertyValue(cellview, key, originalValue, newValue);
								} else {
									updateModelPropertyValue(cellview, key, originalValue, originalValue);
								}
							} else {
								updateModelPropertyValue(cellview, key, originalValue, newValue);
							}
						}
						else {
							console.log('Value unchanged');
						}
				}
				
				rowNum = 0;
				if (properties) {
					Object.keys(properties).sort().forEach(function(propertyName) {
						if (propertyName === cellview.model.attr('metadata/metadata/titleProperty')) {
							// Ignore the title property. It'll be displayed at the top anyway
							return;
						}
						if (!properties[propertyName] || properties[propertyName] === moduleSchemaProperties[propertyName].defaultValue) {
							// Ignore properties equal to default value
							return;
						}
						var row = document.createElement('tr');
						if ((rowNum%2) === 0) {
							$(row).addClass('properties-row-even');
						} else {
							$(row).addClass('properties-row-odd');
						}
						$(table).append(row);
						var keytext = document.createElement('input');
						$(keytext).addClass('properties-input');
						
						if ((rowNum % 2) === 0) {
							$(keytext).addClass('properties-row-text-even');
						} else {
							$(keytext).addClass('properties-row-text-odd');
						}
						
                        var schemaProperty;
						if (moduleSchemaProperties && moduleSchemaProperties[propertyName]) {
							schemaProperty = moduleSchemaProperties[propertyName];
//							$(keytext).attr('title',schemaProperty.description);
							attachTooltip(row, schemaProperty.description);
						}
						
						$(keytext).val(schemaProperty && schemaProperty.name ? schemaProperty.name : propertyName);
						
						var key = document.createElement('td');
						$(key).addClass('properties-key');
						key.appendChild(keytext);
						$(row).append(key);
//						attachTooltip(row,rowdata.description);
						
						
						// Process editing the property key - ENTER key pressed
						$(key).on('keydown', processPropertyKeyChange.bind(this, true, rowNum, propertyName, keytext, cellview));					
						// Process editing the property key - when cell loses focus (e.g. tab pressed)
						$(key).on('focusout',processPropertyKeyChange.bind(this, false, rowNum, propertyName, keytext, cellview));

						var value = document.createElement('td');
						$(row).append(value);
						var valuetext;
						if (schemaProperty && schemaProperty.source) {
							valuetext = document.createElement('textarea');
							value.appendChild(valuetext);
							$(valuetext).addClass('properties-input');
							var doc = CodeMirror.fromTextArea(valuetext, {
//								gutters: ["CodeMirror-lint-markers"],
//								lint: {
//									async: true,
//									getAnnotations: function (text, updateFun) {
//										if (!updateLinting) {
//											updateLinting = updateFun;
//											$scope.$watch("definition.parseError", refreshMarkers);
//										}
//									}
//								},
								extraKeys: {'Ctrl-Space': 'autocomplete'},
//								hintOptions: {
//									async: 'true',
//									hint: contentAssist
//								},
							    lineNumbers: true,
							    lineWrapping: true,
							    matchBrackets: true,
							    autoCloseBrackets: true,
							    mode: schemaProperty.source.mime
							});
							CodeMirror.autoLoadMode(doc, schemaProperty.source.type);
							var valueToSet = properties[propertyName] === undefined ? getDisplayDefaultValue(schemaProperty) : properties[propertyName];
							if (metamodelService && _.isFunction(metamodelService.decodeTextFromDSL)) {
								valueToSet = metamodelService.decodeTextFromDSL(valueToSet);
							}
							doc.setValue(valueToSet);
							doc.on('blur', function () {
								processNewPropertyValueForCodeMirrorDoc(doc, propertyName, cellview);
							});
						} else {
							valuetext = document.createElement('input');
							value.appendChild(valuetext);
							$(valuetext).addClass('properties-input');
							$(valuetext).val(properties[propertyName] === undefined ? getDisplayDefaultValue(schemaProperty) : properties[propertyName]);
							
							// Handle new property value - pressing ENTER
							$(value).on('keydown', processNewPropertyValue.bind(this, true, rowNum, propertyName, valuetext, cellview));
							// Handle new property value - exiting property value (e.g. TAB pressed)
							$(value).on('focusout',processNewPropertyValue.bind(this, false, rowNum, propertyName, valuetext, cellview));
						}
						$(value).addClass('properties-value');

						if ((rowNum % 2)===0) {
							$(valuetext).addClass('properties-row-text-even');
						} else {
							$(valuetext).addClass('properties-row-text-odd');
						}
												
						rowNum++;
					});
				}

				function processNewPropertyValueUpdate(checkKey, keyText, keyTextInputField, cellview, evt) {
					var property = moduleSchemaProperties[keyText];
					var newValue = $(this).val();
					if (!checkKey || evt.keyCode === 13) {
						// If nothing typed, reset to '...'
						if (newValue === '' || (property && property.defaultValue === newValue)) {
							$(this).val(getDisplayDefaultValue(property));
							$(keyTextInputField).addClass('properties-new-property');
							$(this).addClass('properties-new-property');
						} else {
							if (_.isFunction(metamodelService.isValidPropertyValue)) {
								if (metamodelService.isValidPropertyValue(cellview.model, keyText, newValue)) {
									addNewPropertyKeyValue(cellview, keyText, $(this).val());
								} else {
									$(this).val(getDisplayDefaultValue(property));
								}
							} else {
								addNewPropertyKeyValue(cellview, keyText, $(this).val());
							}
						}
					}
				}
				
				function processNewPropertyValueUpdateForCodeCodeMirrorDoc(doc, textarea, key, keyText, cellview) {
					var property = moduleSchemaProperties[key];
					var rawNewValue = doc.getValue();
					var newValue = doc.getValue();
					if (metamodelService && _.isFunction(metamodelService.encodeTextToDSL)) {
						newValue = metamodelService.encodeTextToDSL(rawNewValue);
					}
					// If nothing typed, reset to '...'
					if (rawNewValue === '' || (property && property.defaultValue === newValue)) {
						doc.setValue(getDisplayDefaultValue(property));
						$(keyText).addClass('properties-new-property');
						$(textarea).addClass('properties-new-property');
					} else {
						if (_.isFunction(metamodelService.isValidPropertyValue)) {
							if (metamodelService.isValidPropertyValue(cellview.model, keyText, newValue)) {
								addNewPropertyKeyValue(cellview, key, newValue);
							} else {
								var defValue = getDisplayDefaultValue(property);
								if (metamodelService && _.isFunction(metamodelService.decodeTextFromDSL)) {
									defValue = metamodelService.decodeTextFromDSL(defValue);
								}
								doc.setValue(defValue);
							}
						} else {
							addNewPropertyKeyValue(cellview, key, newValue);
						}
					}
				}
				
				// Add possible keys that don't have values yet, in gray
				if (moduleSchemaProperties) {
				Object.keys(moduleSchemaProperties).sort().forEach(function(propertyName) {
					if (propertyName === cellview.model.attr('metadata/metadata/titleProperty')) {
						// Ignore the title property. It'll be displayed at the top anyway
						return;
					}
					if (properties[propertyName]) {
						// Ensure not set properties are processed here
						return;
					}
					var property = moduleSchemaProperties[propertyName];
					var row = document.createElement('tr');
					if ((rowNum % 2)===0) {
						$(row).addClass('properties-row-even');
					} else {
						$(row).addClass('properties-row-odd');
					}
					$(table).append(row);
					var keytext = document.createElement('input');
					$(keytext).addClass('properties-input');
					$(keytext).val(property.name);
					$(keytext).addClass('properties-new-property');

					if ((rowNum % 2)===0) {
						$(keytext).addClass('properties-row-text-even');
					} else {
						$(keytext).addClass('properties-row-text-odd');
					}
					$(keytext).attr('readonly', true);
					
					var key = document.createElement('td');
					$(key).addClass('properties-key');
					key.appendChild(keytext);
					$(row).append(key);
					
					attachTooltip(row, property.description);
					
					var value = document.createElement('td');
					$(row).append(value);
					var valuetext;
					if (property && property.source) {
						valuetext = document.createElement('textarea');
						value.appendChild(valuetext);
 						$(valuetext).addClass('properties-input');
 						$(valuetext).addClass('properties-new-property');
						$(valuetext).addClass('properties-input');
						var doc = CodeMirror.fromTextArea(valuetext, {
//							gutters: ["CodeMirror-lint-markers"],
//							lint: {
//								async: true,
//								getAnnotations: function (text, updateFun) {
//									if (!updateLinting) {
//										updateLinting = updateFun;
//										$scope.$watch("definition.parseError", refreshMarkers);
//									}
//								}
//							},
							extraKeys: {'Ctrl-Space': 'autocomplete'},
//							hintOptions: {
//								async: 'true',
//								hint: contentAssist
//							},
						    lineNumbers: true,
						    lineWrapping: true,
						    matchBrackets: true,
						    autoCloseBrackets: true,
						    mode: property.source.mime
						});
						CodeMirror.autoLoadMode(doc, property.source.type);
						var valueToSet = getDisplayDefaultValue(property);
						if (metamodelService && _.isFunction(metamodelService.decodeTextFromDSL)) {
							valueToSet = metamodelService.decodeTextFromDSL(valueToSet);
						}
						doc.setValue(valueToSet);
						doc.on('focus', function () {							
							doc.setValue('');
	 						$(valuetext).removeClass('properties-new-property');
						});
						doc.on('blur', function () {
							processNewPropertyValueUpdateForCodeCodeMirrorDoc(doc, valuetext, propertyName, keytext, cellview);
						});
 					} else {
 						valuetext = document.createElement('input');
 						value.appendChild(valuetext);
 						$(valuetext).addClass('properties-input');
 						$(valuetext).val(getDisplayDefaultValue(property));
 						$(valuetext).addClass('properties-new-property');
 						
 						// Focus event on property value - set it to blank so the user can start typing
 						$(valuetext).on('focus',function(keyText, keyTextInputField, nodeNumber, evt) { // jshint ignore:line
 							$(this).val('');
 							// Make them black and not gray for now
 							$(keyTextInputField).removeClass('properties-new-property');
 							$(this).removeClass('properties-new-property');
 						}.bind(valuetext, propertyName, keytext));
 						
 						// Handle new property value - ENTER pressed
 						$(valuetext).on('keydown', processNewPropertyValueUpdate.bind(valuetext, true, propertyName, keytext, cellview));
 						// Handle new property value - focus leaving cell (e.g. TAB pressed)
 						$(valuetext).on('focusout',processNewPropertyValueUpdate.bind(valuetext, false, propertyName, keytext, cellview));
 					}

					if ((rowNum % 2)===0) {
						$(valuetext).addClass('properties-row-text-even');
					} else {
						$(valuetext).addClass('properties-row-text-odd');
					}
					$(value).addClass('properties-value');
					

					rowNum++;
				});
				}
				
				// If the module supports new (undefined) properties, add a row to support entering them
				if (cellview.model.attr('metadata/metadata/allow-additional-properties')) {
					addNewPropertyRow(table, cellview, rowNum);
				}

				resize();
			}, function(error) {
				if (error) {
					console.log(error);
				}
			});
		}
		
		return {
			resize: resize,
			on: on,
			updatePropertiesView: updatePropertiesView,
			togglePropertiesView: togglePropertiesView,
			setVisible: setVisible,
			isVisible: isVisible
		};
	};
	
});
