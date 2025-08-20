<?php

namespace Database\Seeders;

use App\Models\Alert;
use App\Models\SymptomLog;
use App\Models\Treatment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class HealthDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create demo users
        $users = [
            [
                'name' => 'Demo Patient',
                'email' => 'demo@folia.com',
                'password' => Hash::make('password123'),
            ],
            [
                'name' => 'Test User',
                'email' => 'test@folia.com',
                'password' => Hash::make('password123'),
            ]
        ];

        foreach ($users as $userData) {
            $user = User::create($userData);
            $this->seedHealthDataForUser($user);
        }
    }

    private function seedHealthDataForUser(User $user)
    {
        $startDate = Carbon::now()->subDays(60);
        
        // Create treatment pattern - Treatment A every 14 days
        $treatmentDates = [];
        for ($i = 0; $i < 4; $i++) {
            $treatmentDate = $startDate->copy()->addDays(14 * $i);
            $treatmentDates[] = $treatmentDate;
            
            Treatment::create([
                'user_id' => $user->id,
                'name' => 'Treatment A',
                'dose' => '100mg',
                'administered_at' => $treatmentDate->setTime(9, 0),
            ]);
        }

        // Create some other treatments
        Treatment::create([
            'user_id' => $user->id,
            'name' => 'Supplement B',
            'dose' => '500mg',
            'administered_at' => $startDate->copy()->addDays(5)->setTime(8, 0),
        ]);

        // Generate symptom logs with patterns
        for ($day = 0; $day < 60; $day++) {
            $currentDate = $startDate->copy()->addDays($day);
            
            // Generate fatigue symptoms with post-treatment pattern
            $baseFatigue = 3; // baseline fatigue
            $fatigueLevel = $baseFatigue;
            
            // Check if this is 2-3 days after any treatment
            foreach ($treatmentDates as $treatmentDate) {
                $daysSinceTreatment = $currentDate->diffInDays($treatmentDate);
                if ($daysSinceTreatment >= 2 && $daysSinceTreatment <= 3 && $currentDate->gte($treatmentDate)) {
                    $fatigueLevel += rand(3, 5); // spike after treatment
                }
            }
            
            // Add some random variation
            $fatigueLevel += rand(-1, 2);
            $fatigueLevel = max(0, min(10, $fatigueLevel));
            
            // Create symptom log if above baseline or randomly
            if ($fatigueLevel > $baseFatigue || rand(1, 3) === 1) {
                SymptomLog::create([
                    'user_id' => $user->id,
                    'symptom' => 'fatigue',
                    'severity' => $fatigueLevel,
                    'notes' => $fatigueLevel > 6 ? 'Feeling particularly tired today' : null,
                    'occurred_at' => $currentDate->setTime(rand(18, 22), rand(0, 59)),
                ]);
            }

            // Generate pain symptoms with some spikes
            if (rand(1, 4) === 1) {
                $painLevel = rand(2, 8);
                if ($day % 7 === 0) { // spike every week
                    $painLevel = rand(7, 9);
                }
                
                SymptomLog::create([
                    'user_id' => $user->id,
                    'symptom' => 'pain',
                    'severity' => $painLevel,
                    'notes' => $painLevel > 7 ? 'Severe pain episode' : null,
                    'occurred_at' => $currentDate->setTime(rand(6, 23), rand(0, 59)),
                ]);
            }

            // Generate other symptoms occasionally
            if (rand(1, 5) === 1) {
                $symptoms = ['headache', 'nausea', 'mood'];
                $symptom = $symptoms[array_rand($symptoms)];
                
                SymptomLog::create([
                    'user_id' => $user->id,
                    'symptom' => $symptom,
                    'severity' => rand(3, 7),
                    'occurred_at' => $currentDate->setTime(rand(8, 20), rand(0, 59)),
                ]);
            }
        }

        // Create some example alerts
        Alert::create([
            'user_id' => $user->id,
            'type' => 'post_treatment',
            'severity' => 4,
            'summary' => 'Fatigue tends to increase 48-72h after Treatment A',
            'details' => [
                'symptom' => 'fatigue',
                'treatment' => 'Treatment A',
                'window_hours' => [48, 72],
                'evidence' => ['matches' => 3, 'trials' => 4],
                'confidence' => 0.75
            ],
            'generated_at' => Carbon::now()->subDays(2),
        ]);

        Alert::create([
            'user_id' => $user->id,
            'type' => 'spike',
            'severity' => 3,
            'summary' => 'Pain severity spiked above baseline on 3 of the last 7 days',
            'details' => [
                'symptom' => 'pain',
                'baseline' => 4.2,
                'threshold' => 7.5,
                'spike_days' => 3,
                'total_days' => 7
            ],
            'generated_at' => Carbon::now()->subDays(1),
        ]);
    }
}
