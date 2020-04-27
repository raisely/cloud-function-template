const nock = require('nock');
const chai = require('chai');
const chaiSubset = require('chai-subset');

const { integration: webhook } = require('./index');

const mocks = require('./mocks');

chai.use(chaiSubset);
const { expect } = chai;


const campaign = mocks.campaign();
const campaignUuid = campaign.uuid;

const subscription = mocks.subscription();
const donation = mocks.donation();
const profile = mocks.profile();
profile.user = mocks.user();

const secret = process.env.WEBHOOK_SECRET;

describe('Raisely Cloud Function', () => {
	let req;
	let res;
	let result;
	let nockRequest;
	describe('WHEN donation.succeeded', () => {
		before(async () => {
			// Catch request to Raisely API
			nockRequest = doNock('patch', 'https://api.raisely.com/v3', `/donations/${donation.uuid}`);
			({ req, res } = prepare({
				secret,
				data: {
					type: 'donation.succeeded',
					source: `campaign:${campaignUuid}`,
					data: {
						...donation,
						profile,
					}
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
		before(async () => {
			nockRequest = doNock('post', 'https://api.raisely.com/v3', `/interactions`);
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
function doNock(method, host, path) {
	let result = {};
	const n = nock(host)
		.log(console.log)[method](path)
		.reply(200, function donate(uri, requestBody) {
			result.body = requestBody;
			return requestBody;
		});
	return result;
}
