/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { apiEndpoint, isHosted } from '$app/common/helpers';
import { useCurrentCompany } from '$app/common/hooks/useCurrentCompany';
import { CompanyGateway } from '$app/common/interfaces/company-gateway';
import { Card, Element } from '$app/components/cards';
import { useTranslation } from 'react-i18next';
import { CopyToClipboard } from '$app/components/CopyToClipboard';
import { Gateway } from '$app/common/interfaces/statics';
import collect from 'collect.js';
import { STRIPE_CONNECT } from '../../index/Gateways';

interface Props {
  companyGateway: CompanyGateway;
  gateway: Gateway;
}

export function WebhookConfiguration(props: Props) {
  const [t] = useTranslation();
  const company = useCurrentCompany();

  const { companyGateway } = props;

  if (companyGateway.gateway_key === STRIPE_CONNECT && isHosted()) {
    return (
      <Card title={t('settings')}>
        {Object.entries(companyGateway?.settings?.general || {}).length > 0 && (
          <Element leftSide={t('general')}>
            <ul className="list-disc">
              {Object.entries(companyGateway?.settings?.general || {}).map(
                ([key, value], index) => (
                  <li key={index}>{`${t(key)}${
                    value ? `: ${t(value)}` : ''
                  }`}</li>
                )
              )}
            </ul>
          </Element>
        )}

        {Object.entries(companyGateway?.settings?.requirements || {}).length >
          0 && (
          <Element leftSide={t('requirements')}>
            <ul className="list-disc">
              {Object.entries(companyGateway?.settings?.requirements || {}).map(
                ([key, value], index) => (
                  <li key={index}>{`${t(key)}${
                    value ? `: ${t(value)}` : ''
                  }`}</li>
                )
              )}
            </ul>
          </Element>
        )}

        {Object.entries(companyGateway?.settings?.capabilities || {}).length >
          0 && (
          <Element leftSide={t('capabilities')}>
            <ul className="list-disc">
              {Object.entries(companyGateway?.settings?.capabilities || {}).map(
                ([key, value], index) => (
                  <li key={index}>{`${t(key)}${
                    value ? `: ${t(value)}` : ''
                  }`}</li>
                )
              )}
            </ul>
          </Element>
        )}
      </Card>
    );
  }

  return (
    <Card title={t('webhooks')}>
      <Element leftSide={t('webhook_url')}>
        <CopyToClipboard
          className="break-all"
          text={`${apiEndpoint()}/payment_webhook/${company.company_key}/${
            props.companyGateway.id
          }`}
        />
      </Element>

      <Element leftSide={t('supported_events')}>
        <ul className="list-disc">
          {collect(Object.values(props.gateway.options))
            .pluck('webhooks')
            .flatten()
            .unique()
            .whereNotNull()
            .all()
            .sort()
            .map((element: string, index: number) => {
              return <li key={index}>{element}</li>;
            })}
        </ul>
      </Element>
    </Card>
  );
}
