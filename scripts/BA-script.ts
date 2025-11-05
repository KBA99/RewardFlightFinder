import axios from 'axios-https-proxy-fix';
import { sendWebhook } from './sendWebhook';
import { config as env } from '../config';
import { ProxyImport } from '../proxy/proxy-import';

console.log('==> Starting Script');

// Filter dates based on cabin classes
const filterByCabinClasses = (dates: any[], cabinClasses: string[]) => {
	return dates.filter((dateObj) => {
		try {
			const dateKey = Object.keys(dateObj)[0];
			const availability = dateObj[dateKey];

			// Check if any of the specified cabin classes have seats
			return cabinClasses.some((cabinClass) => {
				return availability[cabinClass]?.seats > 0;
			});
		} catch (error) {
			return false;
		}
	});
};

// Check a single flight configuration
const checkFlight = async (flightConfig: any) => {
	const {
		name,
		baseLocation,
		baseAirport,
		destination,
		destinationAirport,
		passengers,
		cabinClasses,
		outbound,
		inbound,
		webhookUrl,
	} = flightConfig;

	const config = {
		method: 'get',
		maxBodyLength: Infinity,
		url: `https://prod-apin.rewardflightfinder.com/v1/feed/availability/british-airways?source_code=${baseLocation}&destination_code=${destination}&source_airport_code=${baseAirport}&destination_airport_code=${destinationAirport}&tier=blue&number_of_passengers=${passengers}`,
		headers: {
			accept: 'application/json, text/plain, */*',
			'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
			'access-control-allow-origin': '*',
			authorization: 'cmV3YXJkX2ZsaWdodF9maW5kZXI6SERGa2ZSZXdhcmRGbGlnaHRGaW5kZXIzMjE=',
			'cache-control': 'no-cache',
			dnt: '1',
			origin: 'https://rewardflightfinder.com',
			platform: 'website',
			platform_version: '1.0.0',
			pragma: 'no-cache',
			priority: 'u=1, i',
			referer: 'https://rewardflightfinder.com/',
			'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"macOS"',
			'sec-fetch-dest': 'empty',
			'sec-fetch-mode': 'cors',
			'sec-fetch-site': 'same-site',
			'user-agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
			Cookie: 'connect.sid=s%3ANgzLIvpeQthVXdrOD9eBnIt9Ps59yfTT.EoWBIdWFVY9vf9jLsHDz84uGOCvK9RgPUdOAOEoI%2B1Q',
			proxy: ProxyImport.getRandomAxiosProxy(ProxyImport.PROXY_TYPE.xyzLive1)
		},
	};

	try {
		// Fetch flight data
		const result = (await axios(config)).data;
		const outDates = result.outbound_availability;
		const returnDates = result.inbound_availability;

		let foundFlights = false;

		// Process outbound flights
		if (outbound?.enabled && outDates) {
			let outboundAvailableDates = getAvailableDatesV2(
				outDates,
				outbound.startDay,
				outbound.startMonth,
				outbound.startYear,
				outbound.endDay,
				outbound.endMonth,
				outbound.endYear
			);

			// Filter by cabin classes if specified
			if (cabinClasses && cabinClasses.length > 0) {
				outboundAvailableDates = filterByCabinClasses(outboundAvailableDates, cabinClasses);
			}

			if (outboundAvailableDates.length > 0) {
				foundFlights = true;
				await sendWebhook(outboundAvailableDates, `${name} - Outbound`, passengers, webhookUrl);
				console.log(
					'\x1b[32m%s\x1b[0m',
					`[${name}] Outbound Flight found! ${outboundAvailableDates.length} date(s) available in ${cabinClasses.join(', ')}.`
				);
			}
		}

		// Process inbound flights
		if (inbound?.enabled && returnDates) {
			let inboundAvailableDates = getAvailableDatesV2(
				returnDates,
				inbound.startDay,
				inbound.startMonth,
				inbound.startYear,
				inbound.endDay,
				inbound.endMonth,
				inbound.endYear
			);

			// Filter by cabin classes if specified
			if (cabinClasses && cabinClasses.length > 0) {
				inboundAvailableDates = filterByCabinClasses(inboundAvailableDates, cabinClasses);
			}

			if (inboundAvailableDates.length > 0) {
				foundFlights = true;
				await sendWebhook(inboundAvailableDates, `${name} - Inbound`, passengers, webhookUrl);
				console.log(
					'\x1b[33m%s\x1b[0m',
					`[${name}] Inbound Flight found! ${inboundAvailableDates.length} date(s) available in ${cabinClasses.join(', ')}.`
				);
			}
		}

		if (!foundFlights) {
			console.log('\x1b[90m%s\x1b[0m', `[${name}] No flights found.`);
		}
	} catch (error) {
		console.error(`\x1b[31m[${name}] Error:\x1b[0m`, error);
	}
};

