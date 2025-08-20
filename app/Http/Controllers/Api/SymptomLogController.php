<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SymptomLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class SymptomLogController extends Controller
{


    /**
     * Display a listing of symptom logs for the authenticated user.
     */
    public function index(Request $request)
    {
        $query = auth()->user()->symptomLogs()->with('user');

        // Filter by symptom
        if ($request->has('symptom')) {
            $query->symptom($request->symptom);
        }

        // Filter by date range
        if ($request->has('from') && $request->has('to')) {
            $query->betweenDates($request->from, $request->to);
        }

        // Filter by severity
        if ($request->has('min_severity')) {
            $maxSeverity = $request->get('max_severity');
            $query->severityRange($request->min_severity, $maxSeverity);
        }

        $logs = $query->orderBy('occurred_at', 'desc')->paginate(50);

        return response()->json($logs);
    }

    /**
     * Store a new symptom log.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'symptom' => 'required|in:fatigue,pain,nausea,headache,mood,sleep_quality,appetite,energy',
            'severity' => 'required|integer|min:0|max:10',
            'notes' => 'nullable|string|max:1000',
            'occurred_at' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $symptomLog = auth()->user()->symptomLogs()->create([
            'symptom' => $request->symptom,
            'severity' => $request->severity,
            'notes' => $request->notes,
            'occurred_at' => Carbon::parse($request->occurred_at),
        ]);

        return response()->json($symptomLog, 201);
    }

    /**
     * Display the specified symptom log.
     */
    public function show($id)
    {
        $symptomLog = auth()->user()->symptomLogs()->findOrFail($id);
        
        return response()->json($symptomLog);
    }

    /**
     * Update the specified symptom log.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'symptom' => 'sometimes|in:fatigue,pain,nausea,headache,mood,sleep_quality,appetite,energy',
            'severity' => 'sometimes|integer|min:0|max:10',
            'notes' => 'nullable|string|max:1000',
            'occurred_at' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $symptomLog = auth()->user()->symptomLogs()->findOrFail($id);
        
        $updateData = array_filter($request->only(['symptom', 'severity', 'notes', 'occurred_at']));
        
        if (isset($updateData['occurred_at'])) {
            $updateData['occurred_at'] = Carbon::parse($updateData['occurred_at']);
        }

        $symptomLog->update($updateData);

        return response()->json($symptomLog);
    }

    /**
     * Remove the specified symptom log.
     */
    public function destroy($id)
    {
        $symptomLog = auth()->user()->symptomLogs()->findOrFail($id);
        $symptomLog->delete();

        return response()->json(['message' => 'Symptom log deleted successfully']);
    }
}
