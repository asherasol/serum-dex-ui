import {
  MenuOutlined,
} from '@ant-design/icons';
import { Button, Menu, Badge, Dropdown } from 'antd';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import logo from '../assets/logo-santa.png';
import { useWallet } from '../utils/wallet';
import { ENDPOINTS, useConnectionConfig } from '../utils/connection';
import WalletConnect from './WalletConnect';
import { getTradePageUrl } from '../utils/markets';
import useWindowDimensions from '../utils/layout';
import Link from './Link';

export default function TopBar() {
  const {
    endpointInfo,
    setEndpoint,
  } = useConnectionConfig();
  const location = useLocation();
  const [searchFocussed] = useState(false);

  const endpointInfoCustom = endpointInfo && endpointInfo.custom;
  useEffect(() => {
    const handler = () => {
      if (endpointInfoCustom) {
        setEndpoint(ENDPOINTS[0].endpoint);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [endpointInfoCustom, setEndpoint]);

  const DefaultActions = ({ vertical = false }: { vertical?: boolean }) => {
    const { connected } = useWallet();
    return (
      <div style={{
        display: "flex",
        flexDirection: vertical ? "column" : "row",
      }}>
        <Link to={tradePageUrl}>
          <Button className="app-btn">Trade</Button>
        </Link>
        {/* {connected && (!searchFocussed || location.pathname === '/balances') && (
          <Link to={`/balances`}>
            <Button className="app-btn">Balances</Button>
          </Link>
        )}
        {connected && (!searchFocussed || location.pathname === '/orders') && (
          <Link to={`/orders`}>
            <Button className="app-btn">Orders</Button>
          </Link>
        )}
        {connected && (!searchFocussed || location.pathname === '/convert') && (
          <Link to={`/convert`}>
            <Button className="app-btn">Convert</Button>
          </Link>
        )} */}
        <Link to={`/list-new-market`}>
          <Button className="app-btn">Add Market</Button>
        </Link>
        <a href={`https://verify.asherasol.com`} target='_blank'>
          <Button className="app-btn">
            Verify Wallet
            <Badge className="badge-secondary badge-soon rounded">NEW</Badge>
          </Button>
        </a>
        <Link to={`#soon-mytoken`}>
          <Button className="app-btn">
            My Wallet
            <Badge className="badge-primary badge-soon rounded">SOON</Badge>
          </Button>
        </Link>
        <Link to={`#soon-nftmarket`}>
          <Button className="app-btn">
            NFT Marketplaces
            <Badge className="badge-primary badge-soon rounded">SOON</Badge>
          </Button>
        </Link>
      </div>
    )
  }
  const MetaplexMenu = () => {
    const { width } = useWindowDimensions();
    const { connected } = useWallet();
  
    if (width < 768) return <>
      <Dropdown
        arrow
        placement="bottomLeft"
        trigger={['click']}
        overlay={<Menu>
          <Menu.Item>
            <Link to={tradePageUrl}>
              <Button className="app-btn">Trade</Button>
            </Link>
          </Menu.Item>
          {connected && (!searchFocussed || location.pathname === '/balances') && (
            <Menu.Item>
              <Link to={'/balances'}>
                <Button className="app-btn">Balances</Button>
              </Link>
            </Menu.Item>
          )}
          {connected && (!searchFocussed || location.pathname === '/orders') && (
            <Menu.Item>
              <Link to={'/orders'}>
                <Button className="app-btn">Orders</Button>
              </Link>
            </Menu.Item>
          )}
          {connected && (!searchFocussed || location.pathname === '/convert') && (
            <Menu.Item>
              <Link to={'/convert'}>
                <Button className="app-btn">Convert</Button>
              </Link>
            </Menu.Item>
          )}
          <Menu.Item>
            <Link to={'/list-new-market'}>
              <Button className="app-btn">Add Market</Button>
            </Link>
          </Menu.Item>
          <Menu.Item>
            <a href={'https://verify.asherasol.com'} target='_blank'>
              <Button className="app-btn">
                Verify Wallet
                <Badge className="badge-secondary badge-soon rounded">NEW</Badge>
              </Button>
            </a>
          </Menu.Item>
          <Menu.Item>
            <Link to={'#soon-mytoken'}>
              <Button className="app-btn">
                My Wallet
                <Badge className="badge-primary badge-soon rounded">SOON</Badge>
              </Button>
            </Link>
          </Menu.Item>
          <Menu.Item>
            <Link to={'#soon-nftmarket'}>
              <Button className="app-btn">
                NFT Marketplaces
              <Badge className="badge-primary badge-soon rounded">SOON</Badge>
              </Button>
            </Link>
          </Menu.Item>
        </Menu>}
      >
        <MenuOutlined style={{ fontSize: "1.4rem" }} />
      </Dropdown>
    </>
  
    return <DefaultActions />
  }

  const tradePageUrl = location.pathname.startsWith('/market/')
    ? location.pathname
    : getTradePageUrl();

    return (
      <>
        <div className="app-left app-bar-box">
          <img className="ck-logo-svg ant-popover-open noty-popover" src={logo} alt="ASHERA" />
          <div className="divider" />
          <MetaplexMenu />
        </div>
        <div className="app-right">
          <WalletConnect />
        </div>
      </>
    );
}
