import Axios from 'axios-https-proxy-fix';
import { sendWebhook } from './sendWebhook';
import { config as env } from '../config';

console.log('==> Starting Script');

const startBa = async () => {
	let config = {
		method: 'get',
		url: `https://lu7oe93qmi.execute-api.eu-west-2.amazonaws.com/production/calendar-availability/british-airways?source_code=${env.baseLocation}&destination_code=${env.destination}&tier=blue&number_of_passengers=${env.passegers}`,
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
		// Fetch flight data
		const result = (await Axios(config)).data;
		const outDates = result.outbound_availability;
		const returnDates = result.inbound_availability;

		// Process flight data
		const outboundAvailableDates = getAvailableDates(outDates, 9, 30, 2, 2023);
		const inboundAvailableDates = getAvailableDates(returnDates, 1, 30, 1, 2023);

		// Log results
		const checkOutFlights = !!outboundAvailableDates.length && env.check_out_flights;
		const checkReturnFlgihts = !!inboundAvailableDates.length && env.check_return_flights;
		if (checkOutFlights || checkReturnFlgihts) {
			if (checkOutFlights) {
				await sendWebhook(outboundAvailableDates, 'Outbound');
				console.log(
					'\x1b[32m%s\x1b[0m',
					`Outbound Flight found! \n${JSON.stringify(outboundAvailableDates)}.`
				);
			}

			if (checkReturnFlgihts) {
				await sendWebhook(inboundAvailableDates, 'Inbound');
				console.log(
					'\x1b[33m%s\x1b[0m',
					`Inbound Flight found! \n${JSON.stringify(inboundAvailableDates)}.`
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

function getAvailableDates(dates: { [x: string]: any }, startDay: number, endDay: number, month: number, year: number) {
	const availableDates: any[] = [];

	// Iterate through days in the specified range
	for (let day = startDay; day < endDay; day++) {
		// Construct date string in the format "YYYY-MM-DD"
		const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

		// Check the availability for the current date
		const datesAvailability = dates[date];

		// If there is availability for the current date, add it to the availableDates array
		if (!!datesAvailability) {
			availableDates.push({ [date]: datesAvailability });
		}
	}

	return availableDates;
}

setInterval(() => {
	startBa();
}, env.cooldown_time);