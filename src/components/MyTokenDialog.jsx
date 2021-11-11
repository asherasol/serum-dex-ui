import React, { useState } from 'react';
import { Modal } from 'antd';
import { useWallet } from '../utils/wallet';
import { TokenListProvider } from '@solana/spl-token-registry';
import { JSONRPCClient } from 'json-rpc-2.0';
import Highlighter from 'react-highlight-words';
import { Table, Avatar, Image, Button, Space, Input } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import Link from './Link';

import markets_ashera from '../markets.json';

export default function MyTokenDialog({ visible, onClose }) {
  const [state, setState] = useState({
    searchText: '',
    searchedColumn: '',
  });

  const { connected, wallet } = useWallet();

  let [searchInput] = useState();
  let [isLoading, setIsLoading] = useState(false);
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={(node) => {
            searchInput = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : '',
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.select(), 100);
      }
    },
    render: (text) =>
      state.searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[state.searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setState({
      searchText: selectedKeys[0],
      searchedColumn: dataIndex,
    });
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setState({ searchText: '' });
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (image) => <Avatar src={<Image src={image} />} />,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ...getColumnSearchProps('name'),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => formatCash(amount),
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Action',
      key: 'operation',
      fixed: 'right',
      width: 100,
      render: (data) => {
        return (
          data.marketAddress !== '' && (
            <Link to={'/market/' + data.marketAddress} onClick={onDoClose}>
              <Button type="primary" shape="round" style={{ color: '#163F52' }}>
                Buy
              </Button>
            </Link>
          )
        );
      },
    },
  ];

  const mainnetBeta = new JSONRPCClient((jsonRPCRequest) =>
    fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(jsonRPCRequest),
    }).then((response) => {
      if (response.status === 200) {
        // Use client.receive when you received a JSON-RPC response.
        return response
          .json()
          .then((jsonRPCResponse) => mainnetBeta.receive(jsonRPCResponse));
      } else if (jsonRPCRequest.id !== undefined) {
        return Promise.reject(new Error(response.statusText));
      }
    }),
  );

  const getTokenAccounts = () => {
    if (connected && wallet) {
      setIsLoading(true);
      let programId = {
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      };
      let commitment = { encoding: 'jsonParsed', commitment: 'confirmed' };
      mainnetBeta
        .request('getTokenAccountsByOwner', [
          wallet.publicKey.toBase58(),
          programId,
          commitment,
        ])
        .then(
          async (data) => {
            const tokenInfo = await new TokenListProvider()
              .resolve()
              .then((tokens) => {
                const tokenList = tokens
                  .filterByClusterSlug('mainnet-beta')
                  .getList();
                return tokenList;
              });
            let dataSource_ = [];
            await data.value.map((result, index) => {
              const parsedAccount = result.account.data.parsed.info;
              const mint = parsedAccount.mint;
              const token = tokenInfo.filter((token) =>
                token.address.includes(mint),
              );
              let name =
                !token[0] || !token[0].symbol
                  ? getSmallAddress(mint)
                  : token[0].symbol;
              const amount = parsedAccount.tokenAmount.uiAmount;
              let image =
                !token[0] || !token[0].logoURI ? '' : token[0].logoURI;
              let marketAddress = '';
              markets_ashera.map((ashera) => {
                if (ashera.mintAddress === mint) {
                  image = ashera.image;
                  marketAddress = ashera.address;
                  const [base] = ashera.name.split('/');
                  name = base;
                }
              });
              if (amount > 0) {
                dataSource_.push({
                  key: index,
                  image: image,
                  name: name,
                  amount: amount,
                  marketAddress: marketAddress,
                });
              }
            });
            setDataSource(dataSource_);
            setIsLoading(false);
          },
          (error) => {
            console.log(error);
            setIsLoading(false);
          },
        );
    }
  };

  const [dataSource, setDataSource] = useState([]);

  const getSmallAddress = (address, style = 0) => {
    return address.substring(0, 4) + '...' + address.substr(address.length - 4);
  };

  const formatCash = (n) => {
    if (n < 1e3) return toFixedFloor(n, 1).toString().replace('.0', '');
    if (n >= 1e3 && n < 1e6)
      return (
        toFixedFloor(+(n / 1e3), 1)
          .toString()
          .replace('.0', '') + 'K'
      );
    if (n >= 1e6 && n < 1e9)
      return (
        toFixedFloor(+(n / 1e6), 1)
          .toString()
          .replace('.0', '') + 'M'
      );
    if (n >= 1e9 && n < 1e12)
      return (
        toFixedFloor(+(n / 1e9), 1)
          .toString()
          .replace('.0', '') + 'B'
      );
    if (n >= 1e12)
      return (
        toFixedFloor(+(n / 1e12), 1)
          .toString()
          .replace('.0', '') + 'T'
      );
  };

  const toFixedFloor = (num, fixed) => {
    fixed = fixed || 0;
    fixed = Math.pow(10, fixed);
    return Math.floor(num * fixed) / fixed;
  };

  const [firstOpen, setFirstOpen] = useState(false);

  if (visible && !firstOpen) {
    setFirstOpen(true);
    setDataSource([]);
    getTokenAccounts();
  }

  const getRefresh = () => {
    setDataSource([]);
    getTokenAccounts();
  };

  const handleOk = () => {
    onDoClose();
  };

  const onDoClose = () => {
    setFirstOpen(false);
    onClose();
  };

  return (
    <Modal
      title={'My Token List'}
      visible={visible}
      onOk={handleOk}
      onCancel={onDoClose}
    >
      {connected && wallet && (
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={getRefresh}
          style={{
            marginBottom: '10px',
            borderRadius: '8px',
            color: '#163F52',
          }}
        >
          Refresh
        </Button>
      )}
      <Table
        dataSource={dataSource}
        columns={columns}
        size="small"
        loading={isLoading}
        pagination={{ pageSize: 6 }}
        loadingIndicator={<SyncOutlined spin />}
      />
    </Modal>
  );
}
