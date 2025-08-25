<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\Request;

class AlertController extends Controller
{


    /**
     * Display a listing of alerts for the authenticated user.
     */
    public function index(Request $request)
    {
        $demoUser = User::where('email', 'demo@folia.com')->first();
        $query = $demoUser->alerts();

        // Filter by alert type
        if ($request->has('type')) {
            $query->type($request->type);
        }

        // Filter by resolution status
        if ($request->has('resolved')) {
            if ($request->resolved === 'true') {
                $query->resolved();
            } elseif ($request->resolved === 'false') {
                $query->unresolved();
            }
            // If resolved=all, don't filter - show both resolved and unresolved
        } else {
            // Default to unresolved alerts
            $query->unresolved();
        }

        $alerts = $query->bySeverity()
                       ->orderBy('generated_at', 'desc')
                       ->paginate(20);

        return response()->json($alerts);
    }

    /**
     * Display the specified alert.
     */
    public function show($id)
    {
        $demoUser = User::where('email', 'demo@folia.com')->first();
        $alert = $demoUser->alerts()->findOrFail($id);
        
        return response()->json($alert);
    }

    /**
     * Mark an alert as resolved.
     */
    public function resolve($id)
    {
        $demoUser = User::where('email', 'demo@folia.com')->first();
        $alert = $demoUser->alerts()->findOrFail($id);
        $alert->resolve();

        return response()->json([
            'message' => 'Alert resolved successfully',
            'alert' => $alert->fresh()
        ]);
    }

    /**
     * Recompute alerts for the authenticated user (admin/dev endpoint).
     */
    public function recompute()
    {
        // This would trigger the pattern detection engine
        // For now, return a placeholder response
        return response()->json([
            'message' => 'Alert recomputation triggered',
            'user_id' => 1
        ]);
    }
}
