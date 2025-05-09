/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { Card } from '$app/components/cards';
import { useTranslation } from 'react-i18next';
import { SortableVariableList } from './SortableVariableList';
import { useCustomField } from '$app/components/CustomField';
import { useCurrentCompany } from '$app/common/hooks/useCurrentCompany';

export default function TaskColumns() {
  const [t] = useTranslation();
  const customField = useCustomField();

  const company = useCurrentCompany();

  let defaultVariables = [
    { value: '$task.service', label: t('service') },
    { value: '$task.description', label: t('description') },
    { value: '$task.hours', label: t('hours') },
    { value: '$task.rate', label: t('rate') },
    { value: '$task.tax', label: t('tax') },
    { value: '$task.tax_amount', label: t('tax_amount') },
    { value: '$task.discount', label: t('discount') },
    { value: '$task.line_total', label: t('line_total') },
    {
      value: '$task.task1',
      label: customField('task1').label() || t('custom1'),
    },
    {
      value: '$task.task2',
      label: customField('task2').label() || t('custom2'),
    },
    {
      value: '$task.task3',
      label: customField('task3').label() || t('custom3'),
    },
    {
      value: '$task.task4',
      label: customField('task4').label() || t('custom4'),
    },
    { value: '$task.gross_line_total', label: t('gross_line_total') },
  ];

  if (!company?.enabled_item_tax_rates) {
    defaultVariables = defaultVariables.filter(
      (variable) =>
        variable.value !== '$task.tax_amount' && variable.value !== '$task.tax'
    );
  }

  return (
    <Card title={t('task_columns')} padding="small">
      <SortableVariableList
        for="task_columns"
        defaultVariables={defaultVariables}
      />
    </Card>
  );
}
