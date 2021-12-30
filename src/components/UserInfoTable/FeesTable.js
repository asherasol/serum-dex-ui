import React from 'react';
import { Row, Col, Typography, Tag } from 'antd';
import { useFeeDiscountKeys } from '../../utils/markets';
import DataTable from '../layout/DataTable';
import { TokenInstructions, getFeeRates } from '@project-serum/serum';
import { percentFormat } from '../../utils/utils';

export default function FeesTable() {
  const [feeAccounts] = useFeeDiscountKeys();

  const columns = [
    {
      title: 'Fee Tier',
      dataIndex: 'feeTier',
      key: 'feeTier',
      render: (feeTier, row) => (
        <div style={{ display: 'flex' }}>
          <Typography>{feeTier}</Typography>
          {row.index === 0 ? (
            <div style={{ marginLeft: 10 }}>
              <Tag color={'#41C77A'} style={{ fontWeight: 700 }}>
                Selected
              </Tag>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Taker',
      dataIndex: 'taker',
      key: 'taker',
      render: (feeTier, row) =>
        percentFormat.format(getFeeRates(row.feeTier).taker),
    },
    {
      title: 'Maker',
      dataIndex: 'maker',
      key: 'maker',
      render: (feeTier, row) =>
        percentFormat.format(getFeeRates(row.feeTier).maker),
    },
    {
      title: `Public Key`,
      dataIndex: 'pubkey',
      key: 'pubkey',
      render: (pubkey) => pubkey.toBase58(),
    },
    {
      title: `Balance`,
      dataIndex: 'balance',
      key: 'balance',
    },
    {
      title: `Mint`,
      dataIndex: 'mint',
      key: 'mint',
      render: (_, row) =>
        row.mint.equals(TokenInstructions.ASH_MINT) ? 'ASH' : 'UNKNOWN',
    },
  ];

  const dataSource = (feeAccounts || []).map((account, index) => ({
    ...account,
    index,
    key: account.pubkey.toBase58(),
  }));

  return (
    <>
      <Row>
        <Col span={24}>
          <DataTable
            dataSource={dataSource}
            columns={columns}
            pagination={true}
            pageSize={5}
            emptyLabel="No ASH accounts"
          />
        </Col>
      </Row>
      <Row style={{ marginTop: 8 }}>
        <Col>
          <Typography>
            Holding ASH makes you eligible for fee discounts:
          </Typography>
          <FeeScheduleTable />
        </Col>
      </Row>
    </>
  );
}

function FeeScheduleTable() {
  // Representation of serum-js/src/fees.ts
  const dataSource = [
    { feeTier: 0, taker: 0.0022, maker: -0.0003, token: '', balance: '' },
    { feeTier: 1, taker: 0.002, maker: -0.0003, token: 'ASH', balance: 500000 },
    {
      feeTier: 2,
      taker: 0.0018,
      maker: -0.0003,
      token: 'ASH',
      balance: 1000000,
    },
    {
      feeTier: 3,
      taker: 0.0016,
      maker: -0.0003,
      token: 'ASH',
      balance: 2500000,
    },
    {
      feeTier: 4,
      taker: 0.0014,
      maker: -0.0003,
      token: 'ASH',
      balance: 5000000,
    },
    {
      feeTier: 5,
      taker: 0.0012,
      maker: -0.0003,
      token: 'ASH',
      balance: 7500000,
    },
    {
      feeTier: 6,
      taker: 0.001,
      maker: -0.0005,
      token: 'ASH',
      balance: 10000000,
    },
  ];
  const columns = [
    {
      title: 'Fee Tier',
      dataIndex: 'feeTier',
      key: 'feeTier',
    },
    {
      title: 'Taker',
      dataIndex: 'taker',
      key: 'taker',
      render: (feeTier, row) =>
        percentFormat.format(getFeeRates(row.feeTier).taker),
    },
    {
      title: 'Maker',
      dataIndex: 'maker',
      key: 'maker',
      render: (feeTier, row) =>
        percentFormat.format(getFeeRates(row.feeTier).maker),
    },
    {
      title: 'Requirements',
      dataIndex: 'requirements',
      key: 'requirements',
      render: (_, row) => (
        <Typography>
          {!row.balance ? 'None' : `≥ ${row.balance} ${row.token}`}
        </Typography>
      ),
    },
  ];
  return (
    <DataTable
      dataSource={dataSource.map((info) => ({ ...info, key: info.feeTier }))}
      columns={columns}
    />
  );
}
