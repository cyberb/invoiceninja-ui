/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useResolveCountry } from '$app/common/hooks/useResolveCountry';
import { Card, Element } from '$app/components/cards';
import { Button, InputField, SelectField } from '$app/components/forms';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash';
import { PEPPOL_COUNTRIES } from '$app/common/helpers/peppol-countries';
import { useAccentColor } from '$app/common/hooks/useAccentColor';
import { useCurrentCompany } from '$app/common/hooks/useCurrentCompany';
import { Modal } from '$app/components/Modal';
import { useState } from 'react';
import { useFormik } from 'formik';
import { request } from '$app/common/helpers/request';
import { endpoint } from '$app/common/helpers';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { useRefreshCompanyUsers } from '$app/common/hooks/useRefreshCompanyUsers';
import { AxiosError } from 'axios';
import { toast } from '$app/common/helpers/toast/toast';

export function EUTaxDetails() {
  const [t] = useTranslation();

  const company = useCurrentCompany();
  const resolveCountry = useResolveCountry();

  const displayCountryOption = (countryId: string) => {
    const iso31662 = resolveCountry(countryId)?.iso_3166_2;

    if (!iso31662) {
      return false;
    }

    return get(
      company.tax_data.regions.EU.subregions,
      `${iso31662}.vat_number`
    );
  };

  return (
    <Card title={t('additional_tax_identifiers')}>
      <Element leftSide={t('new_identifier')}>
        <Configure />
      </Element>

      {PEPPOL_COUNTRIES.filter((currentCountryId) =>
        displayCountryOption(currentCountryId)
      ).map((countryId) => (
        <Element key={countryId} leftSide={resolveCountry(countryId)?.name}>
          {displayCountryOption(countryId)}
        </Element>
      ))}
    </Card>
  );
}

function Configure() {
  const { t } = useTranslation();

  const accentColor = useAccentColor();
  const company = useCurrentCompany();
  const resolveCountry = useResolveCountry();
  const refresh = useRefreshCompanyUsers();

  const [isVisible, setIsVisible] = useState(false);
  const [errors, setErrors] = useState<ValidationBag | null>(null);

  const form = useFormik({
    initialValues: {
      country: '',
      vat_number: '',
    },
    onSubmit: (values, { setSubmitting }) => {
      setErrors(null);
      setSubmitting(true);

      toast.processing();

      request(
        'POST',
        endpoint('/api/v1/einvoice/peppol/add_additional_legal_identifier'),
        values
      )
        .then(() => {
          toast.success();

          refresh();

          setIsVisible(false);

          form.resetForm();
        })
        .catch((e: AxiosError<ValidationBag>) => {
          if (e.response?.status === 422) {
            if (
              get(e.response.data, '0.source') !== '' &&
              get(e.response.data, '0.source') !== undefined
            ) {
              toast.error(`Error: ${get(e.response.data, '0.details')}`);
            } else {
              setErrors(e.response.data);

              toast.dismiss();
            }

            return;
          }

          if (e.response?.status === 400) {
            toast.error(e.response.data.message);

            return;
          }

          console.error(e);

          toast.error();
        })
        .finally(() => setSubmitting(false));
    },
  });

  const displayCountryOption = (countryId: string) => {
    const iso31662 = resolveCountry(countryId)?.iso_3166_2;

    if (!iso31662) {
      return false;
    }

    return !get(
      company.tax_data.regions.EU.subregions,
      `${iso31662}.vat_number`
    );
  };

  return (
    <>
      <Modal
        title={t('new_identifier')}
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        overflowVisible
        size="small"
      >
        <form onSubmit={form.handleSubmit} className="space-y-5">
          <SelectField
            value={form.values.country}
            label={t('country')}
            onValueChange={(value) => form.setFieldValue('country', value)}
            errorMessage={errors?.errors?.country}
            customSelector
          >
            {PEPPOL_COUNTRIES.filter((currentCountryId) =>
              displayCountryOption(currentCountryId)
            ).map((countryId) => (
              <option key={countryId} value={countryId}>
                {resolveCountry(countryId)?.name}
              </option>
            ))}
          </SelectField>

          <InputField
            label={t('vat_number')}
            value={form.values.vat_number}
            onValueChange={(value) => form.setFieldValue('vat_number', value)}
            errorMessage={errors?.errors?.vat_number}
          />

          <div className="flex justify-end">
            <Button disabled={form.isSubmitting}>{t('continue')}</Button>
          </div>
        </form>
      </Modal>

      <button
        type="button"
        style={{ color: accentColor }}
        onClick={() => setIsVisible(true)}
      >
        {t('configure')}
      </button>
    </>
  );
}
