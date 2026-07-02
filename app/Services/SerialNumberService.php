<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\LabelTemplate;
use App\Models\ProductPrintItem;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Str;

class SerialNumberService
{
    private const RANDOM_LENGTH = 8;

    private const RANDOM_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    private const DEFAULT_FORMAT = '{yy}{random:8}';

    public function generate(Customer $customer, CarbonInterface|string|null $productionDate = null): string
    {
        return $this->generateMany($customer, $productionDate, 1)[0];
    }

    public function generateMany(
        Customer $customer,
        CarbonInterface|string|null $productionDate,
        int $count,
        bool $commitSequence = true,
        int $sequenceOffset = 0,
        ?LabelTemplate $template = null,
        array $excludedSerialNumbers = [],
    ): array {
        $count = max(1, $count);
        $customer = Customer::query()->lockForUpdate()->findOrFail($customer->id);
        $date = $this->date($productionDate);
        $configuration = $this->configuration($customer, $template);
        $format = $configuration['format'];
        $serialNumbers = [];
        $sequenceYear = (int) $date->format('Y');
        $baseSequence = $this->baseSequence($customer, $format, $date, $template, $configuration);
        $nextSequence = $baseSequence + max(0, $sequenceOffset);

        while (count($serialNumbers) < $count) {
            $sequence = $this->usesSequence($format) ? $nextSequence : null;
            $serialNumber = $this->renderFormat($format, $date, $sequence);

            if ($this->isUnique($serialNumber, $serialNumbers, $excludedSerialNumbers)) {
                $serialNumbers[] = $serialNumber;
            }

            if ($sequence !== null) {
                $nextSequence++;
            }
        }

        if ($commitSequence && $this->usesSequence($format)) {
            $customer->forceFill([
                'serial_number_next_sequence' => $nextSequence,
                'serial_number_sequence_year' => $sequenceYear,
            ])->save();
        }

        return $serialNumbers;
    }

    public function advanceSequence(
        Customer $customer,
        int $count,
        CarbonInterface|string|null $productionDate = null,
        ?LabelTemplate $template = null,
    ): void
    {
        $customer = Customer::query()->lockForUpdate()->findOrFail($customer->id);
        $configuration = $this->configuration($customer, $template);
        $format = $configuration['format'];

        if (! $this->usesSequence($format)) {
            return;
        }

        $sequenceYear = (int) $this->date($productionDate)->format('Y');
        $baseSequence = $this->baseSequence($customer, $format, $this->date($productionDate), $template, $configuration);
        $customer->forceFill([
            'serial_number_next_sequence' => $baseSequence + max(0, $count),
            'serial_number_sequence_year' => $sequenceYear,
        ])->save();
    }

    private function baseSequence(
        Customer $customer,
        string $format,
        CarbonInterface $date,
        ?LabelTemplate $template,
        array $configuration,
    ): int
    {
        $lastSequence = $this->latestSavedSequence($customer, $format, $date, $template, $configuration['resets_yearly']);

        if ($lastSequence !== null) {
            return $lastSequence + 1;
        }

        $sequenceYear = (int) $date->format('Y');
        if ($configuration['isolated']) {
            return $configuration['start'];
        }

        if ($configuration['resets_yearly'] && (int) $customer->serial_number_sequence_year !== $sequenceYear) {
            return $configuration['start'];
        }

        return max($configuration['start'], (int) ($customer->serial_number_next_sequence ?? $configuration['start']));
    }

    private function configuration(Customer $customer, ?LabelTemplate $template): array
    {
        $serialElement = $template?->elements
            ?->first(fn ($element) => ($element->payload['value'] ?? null) === '{{serial_number}}');
        $payload = $serialElement?->payload ?? [];
        $usesTemplateConfiguration = $serialElement !== null;
        $prefix = $customer->serial_number_prefix
            ?: null;

        return [
            'format' => $usesTemplateConfiguration
                ? ($payload['serialNumberFormat'] ?? '{yy}-{seq:5}')
                : ($customer->serial_number_format ?? ($prefix ? $prefix.'{random:8}' : self::DEFAULT_FORMAT)),
            'start' => max(1, (int) ($payload['serialNumberStart'] ?? 1)),
            'resets_yearly' => $usesTemplateConfiguration
                ? (bool) ($payload['serialNumberResetsYearly'] ?? false)
                : (bool) $customer->serial_number_resets_yearly,
            'isolated' => $usesTemplateConfiguration,
        ];
    }

    private function date(CarbonInterface|string|null $productionDate): CarbonInterface
    {
        if ($productionDate instanceof CarbonInterface) {
            return $productionDate;
        }

        return $productionDate ? Carbon::parse($productionDate) : now();
    }

