import React from 'react';
import { Button } from 'antd';
import { useWallet } from '../utils/wallet';

export default function WalletConnect() {
  const { connected, connect, disconnect } = useWallet();
  return (
    <Button onClick={connected ? disconnect : connect} style={{ paddingLeft: '30px', paddingRight: '30px', borderRadius: '8px', height: '45px' }} className="btn-success font-weight-bold btn-connect">
      {connected ? 'Disconnect' : 'Connect Wallet'}
    </Button>
  );
}
