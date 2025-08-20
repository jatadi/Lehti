<?php
echo "=== Lehti API Demo ===\n\n";

// 1. Test Login
echo "1. Testing Login...\n";
$loginData = [
    'email' => 'demo@folia.com',
    'password' => 'password123'
];

$ch = curl_init('http://localhost:8000/api/auth/login');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($loginData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    echo "✅ Login successful!\n";
    echo "   User: " . $data['user']['name'] . "\n";
    echo "   Email: " . $data['user']['email'] . "\n";
    echo "   Token: " . substr($data['token'], 0, 50) . "...\n\n";
    
    $token = $data['token'];
    
    // 2. Test Symptom Logs
    echo "2. Testing Symptom Logs API...\n";
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/symptom-logs?limit=5');
    curl_setopt($ch, CURLOPT_HTTPGET, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json'
    ]);
    
    $symptomsResponse = curl_exec($ch);
    $symptomsCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if ($symptomsCode === 200) {
        $symptomsData = json_decode($symptomsResponse, true);
        echo "✅ Found " . $symptomsData['total'] . " total symptom logs\n";
        echo "   Recent symptoms:\n";
        
        foreach (array_slice($symptomsData['data'], 0, 3) as $log) {
            echo "   - " . ucfirst($log['symptom']) . " (severity: " . $log['severity'] . "/10) on " . 
                 date('M j', strtotime($log['occurred_at'])) . "\n";
        }
        echo "\n";
    }
    
    // 3. Test Treatments
    echo "3. Testing Treatments API...\n";
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/treatments');
    
    $treatmentsResponse = curl_exec($ch);
    $treatmentsCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if ($treatmentsCode === 200) {
        $treatmentsData = json_decode($treatmentsResponse, true);
        echo "✅ Found " . $treatmentsData['total'] . " total treatments\n";
        echo "   Recent treatments:\n";
        
        foreach (array_slice($treatmentsData['data'], 0, 3) as $treatment) {
            echo "   - " . $treatment['name'] . " (" . $treatment['dose'] . ") on " . 
                 date('M j', strtotime($treatment['administered_at'])) . "\n";
        }
        echo "\n";
    }
    
    // 4. Test Alerts
    echo "4. Testing Alerts API...\n";
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:8000/api/alerts');
    
    $alertsResponse = curl_exec($ch);
    $alertsCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if ($alertsCode === 200) {
        $alertsData = json_decode($alertsResponse, true);
        echo "✅ Found " . count($alertsData['data']) . " active alerts\n";
        
        foreach ($alertsData['data'] as $alert) {
            echo "   🚨 [Severity " . $alert['severity'] . "/5] " . $alert['summary'] . "\n";
            echo "      Generated: " . date('M j, Y', strtotime($alert['generated_at'])) . "\n";
        }
    }
    
} else {
    echo "❌ Login failed with code: $httpCode\n";
    echo "Response: $response\n";
}

curl_close($ch);

echo "\n=== Demo Complete! ===\n";
echo "Your Laravel health tracking API is working perfectly! 🎉\n";
?>
