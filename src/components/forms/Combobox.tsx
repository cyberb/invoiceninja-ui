/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { endpoint as apiEndpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { GenericSingleResourceResponse } from '$app/common/interfaces/generic-api-response';
import { GenericManyResponse } from '$app/common/interfaces/generic-many-response';
import { Combobox as HeadlessCombobox } from '@headlessui/react';
import { AxiosResponse } from 'axios';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'react-feather';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useClickAway, useDebounce } from 'react-use';

interface Entry<T = any> {
  id: number | string;
  label: string;
  value: string | number | boolean;
  resource: T | null;
}

interface InputOptions {
  value: string | number | boolean | null;
  label?: string;
}

interface ComboboxStaticProps<T = any> {
  inputOptions: InputOptions;
  entries: Entry<T>[];
  readonly?: boolean;
  nullable?: boolean;
  initiallyVisible?: boolean;
  exclude?: (string | number | boolean)[];
  onChange: (entry: Entry<T>) => unknown;
  onEmptyValues: (query: string) => unknown;
  onDismiss?: () => unknown;
}

export type Nullable<T> = T | null;

export function ComboboxStatic({
  inputOptions,
  entries,
  readonly,
  nullable,
  exclude = [],
  initiallyVisible = false,
  onEmptyValues,
  onChange,
  onDismiss,
}: ComboboxStaticProps) {
  const [t] = useTranslation();
  const [selectedValue, setSelectedValue] = useState<Entry | null>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(initiallyVisible);

  const filteredValues =
    query === ''
      ? entries
      : entries
          .filter(
            (entry) =>
              entry.label.toLowerCase().includes(query.toLowerCase()) ||
              entry.value.toString().toLowerCase().includes(query.toLowerCase())
          )
          .filter((entry) =>
            exclude.length > 0 ? !exclude.includes(entry.value) : true
          );

  const comboboxRef = useRef<HTMLDivElement>(null);

  useClickAway(comboboxRef, () => {
    setIsOpen(false);
  });

  useDebounce(
    () => {
      if (query === '' && filteredValues.length > 0) {
        return onEmptyValues(query);
      }

      if (filteredValues.length === 0) {
        return onEmptyValues(query);
      }
    },
    1000,
    [filteredValues]
  );

  useEffect(() => {
    if (selectedValue) {
      onChange(selectedValue);
    }
  }, [selectedValue]);

  useEffect(() => {
    const entry = entries.find((entry) => entry.value === inputOptions.value);

    entry ? setSelectedValue(entry) : setSelectedValue(null);
  }, [entries, inputOptions.value]);

  useEffect(() => {
    if (initiallyVisible) {
      setIsOpen(true);
    }

    return () => {
      setIsOpen(false);
    };
  }, [initiallyVisible]);

  return (
    <HeadlessCombobox
      as="div"
      value={selectedValue}
      onChange={setSelectedValue}
      disabled={readonly}
      ref={comboboxRef}
    >
      {inputOptions.label && (
        <HeadlessCombobox.Label className="text-sm text-gray-500 font-medium block">
          {inputOptions.label}
        </HeadlessCombobox.Label>
      )}

      <div className="relative mt-2">
        <HeadlessCombobox.Input
          className="w-full rounded border-0 bg-white py-2 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(entry: Nullable<Entry>) => entry?.label ?? ''}
          onFocus={() => setIsOpen(true)}
        />

        {!readonly && (
          <HeadlessCombobox.Button
            onClick={(e) => {
              if (onDismiss) {
                e.preventDefault();

                setIsOpen(false);

                return onDismiss();
              }
            }}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
          >
            {onDismiss && selectedValue ? (
              <X className="h-5 w-5 text-gray-400" aria-hidden="true" />
            ) : (
              <ChevronDown
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            )}
          </HeadlessCombobox.Button>
        )}

        {isOpen && (
          <HeadlessCombobox.Options
            static
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          >
            {filteredValues.length > 0 &&
              filteredValues.map((entry) => (
                <HeadlessCombobox.Option
                  key={entry.id}
                  value={entry}
                  className={({ active }) =>
                    classNames(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-900'
                    )
                  }
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={classNames(
                          'block truncate',
                          selected && 'font-semibold'
                        )}
                      >
                        {entry.label}
                      </span>

                      {selected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600">
                          <Check className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </HeadlessCombobox.Option>
              ))}

            {filteredValues.length === 0 && (
              <HeadlessCombobox.Option
                key="combobox-not-found"
                className={() =>
                  classNames(
                    'relative cursor-default select-none py-2 pl-3 pr-9'
                  )
                }
                value={null}
                disabled
              >
                {() => (
                  <>
                    <span className="block truncate">
                      {t('no_records_found')}.
                    </span>
                  </>
                )}
              </HeadlessCombobox.Option>
            )}
          </HeadlessCombobox.Options>
        )}
      </div>
    </HeadlessCombobox>
  );
}

interface ComboboxAsyncProps<T> {
  endpoint: string;
  inputOptions: InputOptions;
  entryOptions: {
    id: string;
    label: string;
    value: string;
  };
  readonly?: boolean;
  staleTime?: number;
  initiallyVisible?: boolean;
  querySpecificEntry?: string;
  sortBy?: string;
  exclude?: (string | number | boolean)[];
  onChange: (entry: Entry<T>) => unknown;
  onDismiss?: () => unknown;
}

export function ComboboxAsync<T = any>({
  endpoint,
  inputOptions,
  entryOptions,
  readonly,
  staleTime,
  initiallyVisible,
  querySpecificEntry,
  sortBy = 'created_at|desc',
  exclude,
  onChange,
  onDismiss,
}: ComboboxAsyncProps<T>) {
  const [entries, setEntries] = useState<Entry<T>[]>([]);
  const [url, setUrl] = useState('');

  const { data } = useQuery(
    [url],
    () => {
      const $url = new URL(apiEndpoint(endpoint));

      $url.searchParams.set('sort', sortBy);
      $url.searchParams.set('is_deleted', 'false');

      return request('GET', $url.href).then(
        (response: AxiosResponse<GenericManyResponse<any>>) => {
          const data: Entry<T>[] = [];

          response.data.data.map((entry) =>
            data.push({
              id: entry[entryOptions.id],
              label: entry[entryOptions.label],
              value: entry[entryOptions.value],
              resource: entry,
            })
          );

          return data;
        }
      );
    },
    {
      staleTime: staleTime ?? Infinity,
    }
  );

  useEffect(() => {
    if (data) {
      setEntries([...data]);
    }
  }, [data]);

  const { data: specificEntry } = useQuery(
    [querySpecificEntry],
    () =>
      request(
        'GET',
        apiEndpoint(querySpecificEntry!, { id: inputOptions.value })
      ).then((response: GenericSingleResourceResponse<any>) => ({
        id: response.data.data[entryOptions.id],
        label: response.data.data[entryOptions.label],
        value: response.data.data[entryOptions.value],
        resource: response.data.data,
      })),
    {
      enabled:
        Boolean(querySpecificEntry) &&
        Boolean(entries.find((entry) => entry.value !== inputOptions.value)) &&
        Boolean(inputOptions.value),
      staleTime: staleTime ?? Infinity,
    }
  );

  useEffect(() => {
    console.log('Specific', specificEntry);

    if (specificEntry) {
      setEntries((entries) => {
        const entry = entries.find(
          (entry) => entry.value === inputOptions.value
        );

        if (entry) {
          return entries;
        }

        return [...entries, specificEntry];
      });
    }
  }, [specificEntry]);

  const onEmptyValues = (query: string) => {
    setUrl(() => {
      const url = new URL(apiEndpoint(endpoint));

      if (query.length > 0) {
        url.searchParams.set('filter', query);
      }

      return url.href;
    });
  };

  useEffect(() => {
    return () => {
      setEntries([]);
    };
  }, []);

  return (
    <ComboboxStatic
      entries={entries}
      inputOptions={inputOptions}
      readonly={readonly}
      onChange={onChange}
      onEmptyValues={onEmptyValues}
      onDismiss={onDismiss}
      initiallyVisible={initiallyVisible}
      exclude={exclude}
    />
  );
}
