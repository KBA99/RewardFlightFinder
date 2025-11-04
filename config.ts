export const config = {
	cooldown_time: 20_000, // ms, 20_000 = 20 seconds
	webhookUrl: 'https://discord.com/api/webhooks/1435281925009838095/db9FH8YLRYT82FXn527iqrHCO9iWrVnFsYrJJXfghnaCTWwKHs5me4-_ofbpn0q6OBco',

	// Legacy config for backwards compatibility
	check_out_flights: true,
	check_return_flights: false,
	baseLocation: 'LON',
	destination: 'OPO',
	passegers: 1,

	// New multi-flight configuration
	flights: [
		{
			name: 'London to Porto',
			enabled: true,
			baseLocation: 'LON',
			baseAirport: 'LGW',
			destination: 'OPO',
			destinationAirport: 'OPO',
			passengers: 1,
			outbound: {
				enabled: true,
				startDay: 14,
				startMonth: 11,
				startYear: 2025,
				endDay: 14,
				endMonth: 11,
				endYear: 2025,
			},
			inbound: {
				enabled: true,
				startDay: 16,
				startMonth: 11,
				startYear: 2025,
				endDay: 16,
				endMonth: 11,
				endYear: 2025,
			},
		},
		// Example: Add more flight configurations here
		// {
		// 	name: 'London to New York',
		// 	enabled: true,
		// 	baseLocation: 'LON',
		// 	baseAirport: 'LHR',
		// 	destination: 'NYC',
		// 	destinationAirport: 'JFK',
		// 	passengers: 2,
		// 	outbound: {
		// 		enabled: true,
		// 		startDay: 1,
		// 		startMonth: 12,
		// 		startYear: 2025,
		// 		endDay: 15,
		// 		endMonth: 12,
		// 		endYear: 2025,
		// 	},
		// 	inbound: {
		// 		enabled: true,
		// 		startDay: 20,
		// 		startMonth: 12,
		// 		startYear: 2025,
		// 		endDay: 31,
		// 		endMonth: 12,
		// 		endYear: 2025,
		// 	},
		// },
		// {
		// 	name: 'London to Tokyo',
		// 	enabled: true,
		// 	baseLocation: 'LON',
		// 	baseAirport: 'LHR',
		// 	destination: 'TYO',
		// 	destinationAirport: 'HND',
		// 	passengers: 1,
		// 	outbound: {
		// 		enabled: true,
		// 		startDay: 15,
		// 		startMonth: 1,
		// 		startYear: 2026,
		// 		endDay: 28,
		// 		endMonth: 2,
		// 		endYear: 2026,
		// 	},
		// 	inbound: {
		// 		enabled: false, // Only check outbound
		// 	},
		// },
	],
}
