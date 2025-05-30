/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */
import { InvoiceItemSum } from './invoice-item-sum';
import { Invoice } from '$app/common/interfaces/invoice';
import collect from 'collect.js';
import { Currency } from '$app/common/interfaces/currency';
import { NumberFormatter } from '../number-formatter';
import { RecurringInvoice } from '$app/common/interfaces/recurring-invoice';
import { PurchaseOrder } from '$app/common/interfaces/purchase-order';
import { Credit } from '$app/common/interfaces/credit';
import { Quote } from '$app/common/interfaces/quote';

export interface TaxItem {
  key?: string;
  name: string;
  total: number;
}

export class InvoiceSum {
  protected taxMap = collect<TaxItem>();
  protected totalTaxMap: Record<string, unknown>[] = [];

  public declare invoiceItems: InvoiceItemSum;

  public totalDiscount = 0;
  public total = 0;
  public totalTaxes = 0;
  public totalCustomValues = 0;
  public subTotal = 0;

  constructor(
    public invoice: Invoice | RecurringInvoice | PurchaseOrder | Credit | Quote,
    protected currency: Currency
  ) {
    this.invoiceItems = new InvoiceItemSum(this.invoice, this.currency);
  }

  public build() {
    this.calculateLineItems()
      .calculateDiscount()
      .calculateInvoiceTaxes()
      .calculateCustomValues()
      .setTaxMap()
      .calculateTotals()
      // .calculatePartial()
      .calculateBalance();

    return this;
  }

  public getTaxMap() {
    return this.taxMap;
  }

  protected calculateLineItems() {
    this.invoiceItems.process();

    this.invoice.line_items = this.invoiceItems.lineItems;
    this.total = this.invoiceItems.subTotal;
    this.subTotal = this.invoiceItems.subTotal;

    return this;
  }

  protected calculateDiscount() {
    this.totalDiscount = this.discount(this.invoiceItems.subTotal);
    this.total -= this.totalDiscount;

    return this;
  }

  protected peppolSurchargeTaxes() {
      const invoice_item = this.invoice.line_items[0];
      const name = invoice_item?.tax_name1;
      const rate = invoice_item?.tax_rate1 ?? 0;
      const amount = this.invoice.custom_surcharge1+this.invoice.custom_surcharge2+this.invoice.custom_surcharge3+this.invoice.custom_surcharge4;
      
      if(rate > 0 && amount != 0){

        const total = Math.round((((amount * rate) / 100) * 1000) / 10) / 100;

        let group = {};

        const key = name + rate.toString().replace(' ', ''); // 'Tax Rate' + '5' => 'TaxRate5'

        group = { key, total, name: `${name} ${parseFloat(rate.toString())} %` }; // 'Tax Rate 5.00%'

        this.invoiceItems.taxCollection.push(collect(group));
      
      }
      
      return this;
  }

  protected calculateInvoiceTaxes() {

    let calculatedTax = 0;

    if (this.invoice.tax_name1.length >= 1) {
      let tax = this.taxer(this.total, this.invoice.tax_rate1);

      tax += this.getSurchargeTaxTotalForKey(
        this.invoice.tax_name1,
        this.invoice.tax_rate1
      );

      // this.totalTaxes += tax;
      calculatedTax += tax;
      this.totalTaxMap.push({
        name: `${this.invoice.tax_name1} ${parseFloat(
          this.invoice.tax_rate1.toFixed(this.currency?.precision || 2)
        )} %`,
      });
    }

    if (this.invoice.tax_name2.length >= 1) {
      let tax = this.taxer(this.total, this.invoice.tax_rate2);

      tax += this.getSurchargeTaxTotalForKey(
        this.invoice.tax_name2,
        this.invoice.tax_rate2
      );

      // this.totalTaxes += tax;
      calculatedTax += tax;
      this.totalTaxMap.push({
        name: `${this.invoice.tax_name2} ${parseFloat(
          this.invoice.tax_rate2.toFixed(this.currency?.precision || 2)
        )} %`,
      });
    }

    if (this.invoice.tax_name3.length >= 1) {
      let tax = this.taxer(this.total, this.invoice.tax_rate3);

      tax += this.getSurchargeTaxTotalForKey(
        this.invoice.tax_name3,
        this.invoice.tax_rate3
      );

      // this.totalTaxes += tax;
      calculatedTax += tax;

      this.totalTaxMap.push({
        name: `${this.invoice.tax_name3} ${parseFloat(
          this.invoice.tax_rate3.toFixed(this.currency?.precision || 2)
        )} %`,
      });
    }

    this.totalTaxes = parseFloat(calculatedTax.toFixed(this.currency?.precision || 2));

    return this;
  }

