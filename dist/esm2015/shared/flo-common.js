import * as _joint from 'jointjs';
import * as _$ from 'jquery';
const $ = _$;
export var Flo;
(function (Flo) {
    Flo.joint = _joint;
    let DnDEventType;
    (function (DnDEventType) {
        DnDEventType[DnDEventType["DRAG"] = 0] = "DRAG";
        DnDEventType[DnDEventType["DROP"] = 1] = "DROP";
    })(DnDEventType = Flo.DnDEventType || (Flo.DnDEventType = {}));
    let Severity;
    (function (Severity) {
        Severity[Severity["Error"] = 0] = "Error";
        Severity[Severity["Warning"] = 1] = "Warning";
    })(Severity = Flo.Severity || (Flo.Severity = {}));
    function findMagnetByClass(view, className) {
        if (className && className.startsWith('.')) {
            className = className.substr(1);
        }
        const element = view.$('[magnet]').toArray().find((magnet) => magnet.getAttribute('class').split(/\s+/).indexOf(className) >= 0);
        if (element) {
            return view.findMagnet($(element));
        }
    }
    Flo.findMagnetByClass = findMagnetByClass;
    function findMagnetByPort(view, port) {
        const element = view.$('[magnet]').toArray().find((magnet) => magnet.getAttribute('port') === port);
        if (element) {
            return view.findMagnet($(element));
        }
    }
    Flo.findMagnetByPort = findMagnetByPort;
    /**
     * Return the metadata for a particular palette entry in a particular group.
     * @param name - name of the palette entry
     * @param group - group in which the palette entry should exist (e.g. sinks)
     * @return
     */
    function getMetadata(metamodel, name, group) {
        const groupObj = metamodel && group ? metamodel.get(group) : undefined;
        if (name && groupObj && groupObj.get(name)) {
            return metamodel.get(group).get(name);
        }
        else {
            return {
                name: name,
                group: group,
                unresolved: true,
                get: (property) => new Promise(resolve => resolve()),
                properties: () => Promise.resolve(new Map())
            };
        }
    }
    Flo.getMetadata = getMetadata;
})(Flo || (Flo = {}));
//# sourceMappingURL=flo-common.js.map