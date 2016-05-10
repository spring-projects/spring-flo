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

define(function() {
	'use strict';

	return function() {
		
		// TODO remove this home grown eventing
		var triggerFns = {};

		function on(triggerEvent, fn) {
			var triggers = triggerFns[triggerEvent];
			if (!triggers) {
				triggers = [];
				triggerFns[triggerEvent] = triggers;
			}
			triggers.push(fn);				
		}
		
		function off(triggerEvent, fn) {
			var triggers = triggerFns[triggerEvent];
			if (triggers) {
				var index = triggers.indexOf(fn);
				if (index >= 0) {
					triggers.splice(index);
				}
			}
		}
		
		function fireEvent(event, paramsObject) {
			var triggers = triggerFns[event];
			if (triggers && Array.isArray(triggers)) {
				triggers.forEach(function(trigger) {
					trigger(paramsObject);
				});
			}
		}
		
		return {
			on: on,
			off: off,
			fireEvent: fireEvent
		};
	};
	
});