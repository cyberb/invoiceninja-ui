/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { AxiosError } from 'axios';
import { endpoint } from 'common/helpers';
import { request } from 'common/helpers/request';
import { toast } from 'common/helpers/toast/toast';
import { CompanyGateway } from 'common/interfaces/company-gateway';
import { ValidationBag } from 'common/interfaces/validation-bag';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export function useHandleCreate(
  companyGateway: CompanyGateway | undefined,
  setErrors: Dispatch<SetStateAction<ValidationBag | undefined>>
) {
  const [t] = useTranslation();
  const navigate = useNavigate();

  return () => {
    if (!companyGateway) {
      setErrors({
        message: t('invalid_data'),
        errors: {
          gateway_key: [t('invalid_gateway_key')],
        },
      });
      return;
    }

    toast.processing();
    setErrors(undefined);

    request('POST', endpoint('/api/v1/company_gateways'), companyGateway)
      .then(() => {
        toast.success('created_company_gateway');
        navigate('/settings/online_payments');
      })
      .catch((error: AxiosError) => {
        if (error?.response?.status === 422) {
          setErrors(error.response.data);
        } else {
          console.error(error);
          toast.error();
        }
      })
      .finally(() => toast.dismiss());
  };
}
