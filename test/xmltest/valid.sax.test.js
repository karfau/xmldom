'use strict'

const xmltest = require('xmltest')
const { SaxHandler } = require('xmltest/sax')
const { XMLReader } = require('../../lib/sax')

describe('xmltest/valid', () => {
	describe.only('sax', () => {
		test.each(Object.keys(xmltest.getEntries(xmltest.FILTERS.xml)))(
			'should parse %s',
			async (pathInZip) => {
				const input = await xmltest.getContent(pathInZip)
				const handler = SaxHandler()
				const it = new XMLReader()
				it.domBuilder = handler
				it.errorHandler = handler

				it.parse(input, {}, {})

				expect(handler.getCallsInOrder()).toMatchSnapshot()
			}
		)
	})
})
