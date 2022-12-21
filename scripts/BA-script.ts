import Axios from 'axios-https-proxy-fix';
import { sendWebhook } from './sendWebhook';
import { config as env } from '../config';

console.log('==> Starting Script');

const startBa = async () => {
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
				'Windows 10/ Edge browser: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ',
		},
	};

	try {
		const result = (await Axios(config)).data;
		const outDates = result.outbound_availability;
		const returnDates = result.inbound_availability;
		const outboundAvailableDates: any[] = [];
		const inboudAvailableDates: any[] = [];

		for (let i = 10; i < 30; i++) {
			// Construct date string in the format "YYYY-MM-DD"
			const date = `2022-12-${i.toString().padStart(2, '0')}`;

			// Check the availability for the current date
			const outDatesAvailability = outDates[date];

			// If there is availability for the current date, add it to the availableDates array
			if (!!outDatesAvailability) {
				outboundAvailableDates.push({ [date]: outDatesAvailability });
			}
		}

		for (let day = 1; day < 30; day++) {
			// Construct date string in the format "YYYY-MM-DD"
			const date = `2022-12-${day.toString().padStart(2, '0')}`;

			// Check the availability for the current date
			const returnDatesAvailability = returnDates[date];

			// If there is availability for the current date, add it to the availableDates array
			if (!!returnDatesAvailability) {
				inboudAvailableDates.push({ [date]: returnDatesAvailability });
			}
		}

		if (!!outboundAvailableDates.length || !!inboudAvailableDates.length) {
			if (!!outboundAvailableDates.length) {
				await sendWebhook(outboundAvailableDates, 'Outbound');
				console.log(
					'\x1b[32m%s\x1b[0m',
					`Flight found! \n${JSON.stringify(outboundAvailableDates)}.`
				);
			}

			if (!!inboudAvailableDates.length) {
				await sendWebhook(inboudAvailableDates, 'Inbound');
				console.log(
					'\x1b[33m%s\x1b[0m',
					`Flight found! \n${JSON.stringify(inboudAvailableDates)}.`
				);
			}
		} else {
			console.log(
				'\x1b[31m%s\x1b[0m',
				`${new Date()} No Flights found. Checking for reward flight in ${
					env.cooldown_time / 1000
				} seconds.`
			);
		}
	} catch (error) {
		console.log(error);
	}
};

setInterval(() => {
	startBa();
}, env.cooldown_time);
