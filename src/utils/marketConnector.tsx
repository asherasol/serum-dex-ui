export default class MarketApi {
  static URL: string = 'https://api.asherasol.com/';

  static async get(path: string) {
    try {
      const response = await fetch(this.URL + path);
      if (response.ok) {
        const responseJson = await response.json();
        return responseJson.success ? responseJson.data : null;
      }
    } catch (err) {
      console.log(`Error fetching from market API ${path}: ${err}`);
    }
    return null;
  }

  static async getAllMarkets(): Promise<[]> {
    return MarketApi.get(`markets`);
  }

  static async getDataMarkets(
    marketAddress: string,
  ): Promise<[] | null> {
    return MarketApi.get(`markets/data/${marketAddress}`);
  }
}

export const MARKET_DATA_FEED = 'https://api.asherasol.com/';
