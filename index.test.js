const nock = require('nock');
const chai = require('chai');
const chaiSubset = require('chai-subset');

chai.use(chaiSubset);
const { expect } = chai;

const { integration: webhook } = require('./index');

const campaignUuid = '830a1280-6e17-11ea-858b-f7d7d2f43749';

const donation = {
	uuid: 'mock-donation-uuid',
	user: { firstName: 'Alexandria', uuid: 'user-uuid' },
	amount: 2050,
	currency: 'AUD',
	message: 'Good luck!',
	profile: {
		name: `Sam's profile`,
	}
};

const secret = process.env.WEBHOOK_SECRET;

describe('Raisely Cloud Function', () => {
	let req;
	let res;
	let result;
	let nockRequest;
	describe('WHEN donation.succeeded', () => {
		before(async () => {
			// Catch request to Raisely API
			nockRequest = doNock('patch', `/donations/${donation.uuid}`);
			({ req, res } = prepare({
				secret,
				data: {
					type: 'donation.succeeded',
					source: `campaign:${campaignUuid}`,
					data: donation,
				},
			}));

			try {
				result = await webhook(req, res);
				return result;
			} catch (e) {
				console.error(e);
				throw e;
			}
		});
		itSucceeds();
		it('set the donation to processed', () => {
			expect(nockRequest.body).to.containSubset({
				partial: 1,
				data: {
					private: { isProcessed: true },
				},
			});
		});
	});

	describe('WHEN subscription.succeeded', () => {
		const subscription = { uuid: 'mock-subscription-uuid' };
		before(async () => {
			nockRequest = doNock('post', `/interactions`);
			({ req, res } = prepare({
				secret,
				data: {
					source: `campaign:${campaignUuid}`,
					type: 'subscription.succeeded',
					data: subscription,
				},
			}));

			try {
				result = await webhook(req, res);
				return result;
			} catch (e) {
				console.error(e);
				throw e;
			}
		});
		itSucceeds();
		it('creates a custom interaction', () => {
			expect(nockRequest.body).to.containSubset({
				data: {
					something: 'expected',
				},
			});
		});
	});

	/**
	 * Verify that the cloud function returns status 200 and a body of
	 * { success: true }
	 */
	function itSucceeds() {
		it('has good result', () => {
			expect(result).to.eq(true);
		});
		it('returns success true', () => {
			expect(res.body).to.containSubset({ success: true });
		});
	}
});

/**
 * Prepare a mock request to test the cloud function with
 * @param {*} body
 */
function prepare(body) {
	const req = {
		body,
	};
	const res = {};
	res.status = (code) => {
		res.statusCode = code;
		return res.status;
	};
	res.status.send = (response) => (res.body = response);

	return { req, res };
}

/**
 * Catch requests to raisely API and save the body so we can check it in the test
 * @param {string} method get, patch, post, etc
 * @param {string} path Path of the API request
 */
function doNock(method, path) {
	let result = {};
	const n = nock('https://api.raisely.com/v3')
		.log(console.log)[method](path)
		.reply(200, function donate(uri, requestBody) {
			result.body = requestBody;
			return requestBody;
		});
	return result;
}
