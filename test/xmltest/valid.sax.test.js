'use strict'

const xmltest = require('xmltest')
const { SaxHandler } = require('xmltest/sax')
const { XMLReader } = require('../../lib/sax')

const reduceCallEntry = (callEntry) => {
	const simple = callEntry.filter((it) => !!it && !(typeof it === 'object'))
	return simple.length === 1
		? simple[0]
		: xmltest.replaceNonTextChars(simple.join(',')).replace(
			/[\r\n]/g,
			xmltest.replaceWithWrappedCodePointAt
		)
}
const toSnapshotString = (callEntries) => callEntries.map(reduceCallEntry).join("\n");

describe('xmltest/valid', () => {
	describe.only('sax', () => {
		test.each(Object.keys(xmltest.getEntries(xmltest.FILTERS.xml, it => !/\/out\//.test(it))))(
			'should parse %s',
			async (pathInZip) => {
				const input = await xmltest.getContent(pathInZip)
				const handler = SaxHandler()
				const it = new XMLReader()
				it.domBuilder = handler
				it.errorHandler = handler

				it.parse(input, {}, {})

				expect(toSnapshotString(handler.getCallsInOrder())).toMatchSnapshot()
			}
		)
	})
})
