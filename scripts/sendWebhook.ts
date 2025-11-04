import { config as env } from '../config';
import Axios from 'axios-https-proxy-fix';

export const sendWebhook = async (dates: any[], flightType: string, passengers?: number) => {
	// Extract flight information from the data to build dynamic URL
	const extractFlightInfo = (dates: any[]) => {
		let sourceCode = '';
		let destinationCode = '';
		let sourceName = '';
		let destinationName = '';
		const availableClasses = { economy: false, premium: false, business: false, first: false };

		// Extract info from first available date with schedule data
		for (const dateObj of dates) {
			try {
				const dateKey = Object.keys(dateObj)[0];
				const availability = dateObj[dateKey];

				// Get schedule info
				if (availability?.schedules?.[0]) {
					const schedule = availability.schedules[0];
					sourceCode = sourceCode || schedule.source_code || '';
					destinationCode = destinationCode || schedule.destination_code || '';
					sourceName = sourceName || schedule.source || '';
					destinationName = destinationName || schedule.destination || '';
				}

				// Track available cabin classes
				if (availability?.economy?.seats) availableClasses.economy = true;
				if (availability?.premium?.seats) availableClasses.premium = true;
				if (availability?.business?.seats) availableClasses.business = true;
				if (availability?.first?.seats) availableClasses.first = true;

				// Break if we have all the info we need
				if (sourceCode && destinationCode && sourceName && destinationName) {
					break;
				}
			} catch (error) {
				continue;
			}
		}

		return { sourceCode, destinationCode, sourceName, destinationName, availableClasses };
	};

	const flightInfo = extractFlightInfo(dates);

	// Fallback to config or defaults if data extraction fails
	const sourceCode = flightInfo.sourceCode || env.baseLocation || 'LON';
	const destinationCode = flightInfo.destinationCode || env.destination || 'OPO';
	const sourceName = flightInfo.sourceName || 'London';
	const destinationName = flightInfo.destinationName || 'Porto';
	const numberOfPassengers = passengers || env.passegers || 1;

	// Determine which cabin classes to enable in URL
	const { economy, premium, business, first } = flightInfo.availableClasses;

	// Build dynamic URL
	const url = `https://rewardflightfinder.com/calendar?numberOfPassengers=${numberOfPassengers}&tclass=Economy&tValue=economy&jType=return&dPlace=${encodeURIComponent(sourceName)}&dId=${sourceCode}&aPlace=${encodeURIComponent(destinationName)}&aId=${destinationCode}&economy=${economy}&premium=${premium}&business=${business}&first=${first}`;

	// Format the dates into a nice description
	const formatDescription = (dates: any[]) => {
		const lines: string[] = [];

		dates.forEach((dateObj) => {
			try {
				// Get the date key and availability data
				const dateKey = Object.keys(dateObj)[0];
				const availability = dateObj[dateKey] || {};

				// Format the date nicely
				const dateFormatted = new Date(dateKey).toLocaleDateString('en-GB', {
					weekday: 'short',
					day: 'numeric',
					month: 'short',
					year: 'numeric',
				});

				// Build availability info with emojis
				const availabilityParts: string[] = [];

				if (availability.economy?.seats) {
					availabilityParts.push(
						`💺 **Economy:** ${availability.economy.seats} seat${
							availability.economy.seats > 1 ? 's' : ''
						}`
					);
				}

				if (availability.premium?.seats) {
					availabilityParts.push(
						`✨ **Premium:** ${availability.premium.seats} seat${
							availability.premium.seats > 1 ? 's' : ''
						}`
					);
				}

				if (availability.business?.seats) {
					availabilityParts.push(
						`💼 **Business:** ${availability.business.seats} seat${
							availability.business.seats > 1 ? 's' : ''
						}`
					);
				}

				if (availability.first?.seats) {
					availabilityParts.push(
						`👑 **First:** ${availability.first.seats} seat${
							availability.first.seats > 1 ? 's' : ''
						}`
					);
				}

				// Peak indicator - show both true and false
				const peakStatus = availability.peak === true ? ' ⭐ **Peak**' : availability.peak === false ? ' 🟢 **Off-Peak**' : '';

				// Get flight details from schedules if available
				const schedule = availability.schedules?.[0];
				let flightDetails = '';

				if (schedule) {
					const source = schedule.source || schedule.source_code || 'Unknown';
					const destination = schedule.destination || schedule.destination_code || 'Unknown';
					const departureTime = schedule.departure_time || '';
					const arrivalTime = schedule.arrival_time || '';
					const flightNumber = schedule.flight || '';

					const routeInfo = `🛫 **${source}** (${schedule.source_code || ''}) → **${destination}** (${schedule.destination_code || ''})`;
					const timeInfo = departureTime && arrivalTime ? `🕐 ${departureTime} - ${arrivalTime}` : '';
					const flightInfo = flightNumber ? `✈️ ${flightNumber}` : '';

					const detailsParts = [routeInfo, timeInfo, flightInfo].filter(Boolean);
					if (detailsParts.length > 0) {
						flightDetails = `\n${detailsParts.join(' | ')}`;
					}
				}

				// Only add line if there's availability
				if (availabilityParts.length > 0) {
					const line = `✈️ **${dateFormatted}**${peakStatus}\n${availabilityParts.join(' | ')}${flightDetails}`;
					lines.push(line);
				}
			} catch (error) {
				// If there's an error processing this date, skip it but continue with others
				console.error('Error formatting date:', error);
			}
		});

		// Fallback if no lines were generated
		return lines.length > 0 ? lines.join('\n\n') : '✈️ Flights available - check the link for details';
	};

	const data = {
		embeds: [
			{
				color: 3093196,
				author: {
					name: 'BA Flight Finder',
					url,
					icon_url:
						'https://cdn.discordapp.com/attachments/1028795460892229722/1028797236483739688/british-airways-eps-vector-logo.png',
				},
				title: `${flightType} Reward Flight Found! 🎉`,
				url,
				thumbnail: {
					url: 'https://cdn.discordapp.com/attachments/1028795460892229722/1028797236483739688/british-airways-eps-vector-logo.png',
				},
				description: formatDescription(dates),
				footer: {
					text: `Found ${dates.length} available date${dates.length > 1 ? 's' : ''}`,
				},
				timestamp: new Date().toISOString(),
			},
		],
	};

	const config = {
		method: 'POST',
		url: env.webhookUrl,
		headers: {
			'Content-Type': 'application/json',
		},
		data,
	};

	try {
		if (env.webhookUrl) {
			await Axios(config);
			console.log(`✅ Webhook sent successfully for ${flightType} flights`);
		} else {
			console.warn('⚠️ Webhook URL not configured');
		}
	} catch (error) {
		console.error('❌ Failed to send primary webhook:', error);

		// Send backup webhook with simplified message
		try {
			if (env.webhookUrl) {
				const backupData = {
					embeds: [
						{
							color: 16711680, // Red color to indicate backup
							title: `⚠️ ${flightType} Flights Available (Backup Alert)`,
							description: `**${dates.length} date${dates.length > 1 ? 's' : ''} with availability found!**\n\nThe main notification failed to format, but seats are available. Check the link below for details.`,
							url,
							footer: {
								text: 'Backup notification - Primary webhook failed'
							},
							timestamp: new Date().toISOString()
						}
					]
				};

				const backupConfig = {
					method: 'POST',
					url: env.webhookUrl,
					headers: {
						'Content-Type': 'application/json',
					},
					data: backupData,
				};

				await Axios(backupConfig);
				console.log(`✅ Backup webhook sent successfully for ${flightType} flights`);
			}
		} catch (backupError) {
			console.error('❌ Backup webhook also failed:', backupError);
			// Even if backup fails, continue the script
		}
	}
};
