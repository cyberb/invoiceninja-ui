/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { Card, Element } from '$app/components/cards';
import { InputField, SelectField } from '$app/components/forms';
import { useCurrentCompany } from '$app/common/hooks/useCurrentCompany';
import { RecurringExpense } from '$app/common/interfaces/recurring-expense';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { ClientSelector } from '$app/components/clients/ClientSelector';
import { CurrencySelector } from '$app/components/CurrencySelector';
import { ExpenseCategorySelector } from '$app/components/expense-categories/ExpenseCategorySelector';
import { ProjectSelector } from '$app/components/projects/ProjectSelector';
import { TaxRateSelector } from '$app/components/tax-rates/TaxRateSelector';
import { UserSelector } from '$app/components/users/UserSelector';
import { VendorSelector } from '$app/components/vendors/VendorSelector';
import { useTranslation } from 'react-i18next';
import frequencies from '$app/common/constants/recurring-expense-frequency';
import dayjs from 'dayjs';
import { Link, useSearchParams } from 'react-router-dom';
import { RecurringExpenseStatus } from '../common/components/RecurringExpenseStatus';
import { CustomField } from '$app/components/CustomField';
import { useFormatMoney } from '$app/common/hooks/money/useFormatMoney';
import { useCalculateExpenseAmount } from '$app/pages/expenses/common/hooks/useCalculateExpenseAmount';
import { Icon } from '$app/components/icons/Icon';
import { MdLaunch, MdWarning } from 'react-icons/md';
import { route } from '$app/common/helpers/route';
import { Link as LinkBase } from '$app/components/forms';
import { ClientActionButtons } from '$app/pages/invoices/common/components/ClientActionButtons';
import { NumberInputField } from '$app/components/forms/NumberInputField';
import reactStringReplace from 'react-string-replace';
import { getTaxRateComboValue } from '$app/common/helpers/tax-rates/tax-rates-combo';

export interface RecurringExpenseCardProps {
  recurringExpense: RecurringExpense | undefined;
  handleChange: <T extends keyof RecurringExpense>(
    property: T,
    value: RecurringExpense[T]
  ) => void;
  errors?: ValidationBag | undefined;
}

interface Props extends RecurringExpenseCardProps {
  taxInputType: 'by_rate' | 'by_amount';
  pageType: 'create' | 'edit';
}

