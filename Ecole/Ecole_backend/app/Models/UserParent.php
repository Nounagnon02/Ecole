<?php

namespace App\Models;

use App\Traits\BelongsToEcole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserParent extends Model
{
    use HasFactory, BelongsToEcole;

    protected $table = 'parents';

    protected $fillable = [
        'user_id',
        'profession',
        'adresse'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function eleves()
    {
        return $this->belongsToMany(Eleve::class, 'eleves_parents', 'parent_id', 'eleve_id');
    }
}
