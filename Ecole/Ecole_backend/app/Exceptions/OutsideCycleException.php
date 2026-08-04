<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;

/**
 * A write that would land outside the caller's cycle.
 *
 * 403, not 404: unlike a cross-*school* read — where a 404 is deliberate, since
 * a 403 would confirm the record exists somewhere — a cycle head is a colleague
 * inside the same school. The secondary classes are no secret to the primary
 * head; they are simply not theirs to change. Saying so plainly is more useful
 * than pretending the class does not exist.
 */
class OutsideCycleException extends \RuntimeException
{
    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
        ], 403);
    }
}
