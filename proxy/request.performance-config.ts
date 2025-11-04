import { AxiosRequestConfig } from 'axios';

export const performanceConfig: AxiosRequestConfig = {
	method: 'get',
	url: 'https://www.google.co.uk/',
	headers: {
		accept: 'application/json, text/plain, */*',
	},
};
