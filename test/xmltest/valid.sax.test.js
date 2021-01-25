'use strict'

const xmltest = require('xmltest')
const { SaxHandler } = require('xmltest/sax')
const { parse } = require('../../lib/sax')

describe('xmltest/valid', () => {
	describe.only('sax', () => {
		test.each(Object.keys(xmltest.getEntries(xmltest.FILTERS.xml)))(
			'should parse %s',
			async (pathInZip) => {
				const input = await xmltest.getContent(pathInZip)
				const handler = SaxHandler()

				parse(input, {}, {}, handler, handler)

				expect(handler.getCallsInOrder()).toMatchSnapshot()
			}
		)
	})
})
