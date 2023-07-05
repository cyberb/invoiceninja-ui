/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */
interface Record {
    trans: string;
    value: string;
}

export const creditMap: Record[] = [
    { trans: 'credit_number', value: "credit.number" },
    { trans: 'amount', value: "credit.amount" },
    { trans: 'balance', value: "credit.balance" },
    { trans: 'paid_to_date', value: "credit.paid_to_date" },
    { trans: 'discount', value: "credit.discount" },
    { trans: 'po_number', value: "credit.po_number" },
    { trans: 'date', value: "credit.date" },
    { trans: 'due_date', value: "credit.due_date" },
    { trans: 'terms', value: "credit.terms" },
    { trans: 'footer', value: "credit.footer" },
    { trans: 'status', value: "credit.status" },
    { trans: 'public_notes', value: "credit.public_notes" },
    { trans: 'private_notes', value: "credit.private_notes" },
    { trans: 'uses_inclusive_taxes', value: "credit.uses_inclusive_taxes" },
    { trans: 'is_amount_discount', value: "credit.is_amount_discount" },
    { trans: 'partial', value: "credit.partial" },
    { trans: 'partial_due_date', value: "credit.partial_due_date" },
    { trans: 'custom_value1', value: "credit.custom_value1" },
    { trans: 'custom_value2', value: "credit.custom_value2" },
    { trans: 'custom_value3', value: "credit.custom_value3" },
    { trans: 'custom_value4', value: "credit.custom_value4" },
    { trans: 'surcharge1', value: "credit.custom_surcharge1" },
    { trans: 'surcharge2', value: "credit.custom_surcharge2" },
    { trans: 'surcharge3', value: "credit.custom_surcharge3" },
    { trans: 'surcharge4', value: "credit.custom_surcharge4" },
    { trans: 'exchange_rate', value: "credit.exchange_rate" },
    { trans: 'tax_amount', value: "credit.total_taxes" },    
    { trans: 'quantity', value: "item.quantity" },
    { trans: 'discount', value: "item.discount" },
    { trans: 'cost', value: "item.cost" },
    { trans: 'product_key', value: "item.product_key" },
    { trans: 'notes', value: "item.notes" },
    { trans: 'custom_value1', value: "item.custom_value1" },
    { trans: 'custom_value2', value: "item.custom_value2" },
    { trans: 'custom_value3', value: "item.custom_value3" },
    { trans: 'custom_value4', value: "item.custom_value4" },
    { trans: 'item_tax1', value: "item.tax_name1" },
    { trans: 'item_tax_rate1', value: "item.tax_rate1" },
    { trans: 'item_tax2', value: "item.tax_name2" },
    { trans: 'item_tax_rate2', value: "item.tax_rate2" },
    { trans: 'item_tax3', value: "item.tax_name3" },
    { trans: 'item_tax_rate3', value: "item.tax_rate3" },
    { trans: 'type', value: "item.type_id" },
    { trans: 'tax_category', value: "item.tax_id" },
    { trans: 'assigned_user', value: "credit.assigned_user_id" },
    { trans: 'user', value: "credit.user_id" },
];