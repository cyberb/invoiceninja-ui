/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import React, {
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { InputField, SelectField } from '../forms';
import { useTranslation } from 'react-i18next';
import { Element } from '../cards';
import { Icon } from '../icons/Icon';
import { MdAdd, MdDelete } from 'react-icons/md';
import { SearchableSelect } from '../SearchableSelect';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import RandExp from 'randexp';
import { get, set } from 'lodash';
import { useCurrentSettingsLevel } from '$app/common/hooks/useCurrentSettingsLevel';
import { EInvoiceComponent, EInvoiceType } from '$app/pages/settings';
import { Spinner } from '../Spinner';
import Toggle from '../forms/Toggle';
import { EInvoiceBreadcrumbs } from './EInvoiceBreadcrumbs';
import { EInvoiceFieldCheckbox } from './EInvoiceFieldCheckbox';
import { EInvoiceValidationAlert } from './EInvoiceValidationAlert';

export type Country = 'italy';

export type Payload = Record<string, string | number | boolean>;

interface AvailableGroup {
  key: string;
  label: string;
}

interface Resource {
  rules: Rule[];
  validations: Validation[];
  defaultFields: Record<string, string>;
  components: Record<string, Component | undefined>;
  excluded: string[];
}

interface Rule {
  key: string;
  label: string;
  type: 'dropdown';
  resource: string;
  required: boolean;
}

interface Validation {
  name: string;
  base_type: 'string' | 'decimal' | 'number' | 'date';
  resource: Record<string, string> | [];
  length: number | null;
  fraction_digits: number | null;
  total_digits: number | null;
  max_exclusive: number | null;
  min_exclusive: number | null;
  max_inclusive: number | null;
  min_inclusive: number | null;
  max_length: number | null;
  min_length: number | null;
  pattern: string | null;
  whitespace: boolean | null;
}

type Visibility = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ElementType {
  name: string;
  base_type:
    | ('string' | 'decimal' | 'number' | 'date' | 'boolean' | 'time')
    | null;
  resource: Record<string, string> | [];
  length: number | null;
  max_length: number | null;
  min_length: number | null;
  pattern: string | null;
  help: string;
  min_occurs: number;
  max_occurs: number;
  visibility: Visibility;
}

interface Component {
  type: string;
  help: string;
  choices: string[][] | undefined;
  elements: Record<string, ElementType>;
  visibility: Visibility;
}

interface Props {
  country: Country | undefined;
  entityLevel?: boolean;
  currentEInvoice: EInvoiceType;
}

interface ContainerProps {
  renderFragment: boolean;
  children: ReactNode;
  className: string;
}

export type EInvoiceUIComponents = JSX.Element | (JSX.Element | undefined)[];

function Container(props: ContainerProps) {
  const { renderFragment, children, className } = props;

  if (renderFragment) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return <div className={className}>{children}</div>;
}

export const EInvoiceGenerator = forwardRef<EInvoiceComponent, Props>(
  (props, ref) => {
    const [t] = useTranslation();

    const { country, entityLevel, currentEInvoice } = props;

    const { isCompanySettingsActive, isClientSettingsActive } =
      useCurrentSettingsLevel();

    const [rules, setRules] = useState<Rule[]>([]);
    const [errors, setErrors] = useState<ValidationBag>();
    const [isInitial, setIsInitial] = useState<boolean>(true);
    const [components, setComponents] = useState<
      Record<string, Component | undefined>
    >({});
    const [eInvoice, setEInvoice] = useState<EInvoiceUIComponents>();
    const [eInvoiceResolvedType, setEInvoiceResolvedType] =
      useState<EInvoiceUIComponents>();
    const [defaultFields, setDefaultFields] = useState<Record<string, string>>(
      {}
    );

    let availableGroups: AvailableGroup[] = [];

    const [payload, setPayload] = useState<Payload>({});
    const [currentAvailableGroups, setCurrentAvailableGroups] = useState<
      AvailableGroup[]
    >([]);
    const [allAvailableGroups, setAllAvailableGroups] = useState<
      AvailableGroup[]
    >([]);
    const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
    const [isEInvoiceGenerating, setIsEInvoiceGenerating] =
      useState<boolean>(false);
    const [resolvedComplexTypes, setResolvedComplexTypes] = useState<string[]>(
      []
    );

    const getComponentKey = (label: string | null) => {
      return label?.split('Type')[0];
    };

    const handleChange = (
      property: string,
      value: string | number | boolean
    ) => {
      setPayload((current) => ({ ...current, [property]: value }));
    };

    const isFieldChoice = (fieldKey: string) => {
      const keysLength = fieldKey.split('|').length;
      if (keysLength > 1) {
        const parentComponentType = fieldKey.split('|')[keysLength - 2];

        const fieldName = fieldKey.split('|')[keysLength - 1];

        const parentComponent = components[parentComponentType];

        if (parentComponent && fieldName) {
          return parentComponent?.choices?.some((choiceGroup) =>
            choiceGroup.some((choice) => choice === fieldName)
          );
        }
      }

      return false;
    };

    const isChoiceSelected = (fieldKey: string) => {
      return Boolean(
        selectedChoices.find((choiceKey) => choiceKey === fieldKey)
      );
    };

    const showField = (
      key: string,
      visibility: number,
      isChildOfFirstLevelComponent: boolean
    ) => {
      const isFieldVisible = checkElementVisibility(visibility);

      if (!isFieldVisible) {
        return false;
      }

      if (isFieldChoice(key)) {
        return isChoiceSelected(key);
      }

      if (isChildOfFirstLevelComponent) {
        return true;
      }

      const isFieldFromResolvedComplexType =
        doesKeyStartsWithAnyResolvedComplexType(key);

      const isFieldFromSelectedGroup = !doesKeyStartsWithAnyGroupType(key);

      return isFieldFromResolvedComplexType || isFieldFromSelectedGroup;
    };

    const handleDeleteComponent = (componentKey: string) => {
      const deletedComponent = allAvailableGroups.find(
        ({ key }) => key === componentKey
      );

      if (deletedComponent) {
        setSelectedChoices((currentChoices) =>
          currentChoices.filter(
            (choiceKey) => !choiceKey.startsWith(componentKey)
          )
        );
        setCurrentAvailableGroups((current) => [...current, deletedComponent]);
      }
    };

    const getFieldLabel = (
      fieldElement: ElementType,
      fieldParentKeys: string
    ) => {
      const parentKeysLength = fieldParentKeys.split('|').length;

      let topParentType = '';
      let lastParentType = '';

      if (parentKeysLength > 3) {
        topParentType = fieldParentKeys.split('|')[parentKeysLength - 4];
        lastParentType = fieldParentKeys.split('|')[parentKeysLength - 2];

        return `${fieldElement.name} (${getComponentKey(
          topParentType
        )}, ${getComponentKey(lastParentType)})`;
      }

      if (parentKeysLength > 2) {
        topParentType = fieldParentKeys.split('|')[parentKeysLength - 3];
        lastParentType = fieldParentKeys.split('|')[parentKeysLength - 2];

        return `${fieldElement.name} (${getComponentKey(
          topParentType
        )}, ${getComponentKey(lastParentType)})`;
      }

      if (parentKeysLength > 1) {
        lastParentType = fieldParentKeys.split('|')[parentKeysLength - 2];

        return `${fieldElement.name} (${getComponentKey(lastParentType)})`;
      }

      return fieldElement.name;
    };

    const getComplexTypeLabel = (
      element: ElementType,
      componentPath: string
    ) => {
      const pathKeysLength = componentPath.split('|').length;

      const updatedComponentPath = componentPath
        .split('|')
        .filter((_, index) => index < pathKeysLength - 2)
        .join('|');
      const updatedPathKeysLength = updatedComponentPath.split('|').length;

      let topParentName = '';
      let lastParentName = '';

      lastParentName =
        updatedComponentPath.split('|')[updatedPathKeysLength - 1];

      if (updatedPathKeysLength > 1) {
        topParentName =
          updatedComponentPath.split('|')[updatedPathKeysLength - 2];

        return `${element.name} (${topParentName}, ${lastParentName})`;
      }

      if (updatedPathKeysLength > 0) {
        return `${element.name} (${lastParentName})`;
      }

      return element.name;
    };

    const doesKeyStartsWithAnyGroupType = (
      currentKey: string,
      currentList?: AvailableGroup[]
    ) => {
      const currentTypesList =
        currentList ?? (isInitial ? availableGroups : allAvailableGroups);

      return currentTypesList.some((currentType) => {
        const typeKeysLength = currentType.key.split('|').length;
        const updatedCurrentType = currentType.key
          .split('|')
          .filter((_, index) => index !== typeKeysLength - 1)
          .join('|');

        return updatedCurrentType
          .split('|')
          .every((type, index) => type === currentKey.split('|')[index]);
      });
    };

    const doesKeyStartsWithAnyResolvedComplexType = (currentKey: string) => {
      return resolvedComplexTypes.some((currentType) => {
        const typeKeysLength = currentType.split('|').length;
        const updatedCurrentType = currentType
          .split('|')
          .filter((_, index) => index !== typeKeysLength - 1)
          .join('|');

        return updatedCurrentType
          .split('|')
          .every((type, index) => type === currentKey.split('|')[index]);
      });
    };

    const renderElement = (
      element: ElementType,
      parentsKey: string,
      isChildOfFirstLevelComponent: boolean
    ) => {
      let leftSideLabel = '';
      const fieldKey = `${parentsKey}|${element.name || ''}`;

      const rule = rules.find((rule) => rule.key === element.name);

      if (rule) {
        leftSideLabel = rule.label;
      } else {
        leftSideLabel = getFieldLabel(element, parentsKey);
      }

      const isOptionalElement = doesKeyStartsWithAnyGroupType(fieldKey);

      if (
        !showField(fieldKey, element.visibility, isChildOfFirstLevelComponent)
      ) {
        return null;
      }

      if (payload[fieldKey] === undefined) {
        const keysLength = fieldKey.split('|').length;

        const fieldPath = fieldKey
          .split('|')
          .filter((_, index) => index !== keysLength - 2)
          .join('|')
          .replaceAll('|', '.');

        const currentFieldValue = get(currentEInvoice, fieldPath);

        const defaultValue =
          element.base_type === 'boolean'
            ? false
            : element.base_type === 'decimal' || element.base_type === 'number'
            ? 0
            : '';

        if (
          (currentFieldValue as string | number) ||
          defaultFields[fieldKey.split('|')[keysLength - 1]] ||
          !isOptionalElement
        ) {
          setPayload((current) => ({
            ...current,
            [fieldKey]:
              (currentFieldValue as string | number) ||
              defaultFields[fieldKey.split('|')[keysLength - 1]] ||
              defaultValue,
          }));
        }
      }

      if (
        typeof element.resource === 'object' &&
        element.resource !== null &&
        Object.keys(element.resource).length
      ) {
        return (
          <Element
            key={fieldKey}
            leftSide={
              <EInvoiceFieldCheckbox
                fieldKey={fieldKey}
                fieldType="string"
                payload={payload}
                setPayload={setPayload}
                label={leftSideLabel}
                helpLabel={element.help}
                isOptionalField={isOptionalElement}
                requiredField={Boolean(rule?.required)}
              />
            }
            noExternalPadding
          >
            <SelectField
              value={payload[fieldKey] || ''}
              onValueChange={(value) => handleChange(fieldKey, value)}
              disabled={payload[fieldKey] === undefined}
              withBlank
              //errorMessage={errors?.errors[fieldKey]}
            >
              {Object.entries(element.resource).map(([key, value]) => (
                <option key={key} value={key}>
                  {value || key}
                </option>
              ))}
            </SelectField>
          </Element>
        );
      }

      if (element.base_type === 'decimal' || element.base_type === 'number') {
        return (
          <Element
            key={fieldKey}
            leftSide={
              <EInvoiceFieldCheckbox
                fieldKey={fieldKey}
                fieldType="number"
                payload={payload}
                setPayload={setPayload}
                label={leftSideLabel}
                helpLabel={element.help}
                isOptionalField={isOptionalElement}
                requiredField={Boolean(rule?.required)}
              />
            }
            noExternalPadding
          >
            <InputField
              type="number"
              value={payload[fieldKey] || 0}
              onValueChange={(value) =>
                handleChange(
                  fieldKey,
                  parseFloat(value).toFixed(value.split('.')?.[1]?.length)
                )
              }
              disabled={payload[fieldKey] === undefined}
              //errorMessage={errors?.errors[fieldKey]}
            />
          </Element>
        );
      }

      if (element.base_type === 'date') {
        return (
          <Element
            key={fieldKey}
            leftSide={
              <EInvoiceFieldCheckbox
                fieldKey={fieldKey}
                fieldType="date"
                payload={payload}
                setPayload={setPayload}
                label={leftSideLabel}
                helpLabel={element.help}
                isOptionalField={isOptionalElement}
                requiredField={Boolean(rule?.required)}
              />
            }
            noExternalPadding
          >
            <InputField
              type="date"
              value={payload[fieldKey] || ''}
              onValueChange={(value) => handleChange(fieldKey, value)}
              disabled={payload[fieldKey] === undefined}
              //errorMessage={errors?.errors[fieldKey]}
            />
          </Element>
        );
      }

      if (element.base_type === 'boolean') {
        return (
          <Element
            key={fieldKey}
            leftSide={
              <EInvoiceFieldCheckbox
                fieldKey={fieldKey}
                fieldType="boolean"
                payload={payload}
                setPayload={setPayload}
                label={leftSideLabel}
                helpLabel={element.help}
                isOptionalField={isOptionalElement}
                requiredField={Boolean(rule?.required)}
              />
            }
            noExternalPadding
          >
            <Toggle
              checked={Boolean(payload[fieldKey]) || false}
              onValueChange={(value) => handleChange(fieldKey, value)}
              disabled={payload[fieldKey] === undefined}
            />
          </Element>
        );
      }

      if (element.base_type === 'time') {
        return (
          <Element
            key={fieldKey}
            leftSide={
              <EInvoiceFieldCheckbox
                fieldKey={fieldKey}
                fieldType="time"
                payload={payload}
                setPayload={setPayload}
                label={leftSideLabel}
                helpLabel={element.help}
                isOptionalField={isOptionalElement}
                requiredField={Boolean(rule?.required)}
              />
            }
            noExternalPadding
          >
            <InputField
              type="time"
              value={payload[fieldKey] || ''}
              onValueChange={(value) => handleChange(fieldKey, value)}
              disabled={payload[fieldKey] === undefined}
              //errorMessage={errors?.errors[fieldKey]}
            />
          </Element>
        );
      }

      if (element.base_type !== null) {
        return (
          <Element
            key={fieldKey}
            leftSide={
              <EInvoiceFieldCheckbox
                fieldKey={fieldKey}
                fieldType={element.base_type}
                payload={payload}
                setPayload={setPayload}
                label={leftSideLabel}
                helpLabel={element.help}
                isOptionalField={isOptionalElement}
                requiredField={Boolean(rule?.required)}
              />
            }
            noExternalPadding
          >
            <InputField
              value={payload[fieldKey] || ''}
              onValueChange={(value) => handleChange(fieldKey, value)}
              disabled={payload[fieldKey] === undefined}
              //errorMessage={errors?.errors[fieldKey]}
            />
          </Element>
        );
      }

      return null;
    };

    const checkElementVisibility = (visibility: number) => {
      if (visibility === 0) {
        return false;
      }

      if (visibility === 1 && !isCompanySettingsActive) {
        return false;
      }

      if (visibility === 2 && !isClientSettingsActive) {
        return false;
      }

      if (visibility === 4 && !entityLevel) {
        return false;
      }

      if (
        visibility === 3 &&
        !isClientSettingsActive &&
        !isCompanySettingsActive
      ) {
        return false;
      }

      if (visibility === 5 && !entityLevel && !isCompanySettingsActive) {
        return false;
      }

      if (visibility === 6 && !entityLevel && !isClientSettingsActive) {
        return false;
      }

      return true;
    };

    const getChoiceSelectorLabel = (componentKey: string) => {
      const keysLength = componentKey.split('|').length;

      let lastParentType = '';
      let lastParentName = '';

      if (keysLength > 2) {
        lastParentType = componentKey.split('|')[keysLength - 3];
        lastParentName = componentKey.split('|')[keysLength - 2];
      }

      if (keysLength > 3) {
        lastParentType = componentKey.split('|')[keysLength - 4];
      }

      if (keysLength > 2 || keysLength > 3) {
        return `${t('Choices')} (${getComponentKey(
          lastParentType
        )}, ${lastParentName})`;
      }

      if (keysLength > 1) {
        lastParentName = componentKey.split('|')[keysLength - 2];

        return `${t('Choices')} (${lastParentName})`;
      }

      return t('Choices');
    };

    const isAnyElementOfComponentVisible = (currentComponent: Component) => {
      return Object.values(currentComponent.elements).some((currentElement) =>
        checkElementVisibility(currentElement.visibility)
      );
    };

    const getDefaultChoiceSelectorValue = (componentKey: string) => {
      const selectedComponentChoice = selectedChoices.find((choiceKey) =>
        choiceKey.startsWith(componentKey)
      );

      if (selectedComponentChoice) {
        const choiceKeysLength = selectedComponentChoice.split('|').length;
        const choiceName =
          selectedComponentChoice.split('|')[choiceKeysLength - 1];

        return choiceName;
      }

      return '';
    };

    const renderComponent = (
      component: Component,
      componentIndex: number,
      componentPath: string,
      isFirstLevelComponent: boolean
    ) => {
      const componentKey = `${componentPath}|${component.type}`;

      const currentGroupsList = isInitial
        ? availableGroups
        : currentAvailableGroups;

      const isIncludedInAllGroups = allAvailableGroups.some(
        (currentType) => componentKey === currentType.key
      );

      const shouldBeRendered =
        !currentGroupsList.some(
          (currentType) => componentKey === currentType.key
        ) && isIncludedInAllGroups;

      return (
        <Container
          className="flex items-center space-x-4"
          key={componentKey}
          renderFragment={!shouldBeRendered}
        >
          <Container
            className="flex flex-1 flex-col"
            renderFragment={!shouldBeRendered}
          >
            {(shouldBeRendered || isFirstLevelComponent) &&
              Boolean(component.choices?.length) && (
                <Element
                  key={`${componentKey}ChoiceSelector`}
                  leftSide={getChoiceSelectorLabel(componentKey)}
                  noExternalPadding
                >
                  <SelectField
                    defaultValue={getDefaultChoiceSelectorValue(componentKey)}
                    onValueChange={(value) => {
                      setSelectedChoices((current) => {
                        const updatedCurrentList = current.filter(
                          (choice) => !choice.startsWith(componentKey)
                        );

                        if (!value) {
                          const choiceFieldKey = current.find((choice) =>
                            choice.startsWith(componentKey)
                          );

                          if (choiceFieldKey) {
                            setPayload((currentPayload) => ({
                              ...currentPayload,
                              [choiceFieldKey]:
                                typeof currentPayload[choiceFieldKey] ===
                                'number'
                                  ? 0
                                  : typeof currentPayload[choiceFieldKey] ===
                                    'boolean'
                                  ? false
                                  : '',
                            }));
                          }
                        }

                        return [
                          ...updatedCurrentList,
                          ...(value ? [`${componentKey}|${value}`] : []),
                        ];
                      });
                    }}
                    withBlank
                  >
                    {component.choices?.map((choiceGroup) =>
                      choiceGroup.map((choice) => (
                        <option key={choice} value={choice}>
                          {choice}
                        </option>
                      ))
                    )}
                  </SelectField>
                </Element>
              )}

            {Boolean(Object.keys(component.elements).length) &&
              Object.values(component.elements).map((element) => {
                if (element.base_type?.endsWith('Type')) {
                  const componentsList = Object.values(components).filter(
                    (_, index) => componentIndex !== index
                  );

                  const nextComponentIndex = componentsList.findIndex(
                    (component) => component?.type === element.base_type
                  );

                  const nextComponent = componentsList[nextComponentIndex];

                  if (nextComponent) {
                    const isElementVisible = checkElementVisibility(
                      element.visibility
                    );

                    const componentKeyPath = `${componentPath}|${element.name}|${nextComponent.type}`;

                    const isAnyElementOfNewComponentVisible =
                      isAnyElementOfComponentVisible(nextComponent);

                    const currentTypesList = isInitial
                      ? availableGroups
                      : allAvailableGroups;

                    if (
                      element.min_occurs === 0 &&
                      isAnyElementOfNewComponentVisible &&
                      isElementVisible
                    ) {
                      const isAlreadyAdded = doesKeyStartsWithAnyGroupType(
                        componentKeyPath,
                        currentTypesList
                      );

                      if (!isAlreadyAdded) {
                        const label = `${getComponentKey(
                          nextComponent.type
                        )} (${element.name}, ${getComponentKey(
                          component.type
                        )})`;

                        availableGroups.push({
                          key: componentKeyPath,
                          label,
                        });
                      }
                    }

                    const shouldResolvingComponentBeRenderedByParent =
                      doesKeyStartsWithAnyResolvedComplexType(componentKeyPath);

                    const isTypeFromSelectedGroup =
                      !doesKeyStartsWithAnyGroupType(
                        componentKeyPath,
                        currentAvailableGroups
                      );

                    const isComplexTypeGroup = currentTypesList.find(
                      (group) => group.key === componentKeyPath
                    );

                    const shouldResolvingComponentBeRendered =
                      isElementVisible &&
                      ((isFirstLevelComponent && !isComplexTypeGroup) ||
                        isTypeFromSelectedGroup ||
                        shouldResolvingComponentBeRenderedByParent);

                    return (
                      <>
                        {shouldResolvingComponentBeRendered &&
                          isAnyElementOfNewComponentVisible && (
                            <div
                              key={componentKeyPath}
                              className="flex items-center space-x-4 mt-1"
                            >
                              <div className="flex flex-1 items-center py-2 border-b border-t justify-between">
                                <span className="text-sm">
                                  {getComplexTypeLabel(
                                    element,
                                    componentKeyPath
                                  )}
                                </span>

                                <div
                                  className="cursor-pointer"
                                  onClick={() =>
                                    setResolvedComplexTypes((current) => [
                                      ...current,
                                      componentKeyPath,
                                    ])
                                  }
                                >
                                  <Icon element={MdAdd} size={27} />
                                </div>
                              </div>

                              {isComplexTypeGroup && (
                                <div
                                  className="cursor-pointer"
                                  onClick={() =>
                                    handleDeleteComponent(componentKeyPath)
                                  }
                                >
                                  <Icon element={MdDelete} size={28} />
                                </div>
                              )}
                            </div>
                          )}
                      </>
                    );
                  }
                } else {
                  return renderElement(
                    element,
                    componentKey,
                    isFirstLevelComponent
                  );
                }
              })}
          </Container>
        </Container>
      );
    };

    const updateErrors = (
      currentErrors: ValidationBag,
      key: string,
      value: string
    ) => {
      return {
        ...currentErrors,
        errors: {
          ...currentErrors.errors,
          [key]: [
            ...(currentErrors.errors[key] ? currentErrors.errors[key] : []),
            currentErrors.errors[key]?.length ? `\n ${value}` : value,
          ],
        },
      };
    };

    const checkValidation = () => {
      let updatedErrors: ValidationBag = { errors: {}, message: '' };

      Object.entries(payload).forEach(([key, value]) => {
        const keysLength = key.split('|').length;
        const fieldKey = key.split('|')[keysLength - 1];
        const firstParentComponentType = key.split('|')[keysLength - 2];

        let field: ElementType | undefined;

        Object.values(components).forEach((component) => {
          if (
            component &&
            !field &&
            firstParentComponentType === component.type
          ) {
            field = Object.values(component?.elements || {}).find(
              ({ name }) => name === fieldKey
            );
          }
        });

        if (field) {
          let fieldValidation: ElementType | undefined;

          Object.values(components).forEach((component) => {
            if (!fieldValidation) {
              fieldValidation = Object.values(component?.elements || {}).find(
                ({ name }) => name === fieldKey
              );
            }
          });

          const isRequired = rules.find(
            (rule) => rule.key === fieldKey
          )?.required;

          if (fieldValidation) {
            const { pattern, length, min_length, max_length } = fieldValidation;

            if (isRequired && !value) {
              updatedErrors = updateErrors(
                updatedErrors,
                key,
                `${key} is required field!`
              );
            }

            if (
              length &&
              (value?.toString().length < length ||
                value?.toString().length > length)
            ) {
              updatedErrors = updateErrors(
                updatedErrors,
                key,
                `Value length for the ${fieldKey} field must be ${length}!`
              );
            }

            if (pattern) {
              try {
                const isPatternFailed =
                  new RegExp(pattern).test(value.toString()) === false;

                if (isPatternFailed) {
                  updatedErrors = updateErrors(
                    updatedErrors,
                    key,
                    `${fieldKey} has wrong pattern, the correct pattern is ${new RandExp(
                      pattern as string
                    ).gen()} (example)!`
                  );
                }
              } catch (error) {
                console.error(error);
              }
            }

            if (min_length && !max_length) {
              if (value?.toString().length < min_length) {
                updatedErrors = updateErrors(
                  updatedErrors,
                  key,
                  `Min length for ${fieldKey} field is ${min_length}!`
                );
              }
            }

            if (max_length && !min_length) {
              if (value?.toString().length > max_length) {
                updatedErrors = updateErrors(
                  updatedErrors,
                  key,
                  `Max length for ${fieldKey} field is ${max_length}!`
                );
              }
            }

            if (max_length && min_length) {
              if (
                (value?.toString().length > max_length ||
                  value?.toString().length < min_length) &&
                max_length !== min_length
              ) {
                updatedErrors = updateErrors(
                  updatedErrors,
                  key,
                  `Length for ${fieldKey} field should be between ${min_length} and ${max_length}!`
                );
              } else if (
                value?.toString().length > max_length ||
                value?.toString().length < min_length
              ) {
                updatedErrors = updateErrors(
                  updatedErrors,
                  key,
                  `Length for ${fieldKey} field should be ${min_length}!`
                );
              }
            }
          }
        }
      });

      if (Object.keys(updatedErrors.errors).length) {
        setErrors(updatedErrors);

        return updatedErrors;
      }

      setErrors(undefined);

      return undefined;
    };

    const formatPayload = () => {
      const formattedPayload = {};

      Object.entries(payload).forEach(([key, value]) => {
        const keysLength = key.split('|').length;
        const fieldKey = key.split('|')[keysLength - 1];
        const firstParentComponentType = key.split('|')[keysLength - 2];

        let field: ElementType | undefined;

        Object.values(components).forEach((component) => {
          if (
            component &&
            !field &&
            firstParentComponentType === component.type
          ) {
            field = Object.values(component?.elements || {}).find(
              ({ name }) => name === fieldKey
            );
          }
        });

        if (payload[key] !== undefined) {
          const updatedPath = key
            .split('|')
            .filter((_, index) => index !== keysLength - 2)
            .join('|');

          set(formattedPayload, updatedPath.replaceAll('|', '.'), value);
        }
      });

      return formattedPayload;
    };

    const getBreadcrumbsLabels = () => {
      return resolvedComplexTypes.map((currentComplexType) => {
        const componentTypeKeysLength = currentComplexType.split('|').length;

        return currentComplexType.split('|')[componentTypeKeysLength - 2];
      });
    };

    const handleSave = () => {
      setErrors(undefined);

      const currentErrors = checkValidation();

      if (currentErrors === undefined) {
        return formatPayload();
      }
    };

    const generateEInvoiceUI = async (
      components: Record<string, Component | undefined>,
      firstLevelComponents?: boolean,
      preComponentPath?: string
    ) => {
      if (!Object.keys(components).length) {
        return <></>;
      }

      const invoiceComponents = Object.entries(components).map(
        ([componentName, component], index) => {
          const isAlreadyRendered = Object.values(components)
            .filter((_, currentIndex) => currentIndex < index)
            .some((currentComponent) =>
              Object.values(currentComponent?.elements || {}).some(
                (element) => element.base_type === component?.type
              )
            );

          if (index === 0 || !isAlreadyRendered) {
            return (
              component &&
              renderComponent(
                component,
                index,
                preComponentPath
                  ? preComponentPath
                  : getComponentKey(componentName) || '',
                firstLevelComponents ?? true
              )
            );
          }
        }
      );

      return invoiceComponents.filter((currentComponent) => currentComponent);
    };

    useEffect(() => {
      if (country) {
        fetch(
          new URL(
            `/src/resources/e-invoice/${country}/${country}.json`,
            import.meta.url
          ).href
        )
          .then((response) => response.json())
          .then((response: Resource) => {
            setIsInitial(true);
            setEInvoice(undefined);
            setRules(response.rules);
            setCurrentAvailableGroups([]);
            setAllAvailableGroups([]);
            setComponents(response.components);
            setDefaultFields(response.defaultFields);
            setErrors(undefined);
            setSelectedChoices([]);
            availableGroups = [];
          });
      } else {
        setRules([]);
        setComponents({});
        setErrors(undefined);
        setEInvoice(undefined);
        setIsInitial(true);
        setDefaultFields({});
        setCurrentAvailableGroups([]);
        setAllAvailableGroups([]);
        setSelectedChoices([]);
        availableGroups = [];
      }
    }, [country]);

    useEffect(() => {
      if (Object.keys(components).length) {
        (async () => {
          setIsEInvoiceGenerating(true);

          const invoiceUI = await generateEInvoiceUI(components);

          isInitial && setIsInitial(false);

          setEInvoice(invoiceUI);

          if (isInitial) {
            setAllAvailableGroups([...availableGroups]);
            setCurrentAvailableGroups([...availableGroups]);
          }

          setIsEInvoiceGenerating(false);
        })();
      }
    }, [
      components,
      currentAvailableGroups,
      errors,
      payload,
      selectedChoices,
      resolvedComplexTypes,
    ]);

    useEffect(() => {
      if (Object.keys(components).length && resolvedComplexTypes.length) {
        (async () => {
          const eInvoiceResolvedTypeUI = (await Promise.all(
            resolvedComplexTypes.map(async (currentResolvedType) => {
              const componentTypeKeysLength =
                currentResolvedType.split('|').length;
              const componentType =
                currentResolvedType.split('|')[componentTypeKeysLength - 1];
              const componentForResolving = components[componentType];

              const componentPrePath = currentResolvedType
                .split('|')
                .filter((_, index) => index < componentTypeKeysLength - 1)
                .join('|');

              return await generateEInvoiceUI(
                {
                  [componentType]: componentForResolving,
                },
                false,
                componentPrePath
              );
            })
          )) as EInvoiceUIComponents | undefined;

          setEInvoiceResolvedType(eInvoiceResolvedTypeUI);
        })();
      }
    }, [errors, payload, selectedChoices, resolvedComplexTypes]);

    useEffect(() => {
      if (!isInitial) {
        setErrors(undefined);
      }
    }, [
      payload,
      currentAvailableGroups,
      resolvedComplexTypes,
      selectedChoices,
    ]);

    useImperativeHandle(
      ref,
      () => {
        return {
          saveEInvoice() {
            return handleSave();
          },
        };
      },
      [payload]
    );

    return (
      <div className="flex flex-col mt-5">
        <div className="flex px-6">
          {errors && <EInvoiceValidationAlert errors={errors} />}
        </div>

        <div>
          {!resolvedComplexTypes.length ? (
            <>
              {Boolean(eInvoice) && (
                <Element leftSide={t('fields')}>
                  <SearchableSelect
                    value=""
                    onValueChange={(value) =>
                      setCurrentAvailableGroups((current) =>
                        current.filter((type) => type.key !== value)
                      )
                    }
                    clearAfterSelection
                  >
                    {currentAvailableGroups.map(({ key, label }, index) => (
                      <option key={index} value={key}>
                        {label}
                      </option>
                    ))}
                  </SearchableSelect>
                </Element>
              )}

              {isEInvoiceGenerating ? (
                <Spinner />
              ) : (
                <div className="mt-4 px-6">{eInvoice ?? null}</div>
              )}
            </>
          ) : (
            <>
              {eInvoice && eInvoiceResolvedType && (
                <EInvoiceBreadcrumbs
                  resolvedTypes={[t('general'), ...getBreadcrumbsLabels()]}
                  resolvedUIComponents={[
                    eInvoice as unknown as JSX.Element,
                    ...(eInvoiceResolvedType as unknown as JSX.Element[]),
                  ]}
                  onBreadCrumbIndexChange={(index) =>
                    !index
                      ? setResolvedComplexTypes([])
                      : setResolvedComplexTypes((currentResolvedComplexTypes) =>
                          currentResolvedComplexTypes.filter(
                            (_, typeIndex) => typeIndex < index
                          )
                        )
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    );
  }
);
