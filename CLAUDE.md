# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Projet_SP is a role-based field merchandising management system for a beverage company with four user roles:
- **Administrateur**: Manages users, clients, products, and views all reports
- **Responsable**: Supervises multiple Chef de Zone, can also validate visits, manages overall operations
- **Chef de Zone**: Validates merchandiser visit reports for their zone, exports Excel reports for Power BI
- **Merchandiser**: Creates visit reports from the field via mobile app

**Hierarchy**: Responsable → Chef de Zone → Merchandiser

The system consists of three applications sharing a single FastAPI backend:
- **Backend** (FastAPI/Python/PostgreSQL): REST API with JWT authentication
- **Mobile App** (React Native/Expo): Field merchandising tool for mobile devices
- **Web App** (React/React Router): Administration and supervision dashboards

**Data Flow**: Merchandisers collect data → Chef de Zone validates → Excel export → Power BI analysis

## Development Commands

### Backend (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server (default: http://127.0.0.1:8000)
uvicorn app.main:app --reload

# Run on specific port
uvicorn app.main:app --reload --port 8000

# Access API documentation
# http://127.0.0.1:8000/docs (Swagger UI)
# http://127.0.0.1:8000/redoc (ReDoc)
```

### Mobile App (React Native/Expo)

```bash
# Navigate to mobile app directory
cd mobile-app

# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run in web browser (development)
npm run web
```

### Web App (React)

```bash
# Navigate to web app directory
cd web-app

# Install dependencies
npm install

# Start development server (default: http://localhost:3000)
npm start

# Build for production
npm run build
```

## Architecture

### Backend Structure

**Entry Point**: `backend/app/main.py`
- FastAPI application with CORS middleware
- All routes imported and registered here

**Database**: `backend/app/database.py`
- PostgreSQL with SQLAlchemy ORM
- Connection: `postgresql://user:password@localhost:5432/projet_sp`
- Uses SessionLocal for dependency injection pattern

**Models**: `backend/app/models.py`
- Core entities: User, Role, Responsable, ChefZone, Merchandiser, Client, Produit, Visite
- Key relationships:
  - User ↔ Role (many-to-one)
  - Responsable → ChefZone (one-to-many, supervision hierarchy)
  - ChefZone → Merchandiser (one-to-many, team assignment)
  - Visite → Merchandiser + Client (many-to-one)
  - Visite contains nested: ReleveStock, DetailVisiteProduit, VeilleConcurrentielle
- Visite model enriched with 25+ fields for Excel export including:
  - Horaires (heure_debut, heure_fin)
  - Équipements (type_outil, marque_outil, etat_outil)
  - Ruptures (ruptures, type_rupture)
  - Incidents (type_incidents, articles_incidents, quantite_incidents)
  - Informations commerciales (reseau_distribution, type_client, client_direct_nom)

**API Routes**: Organized by role in `backend/app/main.py`
- `/token`: Authentication endpoint
- `/admin/*`: User/client/product management, reports
- `/chef-zone/*`: Visit validation, team dashboard, Excel export
- `/responsable/*`: Overview dashboards, validation capabilities
- `/merchandiser/*`: Create visits, view daily targets
- `/visites/*`, `/clients/*`, `/produits/*`: Shared resources
- `/chefs-zone/`: List all chefs de zone
- `/chef-zone/{id}/commerciaux`: Get commercials for a zone
- `/commercial/{nom}/clients`: Get clients for a commercial

**Security**: `backend/app/security.py`
- JWT tokens (HS256, 30-minute expiration)
- Password hashing with bcrypt
- OAuth2 PasswordBearer scheme
- Dependencies: `get_current_user`, `get_current_admin_user`, `get_current_superviseur_user`

### Mobile App Structure

**Navigation**: `mobile-app/App.js`
- AuthStack (login, settings) vs AppStack (authenticated)
- MainTabs: Home, Clients, Profile
- VisitFormScreen as modal stack screen

