import fs from 'fs';
import path from 'path';
import { OptimisedLogger } from '../optimised-logger';
import { AxiosProxyConfig } from 'axios';

export class ProxyImport {
	private static readonly immutableAxiosProxyConfigMap: Map<string, AxiosProxyConfig[]> =
		new Map();

	public static axiosProxyMap: Map<string, AxiosProxyConfig[]> = new Map();
	public static splitProxiesArray: string[] = [];
	public static isProxyImported: boolean = false;

	static readonly PROXY_TYPE = {
		xyzBinned1: 'xyz-binned-1',
		xyzBinned2: 'xyz-binned-2',
		xyzBinned3: 'xyz-binned-3',
		xyzLive1: 'xyz-live-1',
		xyzLive2: 'xyz-live-2',
		secret1: 'secret-1',
		secret2: 'secret-2',
		koch: 'koch',
		bart: 'bart',
		packetstream: 'packetstream',
		packetstreamGB: 'packetstream-gb',
		rampage: 'rampage',
		privateTabs: 'private-tabs',
		vital: 'vital',
		mpp: 'mpp',
		zetta1: 'zetta-1',
		zetta2: 'zetta-2',
		lemon: 'lemon',
		testingProxies: 'testing-proxies',
	};

	static formatStringToAxiosConfig(proxy: string): AxiosProxyConfig {
		const [host, port, username, password] = proxy?.split(':');

		return {
			protocol: 'http',
			host,
			port: +port,
			auth: {
				username,
				password: password?.split('\r')[0],
			},
		};
	}

	static formatAxiosConfigToString(proxy?: AxiosProxyConfig): string {
		if (proxy) {
			return `${proxy.host}:${proxy.port}:${proxy.auth?.username}:${proxy.auth?.password}`;
		} else {
			return '';
		}
	}

	static formatGotProxyToAxiosProxyFormat(proxyUrl?: string): AxiosProxyConfig | undefined {
		if (proxyUrl) {
			if (!proxyUrl) {
				throw new Error('No proxy is undefined');
			}

			const matches = proxyUrl.match(/(http):\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);

			if (!matches) {
				throw new Error('Invalid proxy URL format');
			}

			const protocol = matches[1];
			const username = matches[2];
			const password = matches[3].split('\r')[0]; // Split to handle potential carriage return
			const host = matches[4];
			const port = +matches[5]; // Convert port to a number

			return {
				protocol: protocol,
				host: host,
				port: port,
				auth:
					username && password
						? {
								username: username,
								password: password,
						  }
						: undefined,
			};
		}
	}

	static formatAxiosProxyToGotProxyFormat(axiosProxy: AxiosProxyConfig): string {
		const { protocol, host, port, auth } = axiosProxy;

		let proxyUrl;

		if (auth?.username && auth?.password) {
			proxyUrl = `http://${auth?.username}:${auth?.password}@${host}:${port}`;
		} else {
			proxyUrl = `http://${host}:${port}`;
		}

		return proxyUrl;
	}

	static getRandomAxiosProxy = (type: string) => {
		if (!ProxyImport.isProxyImported) {
			ProxyImport.importProxies();
		}
		const proxies = ProxyImport.axiosProxyMap.get(type);
		if (!proxies || proxies.length == 0) {
			const immutableProxies = ProxyImport.immutableAxiosProxyConfigMap.get(type);
			if (!immutableProxies) throw new Error('No proxy of requested type available.');
			ProxyImport.axiosProxyMap.set(type, Array.from(immutableProxies));
		}
		const proxyArray = ProxyImport.axiosProxyMap.get(type)!;
		const arrayIndex = Math.floor(Math.random() * proxyArray.length);
		const randomProxy = proxyArray.splice(arrayIndex, 1)[0];
		if (!randomProxy) throw new Error('No proxy available.');
		return randomProxy;
	};

	static getRandomGotProxy = (type: string) => {
		if (!ProxyImport.isProxyImported) {
			ProxyImport.importProxies();
		}
		const proxies = ProxyImport.axiosProxyMap.get(type);
		if (!proxies || proxies.length == 0) {
			const immutableProxies = ProxyImport.immutableAxiosProxyConfigMap.get(type);
			if (!immutableProxies) throw new Error('No proxy of requested type available.');
			ProxyImport.axiosProxyMap.set(type, Array.from(immutableProxies));
		}
		const proxyArray = ProxyImport.axiosProxyMap.get(type)!;
		const arrayIndex = Math.floor(Math.random() * proxyArray.length);
		const randomProxy = proxyArray.splice(arrayIndex, 1)[0];
		if (!randomProxy) throw new Error('No proxy available.');

		let proxyUrl;

		if (randomProxy.auth?.username && randomProxy.auth?.password) {
			proxyUrl = `http://${randomProxy.auth?.username}:${randomProxy.auth?.password}@${randomProxy.host}:${randomProxy.port}`;
		} else {
			proxyUrl = `http://${randomProxy.host}:${randomProxy.port}`;
		}

		if (ProxyImport.isValidProxyUrl(proxyUrl)) {
			return proxyUrl;
		} else {
			throw new Error(`Unable to get a valid proxy: ${randomProxy}`);
		}
	};

	static isValidProxyUrl(proxyUrl: string) {
		try {
			// Parse the URL
			const url = new URL(proxyUrl);

			// Extract components from the URL
			const hasAuth = url.username && url.password;
			const hasHost = url.hostname;
			const hasPort = url.port;

			// Validate that it uses the http or https protocol
			const isValidProtocol = url.protocol === 'http:' || url.protocol === 'https:';

			// If authentication is provided, check its format
			let hasValidAuthFormat = true;
			if (hasAuth) {
				const authPattern = /.*:.*@/;
				hasValidAuthFormat = authPattern.test(
					proxyUrl.substring(0, proxyUrl.indexOf('@') + 1)
				);
			}

			// Return true only if all necessary validations pass
			return hasHost && hasPort && isValidProtocol && hasValidAuthFormat;
		} catch (error) {
			// If URL parsing fails, the URL is not valid
			return false;
		}
	}

	static importProxies = async () => {
		Object.values(ProxyImport.PROXY_TYPE).forEach((type) => {
			const pathToProxy = path.join(__dirname, 'proxy-files', `${type}.txt`);
			if (fs.existsSync(pathToProxy)) {
				const importedProxies = fs.readFileSync(pathToProxy, 'utf8').trim();
				if (importedProxies) {
					const splitProxiesArray = importedProxies.split('\n');
					const proxiesCount = splitProxiesArray.length;
					const formattedProxies = splitProxiesArray.map((proxy) => {
						const [host, port, username, password] = proxy.split(':');
						return {
							protocol: 'http',
							host,
							port: +port,
							auth: { username, password: password?.split('\r')[0] },
						};
					});
					ProxyImport.immutableAxiosProxyConfigMap.set(type, formattedProxies);
					const deepCopiedProxies = formattedProxies.map((proxy) => ({
						...proxy,
						auth: { ...proxy.auth },
					}));
					ProxyImport.axiosProxyMap.set(type, deepCopiedProxies);
					OptimisedLogger.info(`${proxiesCount} proxies imported for type: ${type}`);
				} else {
					OptimisedLogger.info(`No proxies found for type: ${type}`);
				}
			} else {
				OptimisedLogger.info(`Proxy file not found for type: ${type}`);
			}
		});
		ProxyImport.isProxyImported = true;
	};
}
