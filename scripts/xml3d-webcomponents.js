(function () {

    var useShadow = true;

    var XCompProto = Object.create(HTMLElement.prototype);

    XCompProto.createdCallback = function () {
        this.root = useShadow ? this.createShadowRoot() : this;
        this.handlers = {};

        updateTemplate(document.querySelector(this.getAttribute('data-src')), this, this.root);

    };

    var updateTemplate = function (template, element, root) {
        if (!template) return;

        var clone = document.importNode(template.content, true);
        root.appendChild(clone);

        // console.log(this.root.firstElementChild);

        for (var i = 0; i < template.attributes.length; i++) {
            var attr = template.attributes[i];
            var attrName = attr.localName;
            var place = getPlace(root.firstElementChild, './/node()[text()="{{' + attrName + '}}"]');
            // console.log(place);
            if (!place) place = getPlace(root.firstElementChild, './/@*[.="{{' + attrName + '}}"]');
            // console.log(place);
            if (!place) continue;

            var handler = (function (elem, value) {
                return function (newValue) {
                    if (!newValue) newValue = value;
                    elem.textContent = newValue;
                };
            })(place, attr.textContent);

            handler(element.getAttribute(attrName));
            element.handlers[attrName] = handler;
        }

    };

    var getPlace = function (context, path) {
        //var context = useShadow ? root.firstElementChild : root;
        return document.evaluate(path, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    };

    XCompProto.attributeChangedCallback = function (attr, oldValue, newValue) {
        if(attr == 'data-src') {
            updateTemplate(document.querySelector(newValue), this, this.root);
            return;
        }


        var handler = this.handlers[attr];
        if (!handler) return;
        handler(newValue);
    }


    var XDataElement = document.registerElement('x-data', {
        prototype: Object.create(XCompProto)
    });

    var XGroupElement = document.registerElement('x-group', {
        prototype: Object.create(XCompProto)
    });


})();