  protected calculateCustomValues() {
    this.totalCustomValues += this.valuer(this.invoice.custom_surcharge1);
    this.totalCustomValues += this.valuer(this.invoice.custom_surcharge2);
    this.totalCustomValues += this.valuer(this.invoice.custom_surcharge3);
    this.totalCustomValues += this.valuer(this.invoice.custom_surcharge4);

    this.total += this.totalCustomValues;

    return this;
  }

  protected getSurchargeTaxTotalForKey(taxName: string, rate: number) {
    let taxComponent = 0;

    if (this.invoice.custom_surcharge_tax1) {
      taxComponent += parseFloat(
        (this.invoice.custom_surcharge1 * (rate / 100)).toFixed(
          this.currency?.precision || 2
        )
      );
    }

    if (this.invoice.custom_surcharge_tax2) {
      taxComponent += parseFloat(
        (this.invoice.custom_surcharge2 * (rate / 100)).toFixed(
          this.currency?.precision || 2
        )
      );
    }

    if (this.invoice.custom_surcharge_tax3) {
      taxComponent += parseFloat(
        (this.invoice.custom_surcharge3 * (rate / 100)).toFixed(
          this.currency?.precision || 2
        )
      );
    }

    if (this.invoice.custom_surcharge_tax4) {
      taxComponent += parseFloat(
        (this.invoice.custom_surcharge4 * (rate / 100)).toFixed(
          this.currency?.precision || 2
        )
      );
    }

    return taxComponent;
  }

  protected setTaxMap() {
    if (this.invoice.is_amount_discount) {
      this.invoiceItems.calculateTaxesWithAmountDiscount();
      this.invoice.line_items = this.invoiceItems.lineItems;
    }
    
    if(this.invoice.tax_name1.length == 0 && this.invoice.custom_surcharge1 !=0 && this.invoice.custom_surcharge_tax1){
      this.peppolSurchargeTaxes();
    }

    this.taxMap = collect();

    let taxCollection = collect<TaxItem>();
    taxCollection = this.invoiceItems.taxCollection.pluck('items');

    const keys = taxCollection.pluck('key').unique();

    keys.map((key) => {
      const taxName = taxCollection
        .filter((item) => item.key === key)
        .pluck('name')
        .first();

      const totalLineTax = taxCollection
        .filter((item) => item.key === key)
        .sum('total');

      this.taxMap.push({
        name: taxName as string,
        total: totalLineTax as number,
      });
    });

    this.totalTaxes += this.invoiceItems.totalTaxes;

    return this;
  }

  protected calculateTotals() {
    this.total += this.totalTaxes;

    this.total.toFixed(this.currency?.precision || 2);

    return this;
  }

  protected calculateBalance() {
    this.setCalculatedAttributes();

    return this;
  }

  protected setCalculatedAttributes() {
    this.invoice.amount = parseFloat(
      NumberFormatter.formatValue(this.total, this.currency?.precision || 2)
    );

    this.invoice.balance =
      parseFloat(
        NumberFormatter.formatValue(this.total, this.currency?.precision || 2)
      ) - (this.invoice.paid_to_date ?? 0);

    this.invoice.total_taxes = this.totalTaxes;

    return this;
  }

  public getBalanceDue() {
    return this.invoice.partial && this.invoice.partial > 0
      ? Math.min(this.invoice.partial, this.invoice.balance)
      : this.invoice.balance;
  }

  /////////////

  protected discount(amount: number) {
    // This needs extraction in the invoice service/class.

    if (this.invoice.is_amount_discount) {
      return this.invoice.discount;
    }

    return parseFloat(
      (amount * (this.invoice.discount / 100)).toFixed(
        this.currency?.precision || 2
      )
    );
  }

  protected taxer(amount: number, tax_rate: number) {
    return Number((Math.round(amount * ((tax_rate ?? 0) / 100) * 1000) / 10) / 100);
  }

  protected valuer(customValue: number | undefined): number {
    // This needs extraction in the custom valuer service/class.

    if (typeof customValue === 'number') {
      return customValue;
    }

    return 0;
  }
}
