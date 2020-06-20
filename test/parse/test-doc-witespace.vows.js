var wows = require('vows'),
	assert = require('assert');
var DOMParser = require('../../lib/dom-parser').DOMParser;
var XMLSerializer = require('../../lib/dom-parser').XMLSerializer


wows.describe('errorHandle').addBatch({
	'unclosed tag':function(){
		assert.equal(new DOMParser().parseFromString('<foo')+'', '<foo>');
	},
	'document source':function(){
		var testSource = '<?xml version="1.0"?>\n<!--test-->\n<xml/>'
		var dom = new DOMParser().parseFromString(testSource,'text/xml')
		assert.isTrue(new XMLSerializer().serializeToString(dom) == testSource)
	},
	'test':function(){
		var description = "<p>populaciji (< 0.1%), te se</p>";
		var doc = new DOMParser().parseFromString(description, 'text/html');
		assert.equal(doc.toString(), '<p xmlns="http://www.w3.org/1999/xhtml">populaciji (&lt; 0.1%), te se</p>')
	}
}).export(module)







