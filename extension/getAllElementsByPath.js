// This is copied from attributes.yaml
cssAttributes = [ "align-content", "align-items", "align-self", "all",
		"animation-name", "animation-duration", "animation-timing-function",
		"animation-delay", "animation-iteration-count", "animation-direction",
		"animation-fill-mode", "animation-play-state", "backface-visibility",
		"background-attachment", "background-blend-mode", "background-clip",
		"background-color", "background-image", "background-origin",
		"background-position", "background-repeat", "background-size",
		"border-bottom-style", "border-bottom-color",
		"border-bottom-left-radius", "border-bottom-right-radius",
		"border-bottom-width", "border-collapse", "border-image-outset",
		"border-image-repeat", "border-image-slice", "border-image-source",
		"border-image-width", "border-left-color", "border-left-style",
		"border-left-width", "border-radius", "border-right-color",
		"border-right-style", "border-right-width", "border-spacing",
		"border-top-color", "border-top-left-radius",
		"border-top-right-radius", "border-top-style", "border-top-width",
		"bottom", "box-decoration-break", "box-shadow", "box-sizing",
		"break-after", "break-before", "break-inside", "caption-side",
		"caret-color", "clear", "clip", "color", "column-count", "column-fill",
		"column-gap", "column-rule-color", "column-rule-style",
		"column-rule-width", "column-span", "column-width", "content",
		"counter-increment", "counter-reset", "direction", "display",
		"empty-cells", "filter", "flex-basis", "flex-direction", "flex-grow",
		"flex-shrink", "flex-wrap", "float", "font-family", "font-size",
		"line-height", "text-align", "text-indent", "float", "font-kerning",
		"font-size", "font-size-adjust", "font-stretch", "font-style",
		"font-variant", "font-weight", "grid-auto-columns", "grid-auto-flow",
		"grid-auto-rows", "grid-column-end", "grid-column-start",
		"grid-row-end", "grid-row-start", "grid-template-areas",
		"grid-template-columns", "grid-template-rows", "grid-row-gap",
		"grid-column-gap", "hanging-punctuation", "hyphens", "isolation",
		"justify-content", "left", "letter-spacing", "line-height",
		"list-style-image", "list-style-position", "list-style-type",
		"margin-top", "margin-right", "margin-bottom", "margin-left",
		"max-height", "max-width", "min-height", "min-width", "mix-blend-mode",
		"object-fit", "object-position", "opacity", "order", "outline-color",
		"outline-offset", "outline-style", "outline-width", "overflow-x",
		"overflow-y", "offsetHeight", "offsetWidth", "padding-top",
		"padding-right", "padding-bottom", "padding-left", "page-break-after",
		"page-break-before", "page-break-inside", "perspective",
		"pointer-events", "position", "quotes", "resize", "right",
		"scroll-behavior", "tab-size", "table-layout", "text-align",
		"text-align-last", "text-decoration-color", "text-decoration-line",
		"text-decoration-style", "text-indent", "text-justify",
		"text-overflow", "text-shadow", "text-transform", "top", "transform",
		"transform-style", "transition-delay", "transition-duration",
		"transition-property", "transition-timing-function", "unicode-bidi",
		"user-select", "vertical-align", "visibility", "white-space",
		"word-break", "word-spacing", "word-wrap", "z-index", ];

var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var DOCUMENT_TYPE_NODE = 10;

function Counter() {
	this.map = {};
	this.increase = function (element) {
		if (element.tagName in this.map) {
			this.map[element.tagName] = this.map[element.tagName] + 1;
		} else {
			this.map[element.tagName] = 1;
		}
		return this.map[element.tagName];
	};
}

function getText(node) {
	var firstNode = node.childNodes[0];
    if (firstNode && firstNode.nodeType === TEXT_NODE) {
		return firstNode.nodeValue;
	}
    if (node.nodeType === TEXT_NODE) {
		return node.nodeValue;
	}
	return "";
}

function getX(node) {
	var rect = node.getBoundingClientRect();
	return rect.left + window.scrollX;
}

