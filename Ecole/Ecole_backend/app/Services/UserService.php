<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserService
{
    /**
     * Soft-delete a user: deactivate, revoke tokens, clear sessions, then soft-delete.
     *
     * This consolidates the pattern previously duplicated across AdminController,
     * EnseignantController, and ParentsController.
     */
    public static function softDeleteUser(User $user): void
    {
        $user->is_active = false;
        $user->save();
        $user->tokens()->delete();
        DB::table('sessions')->where('user_id', $user->id)->delete();
        $user->delete();
    }
}