**Key Screens**:
- `HomeScreen.js`: Dashboard with daily KPIs and recent visits
- `ClientsScreen.js`: Cascading client selection (chef de zone → commercial → client)
- `VisitFormScreen.js`: Complete visit report creation with:
  - Client information (zone, commercial, lieu-dit)
  - Horaires & Base (heure_debut, heure_fin, base)
  - Équipements (type_outil, marque_outil, etat_outil)
  - Conformité (FIFO, Planogramme)
  - Stock levels per product
  - Ruptures globales
  - Incidents détaillés
  - Prise de commande
  - Veille concurrentielle
  - Informations commerciales (reseau_distribution, type_client)
  - Observations générales
- `SettingsScreen.js`: Configure API base URL

**API Integration**: `mobile-app/api/axiosConfig.js`
- Dynamic baseURL loaded from AsyncStorage at runtime
- Request interceptor adds Bearer token from AsyncStorage
- Allows users to switch between dev/prod servers without rebuild

**Authentication**: `mobile-app/context/AuthContext.js`
- Global auth state with React Context
- Token persistence across app restarts
- `signIn()` and `signOut()` methods

### Web App Structure

**Routing**: `web-app/src/App.js`
- Role-based route protection
- `/login`: Public login page
- `/`: HomeRedirector (routes to role-appropriate dashboard based on user role)
- `/admin/*`: Admin interface with nested routes
- `/responsable/*`: Responsable interface with nested routes
- `/chef-zone/*`: Chef de Zone interface with nested routes

**Layouts**:
- `AdminLayout.js`: Sidebar navigation for admin pages (blue theme)
- `ResponsableLayout.js`: Sidebar navigation for responsable pages (green theme)
- `ChefZoneLayout.js`: Sidebar navigation for chef de zone pages (blue theme)

**Key Pages**:
- `DashboardPage.js`: Role-specific KPI dashboards with charts
- `ValidationPage.js`: Visit review queue for chef de zone and responsable
- `ExportExcelPage.js`: Excel export page for validated visits (Book2.xlsx format, 54 columns)
- `UserManagementPage.js`: CRUD interface for users
- `ProductManagementPage.js`: Product catalog management
- `ClientManagementPage.js`: Client database management
- `SupervisorHistoryPage.js`: Historical visit records

**API Integration**: `web-app/src/api/axiosConfig.js`
- Static baseURL: `http://127.0.0.1:8000`
- Request interceptor adds Bearer token from localStorage

## Authentication Flow

1. User submits credentials to `POST /token` (OAuth2 PasswordRequestForm)
2. Backend validates and returns: `{access_token, token_type, user_role}`
3. Client stores token and role locally (AsyncStorage/localStorage)
4. All subsequent requests include `Authorization: Bearer {token}` header
5. Backend validates token via `get_current_user` dependency

## Key Development Patterns

### Creating New Backend Endpoints

```python
# 1. Add route to backend/app/main.py
@app.post("/resource/", response_model=schemas.ResourceResponse)
async def create_resource(
    resource: schemas.ResourceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Use CRUD functions for database operations
    return crud.create_resource(db, resource, current_user.id)

# 2. Define schemas in backend/app/schemas.py
class ResourceCreate(BaseModel):
    name: str

class ResourceResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

# 3. Add CRUD function in backend/app/crud.py
def create_resource(db: Session, resource: schemas.ResourceCreate, user_id: int):
    db_resource = models.Resource(**resource.dict(), user_id=user_id)
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource
```

### Adding New Models

1. Define model in `backend/app/models.py` with SQLAlchemy
2. Create corresponding Pydantic schemas in `backend/app/schemas.py`
3. Create database migration (currently manual, no Alembic setup detected)
4. Add CRUD operations in `backend/app/crud.py`

### Mobile App API Calls

