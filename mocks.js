module.exports = {
	campaign: (data) => Object.assign({
		uuid: '830a1280-6e17-11ea-858b-f7d7d2f43749',
		name: 'Example Campaign',
	}, data),
	donation: (data) => Object.assign({
		uuid: 'mock-donation-uuid',
		user: { firstName: 'Alexandria', uuid: 'user-uuid' },
		amount: 2050,
		currency: 'AUD',
		message: 'Good luck!',
	}, data),
	profile: (data) => Object.assign({
		name: `Sam's profile`,
	}, data),
	subscription: (data) => Object.assign({
		uuid: 'mock-subscription-uuid',
		user: { firstName: 'Alexandria', uuid: 'user-uuid' },
		amount: 2050,
		currency: 'AUD',
		message: 'Good luck!',
		profile: {
			name: `Sam's profile`,
		}
	}, data),
	user: (data) => Object.assign({
		fullName: 'Jason Test',
		preferredName: 'Jase',
		email: 'jase@mail.test',
	}, data),
}
