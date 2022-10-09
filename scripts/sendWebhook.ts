import { config as env} from '../config'
import Axios from 'axios-https-proxy-fix';

export const sendWebhook = async (dates: any[]) => {
	const data = { 
		embeds: [
			{
				color: 3093196,
				author: {
					name: 'BA Flight Finder',
					url: 'https://rewardflightfinder.com/calendar?numberOfPassengers=1&tclass=Economy&tValue=economy&jType=return&dPlace=London%20(LGW%2C%20LHR%2C%20LCY%2C%20LTN%2C%20SEN%2C%20STN)&dId=LON&aPlace=Accra%20(ACC)&aId=ACC&economy=true&premium=true&first=true&business=true',
					icon_url:
						'https://cdn.discordapp.com/attachments/1028795460892229722/1028797236483739688/british-airways-eps-vector-logo.png',
				},
				title: 'Reward Flight Found!',
				url: `https://rewardflightfinder.com/calendar?numberOfPassengers=1&tclass=Economy&tValue=economy&jType=return&dPlace=London%20(LGW%2C%20LHR%2C%20LCY%2C%20LTN%2C%20SEN%2C%20STN)&dId=LON&aPlace=Accra%20(ACC)&aId=ACC&economy=true&premium=true&first=true&business=true`,
				thumbnail: {
					url: 'https://cdn.discordapp.com/attachments/1028795460892229722/1028797236483739688/british-airways-eps-vector-logo.png',
				},
				description: JSON.stringify(dates)
			}
		]
	}
	
	const config = {
		method: 'POST',
		url: env.webhookUrl,
		headers: {
			'Content-Type': 'application/json',
		},
		data
	};

	await Axios(config);
}
