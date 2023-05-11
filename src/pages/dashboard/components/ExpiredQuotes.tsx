/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useFormatMoney } from '$app/common/hooks/money/useFormatMoney';
import { DataTable, DataTableColumns } from '$app/components/DataTable';
import { route } from '$app/common/helpers/route';
import { Link } from '$app/components/forms/Link';
import { useCurrentCompany } from '$app/common/hooks/useCurrentCompany';
import { Card } from '$app/components/cards';
import { Quote } from '$app/common/interfaces/quote';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Badge } from '$app/components/Badge';
import { useGetTableHeight } from '../hooks/useGetTableHeight';
import { useState } from 'react';
import { ViewAll } from './ViewAll';

export function ExpiredQuotes() {
  const [t] = useTranslation();
  const company = useCurrentCompany();
  const formatMoney = useFormatMoney();

  const [viewedAll, setViewedAll] = useState<boolean>(false);
  const [hasVerticalOverflow, setHasVerticalOverflow] =
    useState<boolean>(false);

  const getTableHeight = useGetTableHeight();

  const columns: DataTableColumns<Quote> = [
    {
      id: 'number',
      label: t('number'),
      format: (value, quote) => {
        return (
          <Link to={route('/invoices/:id/edit', { id: quote.id })}>
            {quote.number}
          </Link>
        );
      },
    },
    {
      id: 'client_id',
      label: t('client'),
      format: (value, quote) => (
        <Link to={route('/clients/:id', { id: quote.client_id })}>
          {quote.client?.display_name}
        </Link>
      ),
    },
    {
      id: 'date',
      label: t('date'),
      format: (value) => value && dayjs(value).format('MMM DD'),
    },
    {
      id: 'amount',
      label: t('amount'),
      format: (value, quote) => (
        <Badge variant="light-blue">
          {formatMoney(
            value,
            quote.client?.country_id || company.settings.country_id,
            quote.client?.settings.currency_id || company.settings.currency_id
          )}
        </Badge>
      ),
    },
  ];

  const handleVerticalOverflowChange = (overflow: boolean) => {
    setHasVerticalOverflow(overflow);
  };

  return (
    <Card
      title={t('expired_quotes')}
      className="h-96 relative"
      withoutBodyPadding
    >
      <DataTable
        resource="quote"
        columns={columns}
        endpoint={route(
          '/api/v1/quotes?include=client&client_status=expired&without_deleted_clients=true&per_page=50&page=1&sort=id|desc&view_all=:viewedAll',
          {
            viewedAll,
          }
        )}
        withoutActions
        withoutPagination
        withoutPadding
        withoutBottomBorder={hasVerticalOverflow}
        onVerticalOverflowChange={handleVerticalOverflowChange}
        style={{
          height: getTableHeight(viewedAll),
        }}
      />

      <ViewAll
        viewedAll={viewedAll || !hasVerticalOverflow}
        setViewedAll={setViewedAll}
      />
    </Card>
  );
}
