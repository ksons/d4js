 console.log("Hallo" );
 
var d3_selectionPrototype = d3.selection.prototype;
 
d3_selectionPrototype.param = function(name, value, type) {
  if (arguments.length < 2) {

    // For attr(string), return the attribute value for the first node.
    if (typeof name === "string") {
      var node = this.node();
      throw new Error("Getting xml3d params not supported yet!");
    }

    // For attr(object), the object specifies the names and values of the
    // attributes to set or remove. The values may be functions that are
    // evaluated for each element.
    if (typeof name == "object") {
        for (value in name) this.each(d3_selection_param(value, name[value]));
        return this;
    }

    // For func(object), the function will evaluate names and values of the
    // attributes to set or remove.
    if (typeof name == "function") {
        return this.each(d3_selection_param("", name));
    }
  }

  return this.each(d3_selection_param(name, value, type));
};

function d3_set_param(parent, name, value, type) {
  var param = parent.querySelector("*[name=" + name + "]");
  if(value == null) {
	param && parent.removeChild(param);
  	return;
  }
  if (value.type) {
    type = value.type;
    value = value.value;
  }

  if (param && param.name != type) {
	parent.removeChild(param);
	param = null;
  }
  if (!param) {
    param = document.createElement(type || "float3");
	param.setAttribute("name", name);
	parent.appendChild(param);
  }
  param.textContent = value;
}

function d3_selection_param(name, value, type) {
  
  // For param(string, null), remove the parameter with the specified name.
  function paramNull() {
    d3_set_param(this, name, null);

  }

  // For param(string, string), set the parameter with the specified name.
  function paramConstant() {
    d3_set_param(this, name, value, type);
  }

  // For param(string, function), evaluate the function for each element, and set
  // or remove the parameter as appropriate.
  function paramFunction() {
    var x = value.apply(this, arguments);
    if(typeof x == "object") {
        for (param in x) d3_set_param(this, param, x[param].value, x[param].type);
        return;
    }
    d3_set_param(this, name, x, type);
  }

  return value == null ? paramNull : (typeof value === "function"
      ? paramFunction : paramConstant);
}