const startBa = async () => {
	console.log(`\n${new Date().toLocaleString()} - Checking for reward flights...`);

	// Check if using new multi-flight config
	if (env.flights && env.flights.length > 0) {
		// Check each enabled flight configuration
		const enabledFlights = env.flights.filter((flight: any) => flight.enabled !== false);

		if (enabledFlights.length === 0) {
			console.log('\x1b[33m%s\x1b[0m', 'No enabled flights in configuration');
			return;
		}

		console.log(`Checking ${enabledFlights.length} flight route(s)...\n`);

		// Check all flights in parallel for faster execution
		await Promise.all(enabledFlights.map((flight: any) => checkFlight(flight)));
	} else {
		// Fallback to legacy single-flight mode
		console.log('Using legacy single-flight mode');
		const legacyConfig = {
			name: 'Legacy Flight',
			baseLocation: env.baseLocation,
			baseAirport: env.baseLocation,
			destination: env.destination,
			destinationAirport: env.destination,
			passengers: env.passegers || 1,
			cabinClasses: ['economy', 'premium', 'business', 'first'], // Check all classes in legacy mode
			outbound: {
				enabled: env.check_out_flights,
				startDay: 10,
				startMonth: 11,
				startYear: 2025,
				endDay: 30,
				endMonth: 11,
				endYear: 2025,
			},
			inbound: {
				enabled: env.check_return_flights,
				startDay: 16,
				startMonth: 11,
				startYear: 2025,
				endDay: 16,
				endMonth: 11,
				endYear: 2025,
			},
		};
		await checkFlight(legacyConfig);
	}

	console.log(`\nNext check in ${env.cooldown_time / 1000} seconds...`);
};

/**
 * V2 of getAvailableDates that supports date ranges across multiple months
 * @param dates - The availability data object
 * @param startDay - Starting day of the month (1-31)
 * @param startMonth - Starting month (1-12)
 * @param startYear - Starting year
 * @param endDay - Ending day of the month (1-31)
 * @param endMonth - Ending month (1-12)
 * @param endYear - Ending year
 * @returns Array of available dates within the specified range
 *
 * Example: getAvailableDatesV2(dates, 20, 12, 2025, 15, 1, 2026)
 * This will check from December 20, 2025 to January 15, 2026
 */
function getAvailableDatesV2(
	dates: { [x: string]: any },
	startDay: number,
	startMonth: number,
	startYear: number,
	endDay: number,
	endMonth: number,
	endYear: number
) {
	const availableDates: any[] = [];

	// Create start and end date objects
	const startDate = new Date(startYear, startMonth - 1, startDay);
	const endDate = new Date(endYear, endMonth - 1, endDay);

	// Iterate through each day in the range
	const currentDate = new Date(startDate);
	while (currentDate <= endDate) {
		// Construct date string in the format "YYYY-MM-DD"
		const year = currentDate.getFullYear();
		const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
		const day = currentDate.getDate().toString().padStart(2, '0');
		const dateString = `${year}-${month}-${day}`;

		// Check the availability for the current date
		const datesAvailability = dates[dateString];

		// If there is availability for the current date, add it to the availableDates array
		if (!!datesAvailability) {
			availableDates.push({ [dateString]: datesAvailability });
		}

		// Move to the next day
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return availableDates;
}

setInterval(() => {
	startBa();
}, env.cooldown_time);
