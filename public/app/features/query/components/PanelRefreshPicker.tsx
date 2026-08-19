import { useCallback, useMemo } from 'react';

import { rangeUtil, type SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { defaultIntervals, Field, Select } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';

const defaultValue = '__default';
const offValue = 'off';
const panelRefreshIntervalPattern = /^\d+(?:ms|[Mwdhmsy])$/;

export interface PanelRefreshPickerProps {
  value?: string | null;
  intervals?: string[];
  onChange: (value: string | undefined) => void;
  hideLabel?: boolean;
}

export function PanelRefreshPicker({
  value,
  intervals = defaultIntervals,
  onChange,
  hideLabel = false,
}: PanelRefreshPickerProps) {
  const validIntervals = useMemo(() => contextSrv.getValidIntervals(intervals), [intervals]);
  const options = useMemo<Array<SelectableValue<string>>>(
    () => [
      {
        label: t('query.panel-refresh-picker.default', 'Default'),
        value: defaultValue,
      },
      {
        label: t('query.panel-refresh-picker.off', 'Off'),
        value: offValue,
      },
      ...validIntervals.map((interval) => ({ label: interval, value: interval })),
    ],
    [validIntervals]
  );

  const normalizedValue = !value ? defaultValue : value.toLowerCase() === offValue ? offValue : value;
  const selectedValue = options.find((option) => option.value === normalizedValue) ?? {
    label: normalizedValue,
    value: normalizedValue,
  };

  const isValidCustomInterval = useCallback(
    (input: string) => {
      const interval = input.trim();
      if (!panelRefreshIntervalPattern.test(interval) || validIntervals.includes(interval)) {
        return false;
      }

      try {
        return rangeUtil.intervalToMs(interval) > 0 && contextSrv.getValidIntervals([interval]).length === 1;
      } catch {
        return false;
      }
    },
    [validIntervals]
  );

  const onSelect = useCallback(
    (option: SelectableValue<string>) => {
      if (option.value === defaultValue) {
        onChange(undefined);
      } else if (option.value === offValue) {
        onChange(offValue);
      } else if (option.value) {
        onChange(option.value);
      }
    },
    [onChange]
  );

  const onCreateOption = useCallback(
    (input: string) => {
      const interval = input.trim();
      if (isValidCustomInterval(interval)) {
        onChange(interval);
      }
    },
    [isValidCustomInterval, onChange]
  );

  const picker = (
    <Select
      inputId="panel-refresh-picker"
      aria-label={t('query.panel-refresh-picker.aria-label', 'Panel refresh interval')}
      options={options}
      value={selectedValue}
      onChange={onSelect}
      allowCustomValue
      createOptionPosition="last"
      isValidNewOption={isValidCustomInterval}
      onCreateOption={onCreateOption}
      formatCreateLabel={(input) =>
        t('query.panel-refresh-picker.custom-option', 'Use custom interval: {{interval}}', { interval: input })
      }
    />
  );

  if (hideLabel) {
    return picker;
  }

  return (
    <Field
      label={t('query.panel-refresh-picker.label', 'Refresh')}
      description={t(
        'query.panel-refresh-picker.description',
        'Manual refreshes and time range changes refresh every panel.'
      )}
      noMargin
    >
      {picker}
    </Field>
  );
}
