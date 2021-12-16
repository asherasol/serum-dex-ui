import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Button, Col, Row, Select, Typography, Card, Switch, Table, Skeleton, Tag } from 'antd';
import styled from 'styled-components';
import Orderbook from '../components/Orderbook';
import UserInfoTable from '../components/UserInfoTable';
import StandaloneBalancesDisplay from '../components/StandaloneBalancesDisplay';
import {
  getMarketInfos,
  getTradePageUrl,
  MarketProvider,
  useMarket,
  useMarketsList,
  useUnmigratedDeprecatedMarkets,
} from '../utils/markets';
import markets_ashera from '../markets.json';
import TradeForm from '../components/TradeForm';
import TradesTable from '../components/TradesTable';
import DeprecatedMarketsInstructions from '../components/DeprecatedMarketsInstructions';
import {
  DeleteOutlined,
  HeartFilled,
  BulbFilled,
  StarFilled,
  ArrowDownOutlined,
  ArrowUpOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import CustomMarketDialog from '../components/CustomMarketDialog';
import MyTokenDialog from '../components/MyTokenDialog';
import { notify } from '../utils/notifications';
import { useHistory, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';

import { useThemeSwitcher } from 'react-css-theme-switcher';
import { TVChartContainer } from '../components/TradingView';
import FloatingElement from '../components/layout/FloatingElement';
import MarketApi from '../utils/marketConnector';
// Use following stub for quick setup without the TradingView private dependency
// function TVChartContainer() {
//   return <></>
// }

const { Option, OptGroup } = Select;

const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 16px;
  .borderNone .ant-select-selector {
    border: none !important;
  }
`;

export default function TradePage() {
  const { marketAddress } = useParams();
  useEffect(() => {
    if (marketAddress) {
      localStorage.setItem('marketAddress', JSON.stringify(marketAddress));
    }
  }, [marketAddress]);
  const history = useHistory();
  function setMarketAddress(address) {
    history.push(getTradePageUrl(address));
  }

  return (
    <MarketProvider
      marketAddress={marketAddress}
      setMarketAddress={setMarketAddress}
    >
      <TradePageInner />
    </MarketProvider>
  );
}

function TradePageInner() {
  const {
    market,
    marketName,
    customMarkets,
    setCustomMarkets,
    setMarketAddress,
  } = useMarket();
  const markets = useMarketsList();
  const [handleDeprecated, setHandleDeprecated] = useState(false);
  const [addMarketVisible, setAddMarketVisible] = useState(false);
  const [addMyTokenVisible, setAddMyTokenVisible] = useState(false);
  const deprecatedMarkets = useUnmigratedDeprecatedMarkets();
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });

  markets.map(data => {
    // eslint-disable-next-line array-callback-return
    markets_ashera.map(ashera => {
      if(ashera.name === data.name) {
        data['image'] = ashera.image;
      }
    });
    return data;
  });

  useEffect(() => {
    document.title = marketName ? `${marketName} — Ashera Dex` : 'Ashera Dex';
  }, [marketName]);

  const changeOrderRef = useRef<
    ({ size, price }: { size?: number; price?: number }) => void
  >();

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const width = dimensions?.width;
  const componentProps = {
    onChangeOrderRef: (ref) => (changeOrderRef.current = ref),
    onPrice: useCallback(
      (price) => changeOrderRef.current && changeOrderRef.current({ price }),
      [],
    ),
    onSize: useCallback(
      (size) => changeOrderRef.current && changeOrderRef.current({ size }),
      [],
    ),
  };
  const component = (() => {
    if (handleDeprecated) {
      return (
        <DeprecatedMarketsPage
          switchToLiveMarkets={() => setHandleDeprecated(false)}
        />
      );
    } else if (width < 1000) {
      return <RenderSmaller {...componentProps} />;
    } else if (width < 1450) {
      return <RenderSmall {...componentProps} />;
    } else {
      return <RenderNormal {...componentProps} />;
    }
  })();

  const onAddCustomMarket = (customMarket) => {
    const marketInfo = getMarketInfos(customMarkets).some(
      (m) => m.address.toBase58() === customMarket.address,
    );
    if (marketInfo) {
      notify({
        message: `A market with the given ID already exists`,
        type: 'error',
      });
      return;
    }
    const newCustomMarkets = [...customMarkets, customMarket];
    setCustomMarkets(newCustomMarkets);
    setMarketAddress(customMarket.address);
  };

  const onDeleteCustomMarket = (address) => {
    const newCustomMarkets = customMarkets.filter((m) => m.address !== address);
    setCustomMarkets(newCustomMarkets);
  };

  const { switcher } = useThemeSwitcher();

  // Theme mode handle
  const saved = localStorage.getItem('theme');
  let theme = {mode:'dark'};
  if (saved) {
    theme = JSON.parse(saved);
  } else {
    localStorage.setItem('theme', JSON.stringify({mode: 'dark'}));
  }
  const onChangeMode = (value) => {
    if(value) {
      switcher({ theme: 'light' });
      localStorage.setItem('theme', JSON.stringify({mode: 'light'}));
    } else {
      switcher({ theme: 'dark' });
      localStorage.setItem('theme', JSON.stringify({mode: 'dark'}));
    }
  };

  // Snow mode handle
  const SnowSwitch = () => {
    const [snow, setSnow] = useState({status: false, enable: false});
    /* useEffect(() => {
      const intervalId = setInterval(() => {
        const saved_snow = localStorage.getItem('snow');
        if (saved_snow) {
          const saved_snow_arr = JSON.parse(saved_snow);
          if(saved_snow_arr.enable && !snow.enable) {
            setSnow({status: saved_snow_arr.status, enable: true});
          }
        }
      }, 1000);
      return () => {
        clearInterval(intervalId); //This is important
      }
    }, [snow.enable]); */

    const onChangeSnow = (value) => {
      setSnow({status: value, enable: true});
      localStorage.setItem('snow', JSON.stringify({status: value, enable: true}));
    };
    return (
      <Col>
        <Switch
          checkedChildren={<HeartFilled />}
          unCheckedChildren={<HeartFilled />}
          defaultChecked={snow.status}
          onChange={onChangeSnow}
        />
      </Col>
    );
  }

  // Market Info
  const { Text } = Typography;
  const columns = [
    {
      title: 'Market',
      dataIndex: 'market',
      key: 'market',
      className: 'align-left',
      width: '30%',
      render: market => (
        <>
          <div className={`pointer ${market.active ? "mkt-active" : ""}`} onClick={() => {
            setHandleDeprecated(false);
            setMarketAddress(market.address);
          }}>
            <Avatar
              size={20}
              src={market.icon}
              style={{marginRight:'5px'}}
              shape="square"
            />
            {market.name}
          </div>
        </>
      )
    },
    {
      title: 'Last Price',
      dataIndex: 'lastprice',
      key: 'lastprice',
      className: 'align-right',
      width: '30%'
    },
    {
      title: '24h Chg',
      dataIndex: 'chg24',
      key: 'chg24',
      className: 'align-right',
      width: '20%',
      render: chg24 => (
        <>
          {
            (chg24 < 0) ?
            <Text className="color-red">{chg24} %</Text> :
            <Text className="color-green">{chg24} %</Text>
          }
        </>
      )
    },
    {
      title: '24h Vol',
      dataIndex: 'vol24',
      key: 'vol24',
      className: 'align-right',
      width: '20%'
    },
  ];
  const [dataSource, setDataSource] = useState([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [mktinfoLoading, setMktinfoLoading] = useState(true);
  const marketAddress = market?.address.toBase58();
  const [mktName, setMktName] = useState('');
  const [mktSymbol, setMktSymbol] = useState('');
  const [mktBase, setMktBase] = useState('');
  const [mktIcon, setMktIcon] = useState('');
  const [mktLastPrice, setMktLastPrice] = useState(0);
  const [mktHighPrice, setMktmktHighPrice] = useState(0);
  const [mktLowPrice, setMktmktLowPrice] = useState(0);
  const [mktVolume24, setMktmktVolume24] = useState('');
  const [mktPrice24, setMktmktPrice24] = useState('');
  const [mktChange24, setMktChange24] = useState(0);
  const [mktChange24Perc, setMktChangePerc24] = useState('');
  const [mktClassColor, setMktClassColor] = useState('color-green');
  useEffect(() => {
    function nFormatter(num, digits) {
      const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "K" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "G" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
      ];
      const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
      var item = lookup.slice().reverse().find(function(item) {
        return num >= item.value;
      });
      return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    }
    async function getDataMarkets(fromInterval = true) {
      if(!fromInterval) {
        setMktinfoLoading(true);
      }
      let market_main_list = [] as any;
      for (let i = 0; i < markets_ashera.length; i++) {
        market_main_list[i] = markets_ashera[i]?.address;
      }
      const allMarketsData = await MarketApi.getAllMarkets() as  any;
      if(allMarketsData === null || allMarketsData === undefined) {
        return;
      }
      let dataMarket = [] as  any;
      for (let i = 0; i < allMarketsData.length; i++) {
        if(!market_main_list.includes(allMarketsData[i]?.address)) {
          continue;
        }
        const lastprice = allMarketsData[i]?.hourSummary?.newPrice;
        const oldPrice = allMarketsData[i]?.hourSummary?.oldPrice;
        const market = allMarketsData[i]?.nameEn;
        const address = allMarketsData[i]?.address;
        const icon = allMarketsData[i]?.iconUrl;
        const vol24 = allMarketsData[i]?.summary?.volume;
        const chg24 = (lastprice - oldPrice)/oldPrice * 100;
        let marketActive = false;
        if(localStorage.getItem('marketAddress')?.replaceAll('"', '') === allMarketsData[i]?.address || 
            (localStorage.getItem('marketAddress')?.replaceAll('"', '') === undefined && 
            marketAddress === allMarketsData[i]?.address)
          ) {
          const classColor = (lastprice - oldPrice) < 0 ? 'color-red' : 'color-green';
          setMktClassColor(classColor);
          setMktName(allMarketsData[i]?.nameEn);
          setMktSymbol(allMarketsData[i]?.symbol);
          setMktBase(allMarketsData[i]?.base);
          setMktIcon(allMarketsData[i]?.iconUrl);
          setMktLastPrice(parseFloat(allMarketsData[i]?.hourSummary?.newPrice));
          setMktmktHighPrice(allMarketsData[i]?.summary?.highPrice);
          setMktmktLowPrice(allMarketsData[i]?.summary?.lowPrice);
          const volume24 = allMarketsData[i]?.summary?.volume / allMarketsData[i]?.hourSummary?.newPrice;
          setMktmktVolume24(nFormatter(volume24,2));
          setMktmktPrice24(nFormatter(allMarketsData[i]?.summary?.volume, 2));
          const change24Price = parseFloat(lastprice) - parseFloat(oldPrice);
          setMktChange24(+change24Price.toFixed(9));
          setMktChangePerc24(((lastprice - oldPrice)/oldPrice * 100).toFixed(2));
          setMktinfoLoading(false);
          marketActive = true;
        }
        dataMarket[dataMarket.length] = {market: {address: address, name: market, icon: icon, active: marketActive}, lastprice:parseFloat(lastprice), chg24: chg24.toFixed(2), vol24: nFormatter(vol24, 2)};
      }
      
      setDataSource(dataMarket);
      setMarketLoading(false);
    }
    getDataMarkets(false);
    const id = setInterval(getDataMarkets, 20_000);
    return () => clearInterval(id);
  }, [marketAddress]);

  return (
    <>
      <CustomMarketDialog
        visible={addMarketVisible}
        onClose={() => setAddMarketVisible(false)}
        onAddCustomMarket={onAddCustomMarket}
      />
      <MyTokenDialog
        visible={addMyTokenVisible}
        onClose={() => setAddMyTokenVisible(false)}
      />
      <Wrapper>
        <Row
          align="middle"
          style={{ paddingLeft: 5, paddingRight: 5, paddingBottom: 10 }}
          gutter={16}
        >
          <Col>
            <Switch
              checkedChildren={<BulbFilled />}
              unCheckedChildren={<StarFilled />}
              defaultChecked={theme.mode === 'dark' ? false : true}
              onChange={onChangeMode}
            />
          </Col>
          <SnowSwitch />

          <Col style={{marginLeft: 'auto'}}>
            <Button 
              type="primary" 
              icon={<WalletOutlined />}
              style={{color: '#163F52', borderRadius: '8px'}}
              onClick={() => setAddMyTokenVisible(true)}>
              { width > 450 && 'My Token'}
            </Button>
          </Col>
        </Row>
        <Row>
          <Col xs={24} sm={24} md={16} style={{ height: '100%' }}>
            <FloatingElement>
              <Row>
                {
                  mktinfoLoading ?
                  <Skeleton />
                  :
                  <>
                    <Col xl={24} lg={24}  md={24} xxl={24} sm={24} xs={24}
                      style={{ borderBottom: '2px solid rgb(67, 74, 89)', marginBottom: '20px'}}>
                      <span className='color-title' style={{ fontWeight: 'bold', fontSize: '20px', marginRight: '6px'}}>
                      <Avatar
                        src={mktIcon}
                        style={{marginRight:'5px', marginBottom: '5px'}}
                        shape="square"
                      />
                      {mktName}
                      </span>
                      {mktSymbol}
                      <Tag color="green" style={{ marginLeft: '6px'}}>Main Market</Tag>
                    </Col>
                    <Col xl={8} lg={8} md={8} xxl={8} sm={24} xs={24}>
                      <div>
                        <div>
                          <div style={{letterSpacing: '1px', marginTop: '20px', fontWeight: 'bold', lineHeight: '120%'}}>
                            <span className={mktClassColor} style={{fontSize: '32px'}}>{mktLastPrice}</span>
                            <span className={mktClassColor} style={{fontSize: '14px'}}>USDC</span>
                          </div>
                          <div style={{lineHeight: '120%', marginTop: '3px'}}>
                            <span className={mktClassColor} style={{fontSize: '11px'}}>Change</span>
                            <span className={mktClassColor} style={{marginLeft: '5px', marginRight: '5px', fontSize: '14px'}}>
                              {mktChange24Perc}%
                            </span>
                            <span className={mktClassColor} style={{fontWeight: 'bold'}}>
                              {
                                mktClassColor === 'color-green' ?
                                <ArrowUpOutlined  style={{marginRight: '5px', fontSize: '15px'}}/>
                                :
                                <ArrowDownOutlined  style={{marginRight: '5px', fontSize: '15px'}}/>
                              }
                              {mktChange24}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Col>
                    <Col xl={16} lg={16} md={16} xxl={16} sm={24} xs={24} style={{textAlign: 'right'}}>
                      <Row style={{marginTop: '5px'}}>
                        <Col xl={6} lg={6} md={6} xxl={6} sm={12} xs={12}>High Price</Col>
                        <Col xl={6} lg={6} md={6} xxl={6} sm={12} xs={12}
                          className='color-green'
                          style={{borderBottom: '1px solid rgb(67, 74, 89)', fontWeight: 'bold'}}>
                            {mktHighPrice}
                        </Col>
                        <Col xl={6} lg={6} md={6} xxl={6} sm={12} xs={12}>Volume(24h)</Col>
                        <Col xl={6} lg={6} md={6} xxl={6} sm={12} xs={12}
                          style={{borderBottom: '1px solid rgb(67, 74, 89)'}}>
                            {mktVolume24}
                            <span style={{fontSize: '11px', color: 'rgb(153, 153, 153)', letterSpacing: '0.05em', marginLeft: '0.3rem'}}>
                              {mktBase}
                            </span>
                        </Col>
                      </Row>
                      <Row style={{marginTop: '13px'}}>
                        <Col xl={6} lg={6} md={6} xxl={6} sm={12} xs={12}>Low Price</Col>
                        <Col xl={6} lg={6} md={6} xxl={6} sm={12} xs={12}
                          className='color-red'
                          style={{borderBottom: '1px solid rgb(67, 74, 89)', fontWeight: 'bold'}}>
                            {mktLowPrice}
                        </Col>
                        <Col xl={6} lg={6} md={6} xxl={6} sm={12} xs={12}>Price(24h)</Col>
                        <Col xl={6} lg={6} md={6} xxl={6} sm={12} xs={12}
                          style={{borderBottom: '1px solid rgb(67, 74, 89)'}}>
                          {mktPrice24}
                          <span style={{fontSize: '11px', color: 'rgb(153, 153, 153)', letterSpacing: '0.05em', marginLeft: '0.3rem'}}>USDC</span>
                        </Col>
                      </Row>
                    </Col>
                  </>
                }
              </Row>
            </FloatingElement>
            {component}
          </Col>
          <Col xs={24} sm={24} md={8}>
            <FloatingElement>
              <Row
                align="middle"
                style={{ paddingLeft: 5, paddingRight: 5 }}
                gutter={16}
              >
                <Col style={{width: '100%'}}>
                  <MarketSelector
                    markets={markets}
                    setHandleDeprecated={setHandleDeprecated}
                    placeholder={'Select market'}
                    customMarkets={customMarkets}
                    onDeleteCustomMarket={onDeleteCustomMarket}
                  />
                </Col>
                {deprecatedMarkets && deprecatedMarkets.length > 0 && (
                  <React.Fragment>
                    <Col>
                      <Typography>
                        You have unsettled funds on old markets! Please go through
                        them to claim your funds.
                      </Typography>
                    </Col>
                    <Col>
                      <Button onClick={() => setHandleDeprecated(!handleDeprecated)}>
                        {handleDeprecated ? 'View new markets' : 'Handle old markets'}
                      </Button>
                    </Col>
                  </React.Fragment>
                )}
              </Row>
            </FloatingElement>
            <FloatingElement style={{ minHeight: '50%'}}>
              <Table 
                dataSource={dataSource}
                columns={columns}
                pagination={{ pageSize: 50 }}
                loading={marketLoading}
                className="table-market" />
            </FloatingElement>
          </Col>
        </Row>
      </Wrapper>
    </>
  );
}

function MarketSelector({
  markets,
  placeholder,
  setHandleDeprecated,
  customMarkets,
  onDeleteCustomMarket,
}) {
  const { market, setMarketAddress } = useMarket();

  const onSetMarketAddress = (marketAddress) => {
    setHandleDeprecated(false);
    setMarketAddress(marketAddress);
  };

  const extractBase = (a) => a.split('/')[0];
  const extractQuote = (a) => a.split('/')[1];

  const selectedMarket = getMarketInfos(customMarkets)
    .find(
      (proposedMarket) =>
        market?.address && proposedMarket.address.equals(market.address),
    )
    ?.address?.toBase58();

  return (
    <Select
      showSearch
      size={'large'}
      style={{ width: '100%' }}
      placeholder={placeholder || 'Select a market'}
      optionFilterProp="name"
      onSelect={onSetMarketAddress}
      listHeight={400}
      value={selectedMarket}
      filterOption={(input, option) =>
        option?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      {customMarkets && customMarkets.length > 0 && (
        <OptGroup label="Custom">
          {customMarkets.map(({ address, name }, i) => (
            <Option
              value={address}
              key={nanoid()}
              name={name}
              style={{
                padding: '10px',
                // @ts-ignore
                backgroundColor: i % 2 === 0 ? 'rgb(39, 44, 61)' : null,
              }}
            >
              <Row>
                <Col flex="auto">{name}</Col>
                {selectedMarket !== address && (
                  <Col>
                    <DeleteOutlined
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        onDeleteCustomMarket && onDeleteCustomMarket(address);
                      }}
                    />
                  </Col>
                )}
              </Row>
            </Option>
          ))}
        </OptGroup>
      )}
      <OptGroup label="Markets">
        {markets
          .sort((a, b) =>
            extractQuote(a.name) === 'USDT' && extractQuote(b.name) !== 'USDT'
              ? -1
              : extractQuote(a.name) !== 'USDT' &&
                extractQuote(b.name) === 'USDT'
              ? 1
              : 0,
          )
          .sort((a, b) =>
            extractBase(a.name) < extractBase(b.name)
              ? -1
              : extractBase(a.name) > extractBase(b.name)
              ? 1
              : 0,
          )
          .map(({ address, name, image, deprecated }, i) => (
            <Option
              value={address.toBase58()}
              key={nanoid()}
              name={name}
              style={{
                padding: '10px',
                // @ts-ignore
                backgroundColor: i % 2 === 0 ? 'rgba(22, 63, 82, 20%)' : null,
              }}
            >
              <Avatar
                src={image}
                style={{ height: '20px', width:'20px', marginRight: '25px', zIndex: 1, background: '#222c35', borderRadius: '50%'}}
                shape="square"
              />
              <Avatar
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                style={{ height: '20px', width:'20px', position: 'absolute', zIndex: 0, left: '18px', top: '10px'}}
                shape="square"
              />
              {name} {deprecated ? ' (Deprecated)' : null}
            </Option>
          ))}
      </OptGroup>
    </Select>
  );
}

const DeprecatedMarketsPage = ({ switchToLiveMarkets }) => {
  return (
    <>
      <Row>
        <Col flex="auto">
          <DeprecatedMarketsInstructions
            switchToLiveMarkets={switchToLiveMarkets}
          />
        </Col>
      </Row>
    </>
  );
};

const RenderNormal = ({ onChangeOrderRef, onPrice, onSize }) => {
  return (
    <>
      <Row
        style={{
          height: '520px',
        }}
      >
        <Col flex="auto" style={{ height: '100%', display: 'flex' }}>
          <Card bordered={false} className="wrapper-floating-el" style={{ width: '100%', margin: '0 5px', height: 'calc(100% - 8px)', marginTop: '5px', borderRadius: '8px' }}>
            <TVChartContainer />
          </Card>
        </Col>
      </Row>
      <Row
        style={{
          height: '500px',
        }}
      >
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <Orderbook smallScreen={true} onPrice={onPrice} onSize={onSize} />
        </Col>
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <TradeForm style={{ flex: 1 }} setChangeOrderRef={onChangeOrderRef} />
        </Col>
      </Row>
      <Row
        style={{
          height: '580px',
        }}
      >
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <StandaloneBalancesDisplay />
        </Col>
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <TradesTable smallScreen={true} />
        </Col>
      </Row>
      <Row>
        <Col flex="auto">
          <UserInfoTable />
        </Col>
      </Row>
    </>
  );
};

const RenderSmall = ({ onChangeOrderRef, onPrice, onSize }) => {
  return (
    <>
      <Row
        style={{
          height: '520px',
        }}
      >
        <Col flex="auto" style={{ height: '100%', display: 'flex' }}>
          <Card bordered={false} className="wrapper-floating-el" style={{ width: '100%', margin: '0 5px', height: 'calc(100% - 8px)', marginTop: '5px', borderRadius: '8px' }}>
            <TVChartContainer />
          </Card>
        </Col>
      </Row>
      <Row
        style={{
          height: '500px',
        }}
      >
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <Orderbook smallScreen={true} onPrice={onPrice} onSize={onSize} />
        </Col>
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <TradeForm style={{ flex: 1 }} setChangeOrderRef={onChangeOrderRef} />
        </Col>
      </Row>
      <Row
        style={{
          height: '580px',
        }}
      >
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <StandaloneBalancesDisplay />
        </Col>
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <TradesTable smallScreen={true} />
        </Col>
      </Row>
      <Row>
        <Col flex="auto">
          <UserInfoTable />
        </Col>
      </Row>
    </>
  );
};

const RenderSmaller = ({ onChangeOrderRef, onPrice, onSize }) => {
  return (
    <>
      <Row style={{ height: '70vh' }}>
        <Col flex="auto" style={{ height: '100%', display: 'flex' }}>
          <Card bordered={false} className="wrapper-floating-el" style={{ width: '100%', margin: '0 5px', height: 'calc(100% - 8px)', marginTop: '5px', borderRadius: '8px' }}>
            <TVChartContainer />
          </Card>
        </Col>
      </Row>
      <Row>
        <Col flex="auto" style={{ height: '100%', display: 'flex' }}>
          <TradeForm style={{ flex: 1 }} setChangeOrderRef={onChangeOrderRef} />
        </Col>
      </Row>
      <Row>
        <Col flex="auto">
          <StandaloneBalancesDisplay />
        </Col>
      </Row>
      <Row
        style={{
          height: '500px', overflow: 'hidden'
        }}
      >
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <Orderbook smallScreen={true} onPrice={onPrice} onSize={onSize} />
        </Col>
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <TradesTable smallScreen={true} />
        </Col>
      </Row>
      <Row>
        <Col flex="auto">
          <UserInfoTable />
        </Col>
      </Row>
    </>
  );
};
