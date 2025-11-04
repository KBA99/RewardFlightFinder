import axios, { AxiosRequestConfig } from 'axios-https-proxy-fix';
import { ProxyImport } from './proxy-import';
import { OptimisedLogger } from '../optimised-logger';

(async () => {
	await ProxyImport.importProxies();

	axios.interceptors.request.use((config) => {
		config.headers['request-startTime'] = process.hrtime();
		return config;
	});

	axios.interceptors.response.use((response) => {
		const start = response.config.headers['request-startTime'];
		const end = process.hrtime(start);
		const milliseconds = Math.round(end[0] * 1000 + end[1] / 1000000);
		response.headers['request-duration'] = milliseconds;
		return response;
	});

	let counter = 0;

	const proxyList = ProxyImport.axiosProxyMap.get(ProxyImport.PROXY_TYPE.secret2);

	if (!proxyList) return;

	for (let proxy of proxyList) {
		try {
			// console.log(proxy)
			const config: AxiosRequestConfig = {
				method: 'get',
				url: 'https://pubapi.livenation.com/avsc/events/0800617AA4C62A9A?app=PRD2663_EDPAPP_ICCP',
				headers: {
					accept: 'application/octet-stream',
					referer: 'https://www.ticketmaster.com/',
					'user-agent':
						'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.29 Safari/537.36',
					'x-tm-manifest-version': 'ihrrfk5apddb1v04sehktgoir8lahk5v',
					'x-tm-pricing-version': 'n9y3zupjkq3fhnzfd041ap6w9747pmz0',
				},
				proxy,
				timeout: 10000,
			};

			// let config = {
			// 	method: 'get',
			// 	maxBodyLength: Infinity,
			// 	url: 'https://pubapi.ticketmaster.com/sdk/static/manifest/v1/0C0062D9DB4A4814',
			// 	headers: {
			// 		'User-Agent':
			// 			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
			// 		DNT: '1',
			// 		Referer: 'https://www.ticketmaster.com/',
			// 	},
			// 	proxy,
			// 	timeout: 10000,
			// };

			const response = await axios(config);
			OptimisedLogger.success({
				proxy: proxy,
				speed: response.headers['request-duration'],
			});
			console.log(++counter);
		} catch (error: any) {
			OptimisedLogger.warn({
				proxy: proxy,
				message: error.message,
			});
		}
	}
})();
