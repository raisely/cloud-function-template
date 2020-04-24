const request = require('request-promise-native');

/**
 * This is an example cloud function
 * You can modify this funciton and use it with Google Cloud Functions
 * to catch and process Raisely Webhooks
 *
 * When configuing the cloud function you will need to set the two environment
 * variables below (WEBHOOK_SECRET and API_KEY) (DO NOT save such values to git
 * or other source control)
 *
 */

// Insert here a shared secret to use when configuring your webhook with raisely
// Set the same value when setting up the webhook in
// Raisely Admin -> Campaign -> Settings -> API & Webhooks
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Secret key to access the campaign, can be found in
// Raisely Admin -> Campaign -> Settings -> API & Webhooks
const API_KEY = process.env.RAISELY_API_KEY;

/**
 * Example Cloud Function that catches webhooks from Raisely
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.integration = async function integration(req, res) {
	// Verify that the webhook is actually from raisely using the shared secret
	if (!authenticate(req, res)) return true;

	const event = req.body.data;

	// Event sources are of the form 'campaign:uuid' or 'organisation:uuid'
	const campaignUuid = event.source.split(':')[1];

	let response;

	// Detect event type and get data off the payload, delete as necessary
	if (event.type === 'donation.succeeded') {
		const donation = event.data;
		const { user, profile } = donation;

		// Log that the donation took place
		console.log(`Processing ${event.type} for ${donation.uuid}, campaign: ${campaignUuid}, made to profile: ${profile.name} by ${user.fullName}`);

		// Save a private custom field `isProcessed` and set it to true
		response = await raiselyRequest({
			path: `/donations/${donation.uuid}`,
			method: 'PATCH',
			json: {
				data: { private: { isProcessed: true } },
				partial: 1,
			},
		});
	} else if (event.type === 'subscription.succeeded') {
		const subscription = event.data;
		const { user, profile } = subscription;

	} else if (event.type === 'profile.created') {
		const subscription = event.data;
		const { user, profile } = subscription;

	} else if (event.type === 'user.registered') {
		const user = event.data;

	} else if (event.type === 'profile.totalUpdated') {
		const profile = event.data;
		const { user } = profile;

	} else if (event.type === 'profile.exerciseTotalUpdated') {
		const profile = event.data;
		const { user } = profile;

	} else {
		res.status(200).send({ success: false, error: `Unrecognised event ${event.type}` });
		return true;
	}

	res.status(200).send({ success: true, response });
	return true;
};

/**
 * Verify that the webhook came from raisely by checking the shared secret
 * If authentication fails, will set a 200 response
 * (to prevent Raisely from continuing to retry the webhook with a bad secret)
 * @param {*} req
 * @param {*} res
 * @returns {boolean} true if the request is authenticated
 */
function authenticate(req, res) {
	const secret = req.body.secret;

	if (secret && secret === WEBHOOK_SECRET) return true;

	res.status(200).send({ success: false, error: 'invalid shared secret' });
	return false;
}

/**
 * Wrapper around request-promise-native to send a request to Raisely
 * Uses the API key for the authorization header and generates a full Raisely API url
 * to the v3 API
 *
 * @params {string} opts.path Relative path of request (eg '/donations')
 * @params {!Object} opts As documented at https://www.npmjs.com/package/request
 */
async function raiselyRequest(opts) {
	const options = { ...opts };
	options.url = `https://api.raisely.com/v3${opts.path}`
	delete options.path;
	if (!options.headers) options.headers = {};
	options.headers['Authorization'] = `Bearer ${API_KEY}`;
	return request(options);
}
