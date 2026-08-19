<?php

namespace App\Models;

use App\Events\NotificationPushed;
use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory, BelongsToEcole;

    protected static function booted(): void
    {
        static::created(function (Notification $notification) {
            broadcast(new NotificationPushed($notification))->toOthers();
        });
    }

    protected $fillable = ['user_id', 'type', 'title', 'message', 'data', 'read_at', 'ecole_id'];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
