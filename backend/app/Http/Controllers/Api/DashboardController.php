<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $indicateurs = [];

        if ($user->hasRole('admin')) {
            $indicateurs = [
                'utilisateurs' => User::count(),
                'services' => Service::count(),
            ];
        }

        return response()->json([
            'data' => [
                'roles' => $user->getRoleNames(),
                'indicateurs' => $indicateurs,
            ],
            'message' => null,
            'errors' => null,
        ]);
    }

    public function notifications(Request $request)
    {
        return response()->json([
            'data' => [],
            'message' => null,
            'errors' => null,
        ]);
    }
}
