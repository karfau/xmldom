'use strict'

const xmltest = require('xmltest')
const { SaxHandler } = require('xmltest/sax')
const { XMLReader } = require('../../lib/sax')

const reduceCallEntry = (callEntry) => {
	const simple = callEntry
		.filter((it, i, l) => {
			// don't put the same value twice (e.g localName === qName)
			if (i > 0 && l[i - 1] === it) return false;
			// only put truthy values
			return !!it
		})

	return simple.length === 1
		? simple[0] // if there were no arguments, just put the method name
		: xmltest // otherwise make sure we don't have any special chars
				.replaceNonTextChars(simple.join(','))
				.replace(/\r/g, "{!r!}")
				.replace(/\n/g, '{!n!}')
				.replace(/\t/g, '{!t!}')
}
const toSnapshotString = (callEntries) =>
	callEntries.map(reduceCallEntry).join('\n')

describe('xmltest/valid', () => {
	describe.only('sax', () => {
		test.each(
			Object.keys(
				xmltest.getEntries(
					'xmltest/valid/',
					xmltest.FILTERS.xml,
					(it) => !/\/out\//.test(it)
				)
			)
		)('should parse %s', async (pathInZip) => {
			const input = await xmltest.getContent(pathInZip)
			const handler = SaxHandler({
				wrap: {
					startElement: (handler, _, __, qname, attrs) => {
						if (attrs.length === 0) {
							handler(qname)
						} else {
							const mapped = [];
							for (let i = 0; i < attrs.length; i++) {
								mapped.push(`'${attrs.getQName(i)}':'${attrs.getValue(i)}'`);
							}
							handler(qname, `{${mapped.sort().join()}}`);
						}
					},
				},
			})
			const it = new XMLReader()
			handler.doc = {appendChild: jest.fn(),createTextNode: jest.fn()}
			it.domBuilder = handler
			it.errorHandler = handler

			it.parse(input, {}, {})

			expect(toSnapshotString(handler.getCallsInOrder())).toMatchSnapshot()
		})
	})
})
