<?php

namespace App\Http\Controllers;

use App\Models\SessionsMatieres;
use Illuminate\Http\Request;

class SessionsMatieresController extends Controller
{
    public function index(){
        return SessionsMatieres::all();
    }
}
