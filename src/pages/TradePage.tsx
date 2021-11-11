import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Button, Col, Popover, Row, Select, Typography, Card, Switch } from 'antd';
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
import LinkAddress from '../components/LinkAddress';
import DeprecatedMarketsInstructions from '../components/DeprecatedMarketsInstructions';
import {
  DeleteOutlined,
  HeartFilled,
  InfoCircleOutlined,
  PlusCircleOutlined,
  WalletOutlined,
  BulbFilled,
  StarFilled,
} from '@ant-design/icons';
import CustomMarketDialog from '../components/CustomMarketDialog';
import MyTokenDialog from '../components/MyTokenDialog';
import { notify } from '../utils/notifications';
import { useHistory, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';

import { useThemeSwitcher } from 'react-css-theme-switcher';
import { TVChartContainer } from '../components/TradingView';
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
    useEffect(() => {
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
    }, [snow.enable]);

    const onChangeSnow = (value) => {
      setSnow({status: value, enable: true});
      localStorage.setItem('snow', JSON.stringify({status: value, enable: true}));
    };
    return (
      snow.enable ?
      <Col>
        <Switch
          checkedChildren={<HeartFilled />}
          unCheckedChildren={<HeartFilled />}
          defaultChecked={snow.status}
          onChange={onChangeSnow}
        />
      </Col>
      : null
    );
  }

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
        </Row>
        <Row
          align="middle"
          style={{ paddingLeft: 5, paddingRight: 5 }}
          gutter={16}
        >
          <Col>
            <MarketSelector
              markets={markets}
              setHandleDeprecated={setHandleDeprecated}
              placeholder={'Select market'}
              customMarkets={customMarkets}
              onDeleteCustomMarket={onDeleteCustomMarket}
            />
          </Col>
          {market ? (
            <Col>
              <Popover
                content={<LinkAddress address={market.publicKey.toBase58()} />}
                placement="bottomRight"
                title="Market address"
                trigger="click"
              >
                <InfoCircleOutlined style={{ color: '#2abdd2' }} />
              </Popover>
            </Col>
          ) : null}
          <Col>
            <PlusCircleOutlined
              style={{ color: '#2abdd2' }}
              onClick={() => setAddMarketVisible(true)}
            />
          </Col>
          <Col style={{marginLeft: 'auto'}}>
            <Button 
              type="primary" 
              icon={<WalletOutlined />}
              style={{color: '#163F52', borderRadius: '8px'}}
              onClick={() => setAddMyTokenVisible(true)}>
              { width > 450 && 'My Token'}
            </Button>
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
        {component}
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
      style={{ width: 200 }}
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
                backgroundColor: i % 2 === 0 ? 'rgb(39, 44, 61)' : null,
              }}
            >
              <Avatar
                src={image}
                style={{ padding: '5px', marginRight: '4px'}}
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
    <Row
      style={{
        minHeight: '900px',
        flexWrap: 'nowrap',
      }}
      className="row-rounded"
    >
      <Col flex="auto" style={{ height: '50vh' }}>
        <Row style={{ height: '100%' }}>
          <Card bordered={false} className="wrapper-floating-el" style={{ width: '100%', height: 'calc(100% - 8px)', marginTop: '5px', borderRadius: '20px' }}>
            <TVChartContainer />
          </Card>
        </Row>
        <Row style={{ height: '70%' }}>
          <UserInfoTable />
        </Row>
      </Col>
      <Col flex={'360px'} style={{ height: '100%' }}>
        <Orderbook smallScreen={false} onPrice={onPrice} onSize={onSize} />
        <TradesTable smallScreen={false} />
      </Col>
      <Col
        flex="400px"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <TradeForm setChangeOrderRef={onChangeOrderRef} />
        <StandaloneBalancesDisplay />
      </Col>
    </Row>
  );
};

const RenderSmall = ({ onChangeOrderRef, onPrice, onSize }) => {
  return (
    <>
      <Row
        style={{
          height: '370px',
        }}
        className="row-rounded"
      >
        <Col flex="auto" style={{ height: '100%', display: 'flex' }}>
          <Card bordered={false} className="wrapper-floating-el" style={{ width: '100%', height: 'calc(100% - 8px)', marginTop: '5px', borderRadius: '20px' }}>
            <TVChartContainer />
          </Card>
        </Col>
        <Col
          flex="400px"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <TradeForm setChangeOrderRef={onChangeOrderRef} />
        </Col>
      </Row>
      <Row
        style={{
          height: '900px',
          marginTop: '8px'
        }}
        className="row-rounded"
      >
        <Col flex="370px" style={{ height: '100%', display: 'flex' }}>
          <Orderbook
            smallScreen={true}
            depth={13}
            onPrice={onPrice}
            onSize={onSize}
          />
        </Col>
        <Col
          flex="370px"
          style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'scroll' }}
        >
          <TradesTable smallScreen={true} />
        </Col>
        <Col
          flex="auto"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <StandaloneBalancesDisplay />
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
      <Row style={{ height: '50vh' }}>
        <Col flex="auto" style={{ height: '100%', display: 'flex' }}>
          <Card bordered={false} className="wrapper-floating-el" style={{ width: '100%', height: 'calc(100% - 8px)', marginTop: '5px', borderRadius: '20px' }}>
            <TVChartContainer />
          </Card>
        </Col>
      </Row>
      <Row className="row-rounded">
        <Col flex="auto" style={{ height: '100%', display: 'flex' }}>
          <TradeForm style={{ flex: 1 }} setChangeOrderRef={onChangeOrderRef} />
        </Col>
      </Row>
      <Row className="row-rounded">
        <Col flex="auto">
          <StandaloneBalancesDisplay />
        </Col>
      </Row>
      <Row
        style={{
          height: '500px', overflow: 'hidden'
        }}
        className="row-rounded"
      >
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <Orderbook smallScreen={true} onPrice={onPrice} onSize={onSize} />
        </Col>
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <TradesTable smallScreen={true} />
        </Col>
      </Row>
      <Row className="row-rounded">
        <Col flex="auto">
          <UserInfoTable />
        </Col>
      </Row>
    </>
  );
};
