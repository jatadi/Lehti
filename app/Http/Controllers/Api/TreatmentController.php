<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Treatment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class TreatmentController extends Controller
{


    /**
     * Display a listing of treatments for the authenticated user.
     */
    public function index(Request $request)
    {
        $query = auth()->user()->treatments();

        // Filter by treatment name
        if ($request->has('name')) {
            $query->treatmentName($request->name);
        }

        // Filter by date range
        if ($request->has('from') && $request->has('to')) {
            $query->betweenDates($request->from, $request->to);
        }

        $treatments = $query->orderBy('administered_at', 'desc')->paginate(50);

        return response()->json($treatments);
    }

    /**
     * Store a new treatment.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'dose' => 'nullable|string|max:255',
            'administered_at' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $treatment = auth()->user()->treatments()->create([
            'name' => $request->name,
            'dose' => $request->dose,
            'administered_at' => Carbon::parse($request->administered_at),
        ]);

        return response()->json($treatment, 201);
    }

    /**
     * Display the specified treatment.
     */
    public function show($id)
    {
        $treatment = auth()->user()->treatments()->findOrFail($id);
        
        return response()->json($treatment);
    }

    /**
     * Update the specified treatment.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'dose' => 'nullable|string|max:255',
            'administered_at' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $treatment = auth()->user()->treatments()->findOrFail($id);
        
        $updateData = array_filter($request->only(['name', 'dose', 'administered_at']));
        
        if (isset($updateData['administered_at'])) {
            $updateData['administered_at'] = Carbon::parse($updateData['administered_at']);
        }

        $treatment->update($updateData);

        return response()->json($treatment);
    }

    /**
     * Remove the specified treatment.
     */
    public function destroy($id)
    {
        $treatment = auth()->user()->treatments()->findOrFail($id);
        $treatment->delete();

        return response()->json(['message' => 'Treatment deleted successfully']);
    }
}