```javascript
import api from '../api/axiosConfig';

// GET request
const response = await api.get('/endpoint/');

// POST request
const response = await api.post('/endpoint/', {
  field1: value1,
  field2: value2
});

// Token is automatically added by interceptor
// Errors should be caught with try/catch
```

### Visit Creation Workflow

Visit creation involves nested data structures:

```javascript
// Mobile app submits:
{
  client_id: number,
  observations_generales: string,
  fifo_respecte: boolean,
  planogramme_respecte: boolean,
  releves_stock: [{produit_id, quantite_en_stock, est_en_rupture}],
  details_produits: [{produit_id, type_detail, quantite, commentaire}],
  veilles_concurrentielles: [{concurrent_id, nombre_packs, activite_observee}]
}

// Backend creates:
// 1. Visite record (statut_validation: 'soumis')
// 2. Multiple ReleveStock records
// 3. Multiple DetailVisiteProduit records
// 4. Multiple VeilleConcurrentielle records
// All in a single transaction
```

### Visit Validation Workflow

1. Chef de Zone/Responsable views pending visits via `GET /chef-zone/visites/en-attente`
2. Reviews visit details via `GET /visites/{visite_id}`
3. Validates via `PUT /visites/{visite_id}/valider`
4. Or rejects via `PUT /visites/{visite_id}/rejeter`
5. Backend updates `statut_validation`, `validateur_id`, `date_validation`

### Excel Export Workflow

**Purpose**: Export validated visits to Excel format matching Book2.xlsx template (54 columns) for Power BI analysis

**Endpoint**: `GET /chef-zone/export/visites-validees`

**Process**:
1. Chef de Zone accesses export page (`/chef-zone/export`)
2. System displays all validated visits for their team
3. Click "Exporter" button triggers download
4. Backend (`backend/app/export_excel.py`) generates Excel file with:
   - 54 columns matching exact Book2.xlsx format
   - Header row styled (blue background, white bold text)
   - Data rows with all visit information including:
     - Hierarchy (ZONE, MARCHANDISEUR, RESPONSABLE, CHEF DE ZONE)
     - Horaires (HEURE AR, HEURE DE)
     - Client info (NOM CLIENT, TYPOLOGIE, LOCALISATION, LIEU DIT, CONTACT)
     - Équipements (TYPE OUTIL, MARQUE, ETATS)
     - Conformité (FIFO, PLANOGRAMME, OB PLANOGRAMME)
     - Ruptures (RUPTURES, TYPE RUPTURE)
     - Incidents (TYPE INCIDENTS, ARTICLE, QUANTITE)
     - 22 product stock columns (SP, OP, VITAL, BG SP, etc.)
     - Veille concurrentielle (CONCURRENT, ACTIVITE, MECANISME)
     - Commercial info (RESEAU DE DISTRIBUTION, TYPE CLIENT, CLIENT DIRECT)
   - Filename: `rapports_valides_YYYY-MM-DD.xlsx`
5. File ready for import into Power BI

## Database Schema Key Points

- **Users** are linked to roles; Responsable/ChefZone/Merchandiser have separate profile tables
- **Responsables** supervise multiple **ChefZone** (organizational hierarchy)
- **Merchandisers** are assigned to **ChefZone** (team structure)
- **Visits** link Merchandiser to Client with validation workflow
- **ReleveStock**: Stock levels observed during visit (per product)
- **DetailVisiteProduit**: Orders/incidents per product (type_detail: 'commande'/'incident')
- **VeilleConcurrentielle**: Competitor activity observed during visit
- **ActiviteLog**: Audit trail for system actions
- **Client** enriched with zone, commercial_nom, lieu_dit for hierarchical selection

## Configuration Notes

**Backend Configuration** (currently hardcoded in code):
- Database credentials: `backend/app/database.py`
- JWT secret key: `backend/app/security.py`
- CORS origins: `backend/app/main.py`

**Recommendation**: Move these to environment variables using python-dotenv

