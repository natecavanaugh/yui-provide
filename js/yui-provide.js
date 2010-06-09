;(function(){
	var Y = YUI().use('oop');
	var Lang = Lang;

	var usedModules = {};
	var emptyFn = function(){};

	var Dependency = {
		provide: function(obj, methodName, methodFn, modules) {
			if (!Lang.isArray(modules)) {
				modules = [modules];
			}

			var guid = Y.guid('yui-provide');
			var before;

			if (Lang.isObject(methodFn, true)) {
				var config = methodFn;

				methodFn = config.fn;
				before = config.before;

				if (!Lang.isFunction(before)) {
					before = null;
				}
			}

			var AOP = Dependency._getAOP(obj, methodName);

			if (AOP) {
				delete Y.Do.objs[obj._yuid][methodName];
			}

			var proxy = function() {
				var args = arguments;

				if (modules.length == 1) {
					if (modules[0] in usedModules) {
						Dependency._replaceMethod(obj, methodName, methodFn);

						methodFn.apply(obj, args);

						return;
					}
				}

				var queue = Dependency._proxyLoaders[guid];
				var firstLoad = false;

				if (!queue) {
					firstLoad = true;
					Dependency._proxyLoaders[guid] = new Y.Queue();

					queue = Dependency._proxyLoaders[guid];
				}

				queue.add(args);

				if (firstLoad) {
					modules.push(Y.bind(Dependency._proxy, Liferay, obj, methodName, methodFn, guid, modules));

					Y.use.apply(Y, modules);
				}
			};

			proxy.toString = function() {
				return methodFn.toString();
			};

			proxy._guid = guid;

			obj[methodName] = proxy;
		},

		_getAOP: function(obj, methodName) {
			var instance = this;

			return obj._yuid && Y.Do.objs[obj._yuid] && Y.Do.objs[obj._yuid][methodName];
		},

		_proxy: function(obj, methodName, methodFn, guid, modules, Y) {
			var queue = Dependency._proxyLoaders[guid];
			var args;

			Dependency._replaceMethod(obj, methodName, methodFn);

			while ((args = queue.next())) {
		        methodFn.apply(obj, args);
		    }

			for (var i = modules.length - 1; i >= 0; i--) {
				usedModules[modules[i]] = true;
			}
		},

		_replaceMethod: function(obj, methodName, methodFn) {
			var instance = this;

			methodFn._guid = obj[methodName]['_guid'];

			var AOP = Dependency._getAOP(obj, methodName);

			if (AOP) {
				AOP.method = methodFn;
			}
			else {
				obj[methodName] = methodFn;
			}
		},

		_proxyLoaders: {}
	};

	YUI.Dependency = Dependency;

	YUI.provide = Dependency.provide;
})();