function getY(node) {
	var rect = node.getBoundingClientRect();
	return rect.top + window.scrollY;
}

function addCoordinates(extractedAttributes, node) {
	// these attributes need special treatment
	extractedAttributes["absolute-x"] = getX(node);
	extractedAttributes["absolute-y"] = getY(node);
	extractedAttributes["absolute-width"] = node.getBoundingClientRect().width;
	extractedAttributes["absolute-height"] = node.getBoundingClientRect().height;
	if (typeof node.parentNode.getBoundingClientRect === "function") {
		extractedAttributes["x"] = getX(node) - getX(node.parentNode);
		extractedAttributes["y"] = getY(node) - getY(node.parentNode);
		extractedAttributes["width"] = node.getBoundingClientRect().width - node.parentNode.getBoundingClientRect().width;
		extractedAttributes["height"] = node.getBoundingClientRect().height - node.parentNode.getBoundingClientRect().height;
	} else {
		extractedAttributes["x"] = getX(node);
		extractedAttributes["y"] = getY(node);
		extractedAttributes["width"] = node.getBoundingClientRect().width;
		extractedAttributes["height"] = node.getBoundingClientRect().height;
	}
}

function isDisabled(node) {
	if (!node.disabled) {
		return false;
	}
	if (node.disabled === "") {
		return false;
	}
	if (node.disabled === "disabled") {
		return true;
	}
	return node.disabled;
}

function transform(node) {
	var extractedAttributes = {
		"tagName": node.tagName.toLowerCase(),
		"text": getText(node),
		"value": node.value,
		"tab-index": node.tabIndex,
		"shown": isShown(node)
	};
	
    if (node.nodeType === TEXT_NODE) {
		addCoordinates(extractedAttributes, node.parentNode);
		return extractedAttributes;
	}

	// extract *all* HTML element attributes
	var attrs = node.attributes;
	for (var i = 0; i < attrs.length; i++) {
		var attributeName = attrs[i].name;
		var attributeValue = attrs[i].value;
        if (attributeValue && attributeValue !== "" && attributeValue !== "null") {
            extractedAttributes[attributeName] = attributeValue;
        }
	}
	
	// overwrite empty attributes (e.g. 'disabled')
	extractedAttributes["disabled"] = isDisabled(node);
	extractedAttributes["read-only"] = node.readOnly;

	// extract *given* CSS style attributes
	var style = window.getComputedStyle(node);
	var parentStyle = [];
	try {
		parentStyle = window.getComputedStyle(node.parentNode);
	} catch (err) {}
	for (var i = 0; i < cssAttributes.length; i++) {
		var attributeName = cssAttributes[i];
		if (!extractedAttributes[attributeName]) {
			if (parentStyle[attributeName] !== style[attributeName]) {
				extractedAttributes[attributeName] = style[attributeName];
			}
		}
	}

	addCoordinates(extractedAttributes, node);

	return extractedAttributes;
}

function isShown(e) {
    if (e.nodeType === TEXT_NODE) {
		return isShown(e.parentNode);
	}
	return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
}

function isNonEmptyTextNode(node) {
    var nodeValue = (node.nodeValue == null) ? "" : node.nodeValue;
    return node.nodeType === node.TEXT_NODE && nodeValue.trim().length > 0;
}

function containsOtherElements(element) {
	return element.children.length > 0;
}

function mapElement(element, parentPath, allElements) {
	if (!element || !element.children) {
		return allElements;
	}
	var counter = new Counter();
	for (var i = 0; i < element.childNodes.length; i++) {
		var child = element.childNodes[i];
		if (child.nodeType === ELEMENT_NODE || (isNonEmptyTextNode(child) && containsOtherElements(element))) {
			if (child.nodeType === TEXT_NODE) {
				child.tagName = "textnode";
			}
			var cnt = counter.increase(child);
			var path = parentPath + "/" + child.tagName.toLowerCase() + "[" + cnt + "]";
			allElements[path] = transform(child);
			mapElement(child, path, allElements);
		}
	}
	return allElements;
}