**Mobile App Configuration**:
- API URL is user-configurable via Settings screen (stored in AsyncStorage)
- Allows switching between development/production servers

**Web App Configuration**:
- API URL hardcoded to `http://127.0.0.1:8000` in `web-app/src/api/axiosConfig.js`
- Intended for office/desktop use with local backend

## Common Tasks

### Adding a New User Role

1. Add role to `models.Role` table in database
2. Update `schemas.UserCreate` if needed
3. Create role-specific dependency in `backend/app/security.py`
4. Add role-specific routes in `backend/app/main.py`
5. Update frontend routing in `web-app/src/App.js` and `mobile-app/App.js`

### Adding Fields to Visit Report

1. Update `models.Visite` or related nested models
2. Update corresponding Pydantic schemas
3. Update database schema (manual migration)
4. Update `VisitFormScreen.js` to collect new data
5. Update `VisitDetailPage.js` to display new data

### Exporting Data to CSV

Backend provides CSV export endpoints:
- `/admin/export-users/`
- `/admin/export-clients/`
- `/superviseur/export-reports/`

Pattern: Query database, convert to CSV string, return with appropriate headers

## Naming Conventions

- **Backend**: snake_case for Python (functions, variables, database columns)
- **Frontend**: camelCase for JavaScript/React
- **Database**: French table and column names maintained throughout
- **API endpoints**: RESTful resource names (French) + action verbs
- **Files**: PascalCase for React components, camelCase for utilities

## Testing

**Backend Test Scripts** (located in `backend/`):
- `init_db.py`: Database initialization script
  - Drops all existing tables with CASCADE
  - Creates fresh database schema
  - Seeds with 4 default roles (Administrateur, Responsable, Chef de Zone, Merchandiser)
  - Creates default users for testing (admin, responsable, chef de zone, merchandiser)
  - Seeds 22 beverage products (SP, OP, VITAL, BG SP, etc.)
  - Creates 5 test clients
  - Usage: `python -m backend.init_db`

- `test_create_users.py`: Tests user creation for all roles
  - Validates Responsable creation
  - Validates Chef de Zone creation (requires responsable_id)
  - Validates Merchandiser creation (requires chef_zone_id)
  - Usage: `python -m backend.test_create_users`

- `test_complete_workflow.py`: End-to-end workflow test
  - Creates complete visit with all 25+ fields
  - Validates the visit
  - Exports to Excel
  - Saves export as `test_export.xlsx` for manual verification
  - Usage: `python -m backend.test_complete_workflow`

**Frontend Testing**:
No test suite currently detected. When adding tests:
- Backend: Use pytest with FastAPI TestClient
- Mobile: Jest + React Native Testing Library
- Web: Jest + React Testing Library

## Database Initialization

To reset and reinitialize the database with fresh data:

```bash
cd backend
python -m backend.init_db
```

This will:
1. Drop all existing tables (CASCADE)
2. Create new schema from models.py
3. Create 4 default roles
4. Create test users (one per role)
5. Seed 22 beverage products
6. Create 5 test clients

**Default Test Users**:
- Admin: admin@gmail.com / admin237
- Responsable: responsable@sp.com / resp123
- Chef de Zone: chef@sp.com / chef123
- Merchandiser: merchandiser@sp.com / merc123

## Key Implementation Files

**Backend**:
- `backend/app/export_excel.py`: Excel generation matching Book2.xlsx format (54 columns)
- `backend/init_db.py`: Database initialization and seeding
- `backend/test_complete_workflow.py`: End-to-end testing script

**Mobile App**:
- `mobile-app/screens/VisitFormScreen.js`: Complete visit form with all Excel export fields

**Web App**:
- `web-app/src/pages/ExportExcelPage.js`: Excel export interface
- `web-app/src/components/ChefZoneLayout.js`: Chef de Zone sidebar navigation
- `web-app/src/components/ResponsableLayout.js`: Responsable sidebar navigation
