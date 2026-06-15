<?php

namespace App\Jobs;

use App\Events\PrintCompleted;
use App\Events\PrintFailed;
use App\Events\PrintProgress;
use App\Events\PrintStarted;
use App\Models\LabelTemplate;
use App\Models\ProductPrint;
use App\Services\TemplateRenderingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Throwable;

class ProcessPrintJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 300;

    public function __construct(private readonly int $printId)
    {
    }

    public function handle(TemplateRenderingService $renderer): void
    {
        $print = ProductPrint::with('items.product.customer')->findOrFail($this->printId);
        $template = LabelTemplate::with('elements')->findOrFail($print->template_id);

        $print->update(['status' => 'processing', 'started_at' => now()]);
        event(new PrintStarted($print->refresh()));

        foreach ($print->items as $item) {
            try {
                DB::transaction(function () use ($renderer, $template, $item, $print): void {
                    $payload = $renderer->render($template, $item->product);
                    $item->update(['status' => 'completed', 'rendered_payload' => $payload]);
                    $item->product->forceFill([
                        'status' => 'printed',
                        'print_count' => $item->product->print_count + 1,
                        'last_printed_at' => now(),
                    ])->save();
                    $print->increment('completed_products');
                });
            } catch (Throwable $exception) {
                $item->update(['status' => 'failed', 'failure_reason' => $exception->getMessage()]);
                $print->increment('failed_products');
            }

            event(new PrintProgress($print->refresh(), $item->product->product_id));
        }

        $status = $print->failed_products > 0 ? 'completed_with_errors' : 'completed';
        $print->update(['status' => $status, 'completed_at' => now()]);
        event(new PrintCompleted($print->refresh()));
    }

    public function failed(Throwable $exception): void
    {
        $print = ProductPrint::find($this->printId);

        if ($print) {
            $print->update(['status' => 'failed']);
            event(new PrintFailed($print, $exception->getMessage()));
        }
    }
}