    private function renderFormat(string $format, CarbonInterface $date, ?int $sequence): string
    {
        $serialNumber = str_replace(
            ['{yy}', '{yyyy}', '{year}'],
            [$date->format('y'), $date->format('Y'), $date->format('Y')],
            $format,
        );

        $serialNumber = preg_replace_callback('/\{seq(?::(\d+))?\}/', function (array $matches) use ($sequence): string {
            $value = (string) ($sequence ?? 1);
            $width = isset($matches[1]) ? (int) $matches[1] : 0;

            return $width > 0 ? str_pad($value, $width, '0', STR_PAD_LEFT) : $value;
        }, $serialNumber);

        $serialNumber = preg_replace_callback('/\{(?:random|rand)(?::(\d+))?\}/', function (array $matches): string {
            return $this->randomSuffix(($matches[1] ?? '') !== '' ? (int) $matches[1] : self::RANDOM_LENGTH);
        }, $serialNumber);

        return preg_replace_callback('/\{(\d+)digitrandomcode\}/i', function (array $matches): string {
            return $this->randomSuffix((int) $matches[1]);
        }, $serialNumber);
    }

    private function usesSequence(string $format): bool
    {
        return preg_match('/\{seq(?::\d+)?\}/', $format) === 1;
    }

    private function latestSavedSequence(
        Customer $customer,
        string $format,
        CarbonInterface $date,
        ?LabelTemplate $template,
        bool $resetsYearly,
    ): ?int
    {
        if (! $this->usesSequence($format)) {
            return null;
        }

        $pattern = $this->sequencePattern($format, $date);
        if (! $pattern) {
            return null;
        }

        $query = ProductPrintItem::query()
            ->whereHas('print', fn ($query) => $query->where('customer_id', $customer->id))
            ->whereNotNull('serial_number');

        if ($template) {
            $query->whereHas('print', fn ($query) => $query->where('template_id', $template->id));
        }

        if ($resetsYearly) {
            $query->whereHas('print', fn ($query) => $query->whereYear('production_date', (int) $date->format('Y')));
        }

        return $query
            ->get(['serial_number', 'serial_numbers'])
            ->reduce(function (?int $maxSequence, ProductPrintItem $item) use ($pattern): ?int {
                foreach (array_filter([$item->serial_number, ...($item->serial_numbers ?? [])]) as $serialNumber) {
                    if (preg_match($pattern, $serialNumber, $matches) !== 1) {
                        continue;
                    }

                    $sequence = (int) $matches['sequence'];
                    $maxSequence = $maxSequence === null ? $sequence : max($maxSequence, $sequence);
                }

                return $maxSequence;
            }, null);
    }

    private function sequencePattern(string $format, CarbonInterface $date): ?string
    {
        $sequencePlaceholder = '/\{seq(?::(\d+))?\}/';

        if (preg_match($sequencePlaceholder, $format) !== 1) {
            return null;
        }

        $parts = preg_split($sequencePlaceholder, $format, 2);
        if (! is_array($parts) || count($parts) !== 2) {
            return null;
        }

        [$prefix, $suffix] = $parts;
        $prefixPattern = $this->formatPartPattern($prefix, $date);
        $suffixPattern = $this->formatPartPattern($suffix, $date);

        return '/^'.$prefixPattern.'(?P<sequence>\d+)'.$suffixPattern.'$/';
    }

    private function formatPartPattern(string $value, CarbonInterface $date): string
    {
        $tokens = [];
        $placeholder = '__SERIAL_TOKEN_'.Str::random(12).'__';

        $value = str_replace(
            ['{yy}', '{yyyy}', '{year}'],
            [$date->format('y'), $date->format('Y'), $date->format('Y')],
            $value,
        );

        $value = preg_replace_callback('/\{(?:random|rand)(?::(\d+))?\}|\{(\d+)digitrandomcode\}/i', function (array $matches) use (&$tokens, $placeholder): string {
            $length = (int) (($matches[1] ?? '') !== '' ? $matches[1] : ($matches[2] ?? self::RANDOM_LENGTH));
            $key = $placeholder.count($tokens);
            $tokens[$key] = '[0-9A-Z]{'.max(1, $length).'}';

            return $key;
        }, $value);

        $quoted = preg_quote($value, '/');

        foreach ($tokens as $key => $pattern) {
            $quoted = str_replace(preg_quote($key, '/'), $pattern, $quoted);
        }

        return $quoted;
    }

    private function isUnique(
        string $serialNumber,
        array $pendingSerialNumbers,
        array $excludedSerialNumbers = [],
    ): bool
    {
        return ! in_array($serialNumber, $pendingSerialNumbers, true)
            && ! in_array($serialNumber, $excludedSerialNumbers, true)
            && ! ProductPrintItem::query()
                ->where(function ($query) use ($serialNumber): void {
                    $query
                        ->where('serial_number', $serialNumber)
                        ->orWhereJsonContains('serial_numbers', $serialNumber);
                })
                ->exists();
    }

    private function randomSuffix(int $length = self::RANDOM_LENGTH): string
    {
        $suffix = '';
        $maxIndex = strlen(self::RANDOM_CHARS) - 1;

        for ($index = 0; $index < max(1, $length); $index++) {
            $suffix .= self::RANDOM_CHARS[random_int(0, $maxIndex)];
        }

        return $suffix;
    }
}
