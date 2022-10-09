	let config = {
		method: 'get',
		url: 'https://lu7oe93qmi.execute-api.eu-west-2.amazonaws.com/production/calendar-availability/british-airways?source_code=LON&destination_code=ACC&tier=blue&number_of_passengers=1',
		headers: {
			authority: 'lu7oe93qmi.execute-api.eu-west-2.amazonaws.com',
			accept: '*/*',
			'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
			dnt: '1',
			origin: 'https://rewardflightfinder.com',
			referer: 'https://rewardflightfinder.com/',
			'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"macOS"',
			'sec-fetch-dest': 'empty',
			'sec-fetch-mode': 'cors',
			'sec-fetch-site': 'cross-site',
			'user-agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
		},
	};

		const result = (await Axios(config)).data.outbound_availability;
        let availableDates: any[] = []
