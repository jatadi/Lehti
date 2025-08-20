# Lehti - Smart Symptom Pattern Alerts

A focused health tracking system that detects unusual patterns and possible treatment-symptom relationships in user health logs, then surfaces concise, actionable alerts. Built as a portfolio project demonstrating proficiency with **Laravel/PHP, MySQL, REST APIs**, and data analytics.

## 🎯 Purpose & Fit

This project aligns with Folia Health's mission to make personal health data useful by adding lightweight analytics on top of Health Record Observations (HRO) style logs. It demonstrates:

- **Healthcare Domain Knowledge**: Understanding of patient-driven health tracking
- **Technical Skills**: Laravel, MySQL, JWT authentication, REST APIs
- **Data Analytics**: Pattern detection algorithms for health insights
- **Product Thinking**: Narrow, valuable enhancement with clear MVP scope

## 🚀 Quick Start

### Prerequisites
- PHP 8.2+
- Composer
- SQLite (included) or MySQL

### Installation

```bash
# Clone and setup
git clone [your-repo-url]
cd lehti
composer install

# Database setup
php artisan migrate --seed

# Start development server
php artisan serve
```

The seeder creates demo users:
- **Email**: `demo@folia.com`, **Password**: `password123`
- **Email**: `test@folia.com`, **Password**: `password123`

## 📊 Features Implemented

### ✅ Core Health Tracking
- **Symptom Logs**: Track fatigue, pain, nausea, headache, mood, sleep quality, appetite, energy (0-10 scale)
- **Treatments**: Record medications, supplements with dosage and timing
- **User Management**: JWT-based authentication and user isolation

### ✅ Data Model & API
- RESTful APIs for all CRUD operations
- Comprehensive filtering (date ranges, symptom types, severity)
- User-scoped data access with proper authorization
- JSON API responses with pagination

### ✅ Synthetic Data & Patterns
- 60 days of realistic health data per user
- Post-treatment pattern simulation (fatigue spikes 2-3 days after "Treatment A")
- Weekly pain spike patterns
- Random symptom variations with realistic baselines

### ✅ Basic Alert System
- Pre-generated example alerts showing pattern detection
- Alert severity ranking (1-5 scale)
- Resolution tracking and user management

## 🔧 API Endpoints

### Authentication
```bash
POST /api/auth/register     # Register new user
POST /api/auth/login        # Login and get JWT token
GET  /api/auth/me          # Get authenticated user
POST /api/auth/logout      # Invalidate token
POST /api/auth/refresh     # Refresh JWT token
```

### Symptom Logs
```bash
GET    /api/symptom-logs              # List with filters (?symptom=fatigue&from=2024-01-01)
POST   /api/symptom-logs              # Create new log
GET    /api/symptom-logs/{id}         # Show specific log
PUT    /api/symptom-logs/{id}         # Update log
DELETE /api/symptom-logs/{id}         # Delete log
```

### Treatments
```bash
GET    /api/treatments                # List with filters (?name=Treatment+A&from=2024-01-01)
POST   /api/treatments                # Create new treatment
GET    /api/treatments/{id}           # Show specific treatment
PUT    /api/treatments/{id}           # Update treatment
DELETE /api/treatments/{id}           # Delete treatment
```

### Alerts
```bash
GET  /api/alerts                      # List alerts (?type=spike&resolved=false)
GET  /api/alerts/{id}                 # Show specific alert
POST /api/alerts/{id}/resolve         # Mark alert as resolved
POST /api/alerts/recompute            # Trigger pattern detection (placeholder)
```

## 📋 Example API Usage

### Login and Get Token
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@folia.com","password":"password123"}'
```

### Create Symptom Log
```bash
curl -X POST http://localhost:8000/api/symptom-logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symptom": "fatigue",
    "severity": 7,
    "notes": "after long day",
    "occurred_at": "2024-08-19T20:15:00Z"
  }'
```

### Get Alerts
```bash
curl -X GET http://localhost:8000/api/alerts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🏗️ Architecture

```
Client (Web/Mobile) → Laravel REST API → SQLite Database
                           ↓
                    Pattern Engine → Alerts
```

### Database Schema
- **users**: Authentication and user management
- **symptom_logs**: Health symptoms with severity (0-10) and timestamps
- **treatments**: Medications/supplements with dosage and timing
- **alerts**: Pattern detection results with severity ranking

### Key Models & Relationships
- `User` has many `SymptomLog`, `Treatment`, `Alert`
- Rich query scopes for filtering and pattern analysis
- JSON casting for alert details and metadata

## 🎯 What This Demonstrates

### Technical Skills
- **Backend**: Laravel 11, PHP 8.2+, Eloquent ORM, JWT authentication
- **Database**: MySQL/SQLite schema design, migrations, seeders
- **API Design**: RESTful endpoints, validation, filtering, pagination
- **Security**: JWT tokens, user-scoped data access, input validation

### Healthcare Domain Understanding
- **HRO Concepts**: Patient-driven health data collection
- **Clinical Patterns**: Post-treatment effects, symptom baselines, spike detection
- **User Experience**: Healthcare-focused API design and data structures

### Product & Data Thinking
- **MVP Scope**: Clear boundaries and focused feature set
- **Analytics Foundation**: Data model designed for pattern detection
- **Scalability**: Proper indexing and query optimization

## 🔮 Next Steps (Not Implemented)

The following features are outlined in the original design but not implemented in this MVP:

### Pattern Detection Engine
- Spike detection using rolling median + MAD
- Post-treatment correlation analysis
- Co-occurrence pattern identification

### Frontend Dashboard
- React-based alert visualization
- Symptom trend charts with treatment markers
- Real-time pattern insights

### Advanced Features
- Push notifications for new alerts
- User-configurable thresholds
- CSV export functionality
- Background job processing

### Mobile Integration
- Swift/Kotlin client applications
- Offline-first data sync
- Push notification delivery

## ⚠️ Disclaimer

This demo application is for **educational and portfolio purposes only** and does **not** provide medical advice. It demonstrates software engineering capabilities in the healthcare domain but should not be used for actual medical decision-making.

---

## 🏥 About Folia Health

This project was inspired by Folia Health's mission to enable individuals to take an active role in their care through data-driven insights. Folia's rich longitudinal data and proprietary analytic methods provide vital missing pieces in the emergence of a home-centered, data-driven healthcare ecosystem.

**Built with ❤️ to demonstrate interest in healthcare technology and commitment to patient-centered solutions.**