export function Details(props: Props) {
  const [t] = useTranslation();
  const [searchParams] = useSearchParams();

  const { recurringExpense, handleChange, taxInputType, pageType, errors } =
    props;

  const company = useCurrentCompany();

  const formatMoney = useFormatMoney();
  const calculateExpenseAmount = useCalculateExpenseAmount();

  const isAnyTaxHidden = () => {
    if (
      company.enabled_expense_tax_rates === 0 &&
      (recurringExpense?.tax_name1 ||
        recurringExpense?.tax_name2 ||
        recurringExpense?.tax_name3)
    ) {
      return true;
    }

    return false;
  };

  return (
    <div className="flex flex-col space-y-4">
      {recurringExpense && (
        <Card>
          <Element leftSide={t('expense_total')} withoutWrappingLeftSide>
            {formatMoney(
              calculateExpenseAmount(recurringExpense),
              recurringExpense.client?.country_id,
              recurringExpense.currency_id ||
                recurringExpense.client?.settings.currency_id
            )}
          </Element>
        </Card>
      )}

      <Card title={t('details')} isLoading={!recurringExpense}>
        {recurringExpense && pageType === 'edit' && (
          <>
            <Element leftSide={t('status')}>
              <RecurringExpenseStatus recurringExpense={recurringExpense} />
            </Element>

            <Element leftSide={t('number')}>
              <InputField
                id="number"
                value={recurringExpense.number}
                onValueChange={(value) => handleChange('number', value)}
                errorMessage={errors?.errors.number}
              />
            </Element>
          </>
        )}

        {recurringExpense && (
          <Element
            leftSide={
              <div className="flex items-center space-x-2">
                <span>{t('vendor')}</span>

                {recurringExpense.vendor_id && (
                  <Link
                    to={route('/vendors/:id', {
                      id: recurringExpense.vendor_id,
                    })}
                    target="_blank"
                  >
                    <Icon element={MdLaunch} size={18} />
                  </Link>
                )}
              </div>
            }
          >
            <VendorSelector
              value={recurringExpense.vendor_id}
              onChange={(vendor) => handleChange('vendor_id', vendor.id)}
              onClearButtonClick={() => handleChange('vendor_id', '')}
              errorMessage={errors?.errors.vendor_id}
            />
          </Element>
        )}

        {recurringExpense && (
          <Element leftSide={t('client')}>
            <div className="flex flex-col space-y-2">
              <ClientSelector
                value={recurringExpense.client_id}
                clearButton={Boolean(recurringExpense.client_id)}
                onClearButtonClick={() => handleChange('client_id', '')}
                onChange={(client) => handleChange('client_id', client.id)}
                errorMessage={errors?.errors.client_id}
                disableWithSpinner={searchParams.get('action') === 'create'}
              />

              {recurringExpense.client_id && (
                <ClientActionButtons clientId={recurringExpense.client_id} />
              )}
            </div>
          </Element>
        )}

        {recurringExpense && (
          <Element
            leftSide={
              <div className="flex items-center space-x-2">
                <span>{t('project')}</span>

                {recurringExpense.project_id && (
                  <Link
                    to={route('/projects/:id', {
                      id: recurringExpense.project_id,
                    })}
                    target="_blank"
                  >
                    <Icon element={MdLaunch} size={18} />
                  </Link>
                )}
              </div>
            }
          >
            <ProjectSelector
              value={recurringExpense.project_id}
              clearButton={Boolean(recurringExpense.project_id)}
              onClearButtonClick={() => handleChange('project_id', '')}
              onChange={(client) => handleChange('project_id', client.id)}
              errorMessage={errors?.errors.project_id}
            />
          </Element>
        )}

        {recurringExpense && (
          <Element leftSide={t('category')}>
            <ExpenseCategorySelector
              value={recurringExpense.category_id}
              onClearButtonClick={() => handleChange('category_id', '')}
              onChange={(category) => handleChange('category_id', category.id)}
              errorMessage={errors?.errors.category_id}
            />
          </Element>
        )}

        {recurringExpense && (
          <Element leftSide={t('user')}>
            <UserSelector
              value={recurringExpense.assigned_user_id}
              clearButton={Boolean(recurringExpense.assigned_user_id)}
              onClearButtonClick={() => handleChange('assigned_user_id', '')}
              onChange={(user) => handleChange('assigned_user_id', user.id)}
              errorMessage={errors?.errors.assigned_user_id}
            />
          </Element>
        )}

        {isAnyTaxHidden() && (
          <div className="flex items-center space-x-3 px-6">
            <div>
              <Icon element={MdWarning} size={20} color="orange" />
            </div>

            <div className="text-sm font-medium">
              {reactStringReplace(
                t('hidden_taxes_warning') as string,
                ':link',
                () => (
                  <LinkBase to="/settings/tax_settings">
                    {t('settings')}
                  </LinkBase>
                )
              )}
            </div>
          </div>
        )}

        {/* Tax 1 */}
        {recurringExpense &&
          company?.enabled_expense_tax_rates > 0 &&
          taxInputType === 'by_rate' && (
            <Element leftSide={t('tax')}>
              <TaxRateSelector
                defaultValue={getTaxRateComboValue(
                  recurringExpense,
                  'tax_name1'
                )}
                onClearButtonClick={() => {
                  handleChange('tax_name1', '');
                  handleChange('tax_rate1', 0);
                }}
                onChange={(taxRate) => {
                  taxRate.resource &&
                    handleChange('tax_rate1', taxRate.resource.rate);

                  taxRate.resource &&
                    handleChange('tax_name1', taxRate.resource.name);
                }}
                onTaxCreated={(taxRate) => {
                  handleChange('tax_rate1', taxRate.rate);

                  handleChange('tax_name1', taxRate.name);
                }}
              />
            </Element>
          )}

        {recurringExpense &&
          company?.enabled_expense_tax_rates > 0 &&
          taxInputType === 'by_amount' && (
            <Element leftSide={t('tax')}>
              <div className="flex flex-col xl:flex-row xl:items-center space-y-4 xl:space-y-0 xl:space-x-4">
                <InputField
                  label={t('tax_name')}
                  value={recurringExpense.tax_name1}
                  onValueChange={(value) => handleChange('tax_name1', value)}
                  errorMessage={errors?.errors.tax_name1}
                  cypressRef="taxNameByAmount1"
                />
                <NumberInputField
                  label={t('tax_amount')}
                  value={recurringExpense.tax_amount1 || ''}
                  onValueChange={(value) =>
                    handleChange('tax_amount1', parseFloat(value))
                  }
                  errorMessage={errors?.errors.tax_amount1}
                  cypressRef="taxRateByAmount1"
                />
              </div>
            </Element>
          )}

        {/* Tax 2 */}
        {recurringExpense &&
          company?.enabled_expense_tax_rates > 1 &&
          taxInputType === 'by_rate' && (
            <Element leftSide={t('tax')}>
              <TaxRateSelector
                defaultValue={getTaxRateComboValue(
                  recurringExpense,
                  'tax_name2'
                )}
                onClearButtonClick={() => {
                  handleChange('tax_name2', '');
                  handleChange('tax_rate2', 0);
                }}
                onChange={(taxRate) => {
                  taxRate.resource &&
                    handleChange('tax_rate2', taxRate.resource.rate);

                  taxRate.resource &&
                    handleChange('tax_name2', taxRate.resource.name);
                }}
                onTaxCreated={(taxRate) => {
                  handleChange('tax_rate2', taxRate.rate);

                  handleChange('tax_name2', taxRate.name);
                }}
              />
            </Element>
          )}

        {recurringExpense &&
          company?.enabled_expense_tax_rates > 1 &&
          taxInputType === 'by_amount' && (
            <Element leftSide={t('tax')}>
              <div className="flex flex-col xl:flex-row xl:items-center space-y-4 xl:space-y-0 xl:space-x-4">
                <InputField
                  label={t('tax_name')}
                  value={recurringExpense.tax_name2}
                  onValueChange={(value) => handleChange('tax_name2', value)}
                  errorMessage={errors?.errors.tax_name2}
                  cypressRef="taxNameByAmount2"
                />
                <NumberInputField
                  label={t('tax_amount')}
                  value={recurringExpense.tax_amount2 || ''}
                  onValueChange={(value) =>
                    handleChange('tax_amount2', parseFloat(value))
                  }
                  errorMessage={errors?.errors.tax_amount2}
                  cypressRef="taxRateByAmount2"
                />
              </div>
            </Element>
          )}

        {/* Tax 3 */}
        {recurringExpense &&
          company?.enabled_expense_tax_rates > 2 &&
          taxInputType === 'by_rate' && (
            <Element leftSide={t('tax')}>
              <TaxRateSelector
                defaultValue={getTaxRateComboValue(
                  recurringExpense,
                  'tax_name3'
                )}
                onClearButtonClick={() => {
                  handleChange('tax_name3', '');
                  handleChange('tax_rate3', 0);
                }}
                onChange={(taxRate) => {
                  taxRate.resource &&
                    handleChange('tax_rate3', taxRate.resource.rate);

                  taxRate.resource &&
                    handleChange('tax_name3', taxRate.resource.name);
                }}
                onTaxCreated={(taxRate) => {
                  handleChange('tax_rate3', taxRate.rate);

                  handleChange('tax_name3', taxRate.name);
                }}
              />
            </Element>
          )}

        {recurringExpense &&
          company?.enabled_expense_tax_rates > 2 &&
          taxInputType === 'by_amount' && (
            <Element leftSide={t('tax')}>
              <div className="flex flex-col xl:flex-row xl:items-center space-y-4 xl:space-y-0 xl:space-x-4">
                <InputField
                  label={t('tax_name')}
                  value={recurringExpense.tax_name3}
                  onValueChange={(value) => handleChange('tax_name3', value)}
                  errorMessage={errors?.errors.tax_name3}
                />
                <NumberInputField
                  label={t('tax_amount')}
                  value={recurringExpense.tax_amount3 || ''}
                  onValueChange={(value) =>
                    handleChange('tax_amount3', parseFloat(value))
                  }
                  errorMessage={errors?.errors.tax_amount3}
                />
              </div>
            </Element>
          )}

        {recurringExpense && (
          <Element leftSide={t('amount')}>
            <NumberInputField
              value={recurringExpense.amount || ''}
              onValueChange={(value) =>
                handleChange('amount', parseFloat(value) || 0)
              }
              errorMessage={errors?.errors.amount}
            />
          </Element>
        )}

        {recurringExpense && (
          <Element leftSide={t('currency')}>
            <CurrencySelector
              value={recurringExpense.currency_id}
              onChange={(currency) => handleChange('currency_id', currency)}
              errorMessage={errors?.errors.currency_id}
              dismissable
            />
          </Element>
        )}

        {recurringExpense && (
          <Element leftSide={t('date')}>
            <InputField
              type="date"
              onValueChange={(value) => handleChange('date', value)}
              value={recurringExpense.date}
              errorMessage={errors?.errors.date}
            />
          </Element>
        )}

        <Element leftSide={t('frequency')}>
          <SelectField
            value={recurringExpense?.frequency_id}
            onValueChange={(value) => handleChange('frequency_id', value)}
            errorMessage={errors?.errors.frequency_id}
          >
            {Object.keys(frequencies).map((frequency, index) => (
              <option key={index} value={frequency}>
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore */}
                {t(frequencies[frequency])}
              </option>
            ))}
          </SelectField>
        </Element>

        <Element leftSide={t('start_date')}>
          <InputField
            type="date"
            onValueChange={(value) => handleChange('next_send_date', value)}
            value={
              recurringExpense?.next_send_date
                ? dayjs(recurringExpense?.next_send_date).format('YYYY-MM-DD')
                : new Date().toISOString().split('T')[0]
            }
            min={new Date().toISOString().split('T')[0]}
            errorMessage={errors?.errors.next_send_date}
          />
        </Element>

        <Element leftSide={t('remaining_cycles')}>
          <SelectField
            value={recurringExpense?.remaining_cycles}
            onValueChange={(value) =>
              handleChange('remaining_cycles', parseInt(value))
            }
            errorMessage={errors?.errors.remaining_cycles}
          >
            <option value="-1">{t('endless')}</option>
            {[...Array(37).keys()].map((number, index) => (
              <option value={number} key={index}>
                {number}
              </option>
            ))}
          </SelectField>
        </Element>

        {recurringExpense && company?.custom_fields?.expense1 && (
          <CustomField
            field="recurringExpense1"
            defaultValue={recurringExpense.custom_value1 || ''}
            value={company.custom_fields.expense1}
            onValueChange={(value) =>
              handleChange('custom_value1', String(value))
            }
          />
        )}

        {recurringExpense && company?.custom_fields?.expense2 && (
          <CustomField
            field="recurringExpense2"
            defaultValue={recurringExpense.custom_value2 || ''}
            value={company.custom_fields.expense2}
            onValueChange={(value) =>
              handleChange('custom_value2', String(value))
            }
          />
        )}

        {recurringExpense && company?.custom_fields?.expense3 && (
          <CustomField
            field="recurringExpense3"
            defaultValue={recurringExpense.custom_value3 || ''}
            value={company.custom_fields.expense3}
            onValueChange={(value) =>
              handleChange('custom_value3', String(value))
            }
          />
        )}

        {recurringExpense && company?.custom_fields?.expense4 && (
          <CustomField
            field="recurringExpense4"
            defaultValue={recurringExpense.custom_value4 || ''}
            value={company.custom_fields.expense4}
            onValueChange={(value) =>
              handleChange('custom_value4', String(value))
            }
          />
        )}
      </Card>
    </div>
  );
}
