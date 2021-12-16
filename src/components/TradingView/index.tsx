import * as React from 'react';
import './index.css';
import {
  widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
} from '../../charting_library';
import { useMarket, USE_MARKETS } from '../../utils/markets';
import * as saveLoadAdapter from './saveLoadAdapter';
import { flatten } from '../../utils/utils';
import { BONFIDA_DATA_FEED } from '../../utils/bonfidaConnector';

export interface ChartContainerProps {
  symbol: ChartingLibraryWidgetOptions['symbol'];
  interval: ChartingLibraryWidgetOptions['interval'];
  auto_save_delay: ChartingLibraryWidgetOptions['auto_save_delay'];

  // BEWARE: no trailing slash is expected in feed URL
  // datafeed: any;
  datafeedUrl: string;
  libraryPath: ChartingLibraryWidgetOptions['library_path'];
  chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url'];
  chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version'];
  clientId: ChartingLibraryWidgetOptions['client_id'];
  userId: ChartingLibraryWidgetOptions['user_id'];
  fullscreen: ChartingLibraryWidgetOptions['fullscreen'];
  autosize: ChartingLibraryWidgetOptions['autosize'];
  studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides'];
  containerId: ChartingLibraryWidgetOptions['container_id'];
  theme: string;
}

export interface ChartContainerState {}

export const TVChartContainer = () => {
  // let datafeed = useTvDataFeed();
  
  // Get data from localstorage
  let arr_theme = {mode: 'dark'};
  const theme_strg = localStorage.getItem('theme');
  if (theme_strg) {
    arr_theme = (JSON.parse(theme_strg));
  }
  const [theme, setheme] = React.useState(arr_theme);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      const saved_theme = localStorage.getItem('theme');
      if (saved_theme) {
        if(JSON.parse(saved_theme).mode !== theme.mode) {
          setheme(JSON.parse(saved_theme));
        }
      }
    }, 3000);
    return () => {
      clearInterval(intervalId); //This is important
    }
  }, [theme]);

  const defaultProps: ChartContainerProps = {
    symbol: 'BTC/USDC',
    // @ts-ignore
    interval: '60',
    auto_save_delay: 5,
    theme: theme.mode,
    containerId: 'tv_chart_container',
    // datafeed: datafeed,
    libraryPath: '/charting_library/',
    chartsStorageApiVersion: '1.1',
    clientId: 'tradingview.com',
    userId: 'public_user_id',
    fullscreen: false,
    autosize: true,
    datafeedUrl: BONFIDA_DATA_FEED,
    studiesOverrides: {},
  };

  const tvWidgetRef = React.useRef<IChartingLibraryWidget | null>(null);
  const { market } = useMarket();
  const marketAddress = market?.address.toBase58();

  const chartProperties = JSON.parse(
    localStorage.getItem('chartproperties') || '{}',
  );

  React.useEffect(() => {
    const savedProperties = flatten(chartProperties, {
      restrictTo: ['scalesProperties', 'paneProperties', 'tradingProperties'],
    });
    const bg_toolbar = defaultProps.theme === 'dark' ? '#222c35' : '#ffffff00';
    const bg = defaultProps.theme === 'dark' ? '#222c35' : '#fff';
    const color = defaultProps.theme === 'dark' ? '#fff' : '#000';
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol:
        USE_MARKETS.find(
          (m) => m.address.toBase58() === market?.publicKey.toBase58(),
        )?.name || 'SRM/USDC',
      // BEWARE: no trailing slash is expected in feed URL
      // tslint:disable-next-line:no-any
      // @ts-ignore
      // datafeed: datafeed,
      // @ts-ignore
      datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(
        defaultProps.datafeedUrl,
      ),
      interval: defaultProps.interval as ChartingLibraryWidgetOptions['interval'],
      container_id: defaultProps.containerId as ChartingLibraryWidgetOptions['container_id'],
      library_path: defaultProps.libraryPath as string,
      auto_save_delay: 5,
      locale: 'en',
      disabled_features: [
        'use_localstorage_for_settings',
      ],
      enabled_features: ['study_templates'],
      load_last_chart: true,
      client_id: defaultProps.clientId,
      user_id: defaultProps.userId,
      fullscreen: defaultProps.fullscreen,
      autosize: defaultProps.autosize,
      studies_overrides: defaultProps.studiesOverrides,
      theme: defaultProps.theme === 'dark' ? 'Dark' : 'Light',
      toolbar_bg: bg_toolbar,
      overrides: {
        ...savedProperties,
        "paneProperties.background": bg,
        "paneProperties.backgroundType": "solid",
        'mainSeriesProperties.candleStyle.upColor': '#41C77A',
        'mainSeriesProperties.candleStyle.downColor': '#F23B69',
        'mainSeriesProperties.candleStyle.borderUpColor': '#41C77A',
        'mainSeriesProperties.candleStyle.borderDownColor': '#F23B69',
        'mainSeriesProperties.candleStyle.wickUpColor': '#41C77A',
        'mainSeriesProperties.candleStyle.wickDownColor': '#F23B69',
        "scalesProperties.textColor": color,
      },
      loading_screen: {
        backgroundColor: "transparent",
      },
      // @ts-ignore
      save_load_adapter: saveLoadAdapter,
      settings_adapter: {
        initialSettings: {
          'trading.orderPanelSettingsBroker': JSON.stringify({
            showRelativePriceControl: false,
            showCurrencyRiskInQty: false,
            showPercentRiskInQty: false,
            showBracketsInCurrency: false,
            showBracketsInPercent: false,
          }),
          // "proterty"
          'trading.chart.proterty':
            localStorage.getItem('trading.chart.proterty') ||
            JSON.stringify({
              hideFloatingPanel: 1,
            }),
          'chart.favoriteDrawings':
            localStorage.getItem('chart.favoriteDrawings') ||
            JSON.stringify([]),
          'chart.favoriteDrawingsPosition':
            localStorage.getItem('chart.favoriteDrawingsPosition') ||
            JSON.stringify({}),
        },
        setValue: (key, value) => {
          localStorage.setItem(key, value);
        },
        removeValue: (key) => {
          localStorage.removeItem(key);
        },
      },
    };

    const tvWidget = new widget(widgetOptions);
    tvWidget.onChartReady(() => {
      //tvWidget.addCustomCSSFile('css/my-custom-css.css')
      tvWidgetRef.current = tvWidget;
      //tvWidgetRef.current.chart().setChartType(3);
      tvWidget
        // @ts-ignore
        .subscribe('onAutoSaveNeeded', () => tvWidget.saveChartToServer());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketAddress, theme]);

  return <div id={defaultProps.containerId} className={'TVChartContainer'} />;
};
