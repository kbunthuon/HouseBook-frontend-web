# HouseBook Database Schema - Entity Relationships

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER MANAGEMENT                          │
└─────────────────────────────────────────────────────────────────┘

                            ┌──────┐
                            │ User │ (Base entity)
                            └──┬───┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
            ┌───────┐    ┌─────────────┐  ┌───────┐
            │ Owner │    │ Tradesperson │  │ Admin │
            └───┬───┘    └──────┬──────┘  └───────┘
                │               │
                │               └──────┐
                │                      │
                │                ┌─────▼──────┐
                │                │TradieSkills│
                │                └────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                      PROPERTY HIERARCHY                          │
└─────────────────────────────────────────────────────────────────┘

    ┌───────┐ ───── OwnerProperty ───── ┌──────────┐
    │ Owner │ (Many-to-Many)            │ Property │
    └───────┘                           └─────┬────┘
                                              │
                                              ├─── PropertyImages (1:Many)
                                              │
                                              ├─── Spaces (1:Many)
    ┌───────┐ ───── PropertyGroup ───── ┐    │         │
    │ Group │ (Many-to-Many)                  │         │
    └───────┘                                 │         └─── Assets (1:Many)
                                              │                   │
                                              │                   │
                                              ├─── Jobs (1:Many)  │
                                              │        │          │
                                              │        └──────────┘
                                              │
                                              └─── Transfers (1:Many)


┌─────────────────────────────────────────────────────────────────┐
│                       ASSET MANAGEMENT                           │
└─────────────────────────────────────────────────────────────────┘

    ┌────────────┐
    │ AssetTypes │ ──────┐
    └────────────┘       │ (1:Many)
                         │
    ┌────────┐           ▼
    │ Spaces │ ─────▶ ┌────────┐
    └────────┘         │ Assets │
         ▲             └───┬────┘
         │                 │
         │                 ├──── AssetImages (1:Many)
         │                 │
         │                 └──── ChangeLog (1:Many)
         │                           │
    (1:Many)                         └──── ChangeLogHistory (1:Many)
         │
    ┌─────────┐
    │Property │
    └─────────┘


┌─────────────────────────────────────────────────────────────────┐
│                         JOB WORKFLOW                             │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐                    ┌──────┐
    │ Property │ ───────────────▶   │ Jobs │
    └──────────┘ (1:Many)           └──┬───┘
                                       │
                        ┌──────────────┼──────────────┐
                        │              │              │
                        ▼              ▼              ▼
                 ┌────────────┐  ┌──────────┐  tradie_id (optional)
                 │ JobAssets  │  │JobTradies│        │
                 │(Many-Many) │  │(Many-Many│        │
                 └─────┬──────┘  └────┬─────┘        │
                       │              │              │
                       ▼              ▼              ▼
                  ┌────────┐    ┌─────────────┐
                  │ Assets │    │ Tradesperson │
                  └────────┘    └─────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    PROPERTY TRANSFERS                            │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │ Property │ ──────┐
    └──────────┘       │ (1:Many)
                       │
    ┌───────┐          ▼
    │ Owner │ ─────▶ ┌───────────┐
    └───────┘        │ Transfers │
         ▲           └─────┬─────┘
         │                 │
         │         ┌───────┴───────┐
         │         │               │
         │         ▼               ▼
         │  ┌──────────────┐ ┌──────────────┐
         └──│TransferOld   │ │TransferNew   │
            │Owners        │ │Owners        │
            │(Many-Many)   │ │(Many-Many)   │
            └──────────────┘ └──────────────┘
```

## Cardinality Summary

### **User Roles** (1:1 Optional)
```
User ─┬─ 0..1 ──▶ Owner
      ├─ 0..1 ──▶ Tradesperson ──▶ * TradieSkills
      └─ 0..1 ──▶ Admin
```

### **Property Ownership** (Many-to-Many)
```
Owner ◄───── * OwnerProperty * ─────▶ Property
Group ◄───── * PropertyGroup * ─────▶ Property
```

### **Property Structure** (1:Many Hierarchy)
```
Property ─┬─ 1:* ──▶ PropertyImages
          ├─ 1:* ──▶ Spaces ──▶ 1:* ──▶ Assets
          ├─ 1:* ──▶ Jobs
          └─ 1:* ──▶ Transfers
```

### **Asset Hierarchy** (1:Many Chain)
```
AssetTypes ──▶ 1:* ──▶ Assets ─┬─ 1:* ──▶ AssetImages
                                ├─ 1:* ──▶ ChangeLog ──▶ 1:* ──▶ ChangeLogHistory
                                └─ *:* ──▶ JobAssets ──▶ Jobs
```

### **Job Assignments** (Many-to-Many + Optional Lead)
```
Jobs ─┬─ *:* ──▶ JobTradies ──▶ Tradesperson
      ├─ 0..1 ──▶ tradie_id (lead tradesperson)
      └─ *:* ──▶ JobAssets ──▶ Assets
```

### **Multi-Party Transfers** (Many-to-Many with Status)
```
Transfers ─┬─ 1:* ──▶ TransferOldOwners ──▶ * Owner (each with approval status)
           ├─ 1:* ──▶ TransferNewOwners ──▶ * Owner (each with approval status)
           └─ 0..1 ──▶ Property
```

---

## Key Design Patterns

| Pattern | Tables | Purpose |
|---------|--------|---------|
| **Role Inheritance** | User → Owner/Tradesperson/Admin | Flexible user role system |
| **Many-to-Many** | OwnerProperty, PropertyGroup, JobAssets, JobTradies | Enable complex relationships |
| **Soft Delete** | Assets, Spaces | Preserve historical data |
| **Audit Trail** | ChangeLog → ChangeLogHistory | Track all modifications |
| **JSONB Storage** | Assets.current_specifications, ChangeLog.specifications | Flexible attribute storage |
| **Multi-Party Approval** | TransferOldOwners, TransferNewOwners | Independent acceptance tracking |

---

## Database Overview

The HouseBook database manages property information, assets, maintenance jobs, user roles, and property ownership transfers. It uses PostgreSQL with Supabase authentication integration.

**Total Tables:** 26

## Core Entities

### **User Management (4 tables)**

#### User
Base user table linked to Supabase auth (`auth.users`)

| Column | Type | Description |
|--------|------|-------------|
| user_id | uuid | Primary key, references auth.users |
| first_name | text | User's first name |
| last_name | text | User's last name |
| phone | text | Contact phone number |
| email | text | Email address (unique) |
| created_at | timestamp | Account creation date |

#### Owner
Property owners (extends User, 1:1 optional relationship)

| Column | Type | Description |
|--------|------|-------------|
| owner_id | uuid | Primary key |
| user_id | uuid | Foreign key to User (unique) |

#### Tradesperson
Trade workers (extends User, 1:1 optional relationship)

| Column | Type | Description |
|--------|------|-------------|
| tradie_id | uuid | Primary key |
| user_id | uuid | Foreign key to User (unique) |

#### Admin
System administrators (extends User, 1:1 optional relationship)

| Column | Type | Description |
|--------|------|-------------|
| admin_id | uuid | Primary key |
| user_id | uuid | Foreign key to User (unique) |

---

### **Property Management (5 tables)**

#### Property
Main property/house records

| Column | Type | Description |
|--------|------|-------------|
| property_id | uuid | Primary key |
| name | text | Property name (default: "My House") |
| address | text | Street address (max 100 chars) |
| description | text | Property description |
| pin | text | 6-digit access PIN |
| type | text | Property type (default: "Townhouse") |
| block_size | real | Land size in square meters |
| total_floor_area | real | Total floor area |
| completion_status | numeric | Completion percentage (0-100) |
| status | text | Current property status |
| splash_image | text | Main property image URL |
| created_at | timestamp | Creation date |
| last_updated | timestamp | Last modification date |

#### PropertyImages
Photo gallery for properties (1:Many with Property)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| property_id | uuid | Foreign key to Property |
| image_link | text | Image URL |
| image_name | varchar | Image filename |
| description | varchar | Image description |
| created_at | timestamp | Upload date |

#### Spaces
Rooms/areas within a property (1:Many with Property)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| property_id | uuid | Foreign key to Property |
| name | text | Space name (e.g., "Master Bedroom") |
| type | enum | Space type (Kitchen, Bathroom, etc.) |
| deleted | boolean | Soft delete flag |
| created_at | timestamp | Creation date |

#### OwnerProperty
Many-to-many relationship: Links owners to properties (co-ownership support)

| Column | Type | Description |
|--------|------|-------------|
| owner_id | uuid | Foreign key to Owner |
| property_id | uuid | Foreign key to Property |
| - | - | Composite primary key (owner_id, property_id) |

#### PropertyGroup
Many-to-many relationship: Links groups to properties

| Column | Type | Description |
|--------|------|-------------|
| group_id | uuid | Foreign key to Group |
| property_id | uuid | Foreign key to Property |
| - | - | Composite primary key (group_id, property_id) |

---

### **Asset Management (5 tables)**

#### Assets
Physical items/fixtures in properties (appliances, HVAC, plumbing, etc.)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| space_id | uuid | Foreign key to Spaces |
| asset_type_id | integer | Foreign key to AssetTypes |
| description | text | Asset description |
| current_specifications | jsonb | Flexible attribute storage (JSON) |
| deleted | boolean | Soft delete flag |
| created_at | timestamp | Creation date |

#### AssetTypes
Categories of assets with trade disciplines

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key (auto-increment) |
| name | text | Type name (unique, e.g., "Water Heater") |
| discipline | enum | Trade category (Plumbing, Electrical, etc.) |

#### AssetImages
Photos of individual assets (1:Many with Assets)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| asset_id | uuid | Foreign key to Assets |
| image_link | text | Image URL |
| image_name | text | Image filename |
| description | text | Image description |
| created_at | timestamp | Upload date |

#### ChangeLog
Tracks all asset modifications with approval workflow

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| asset_id | uuid | Foreign key to Assets |
| specifications | jsonb | Proposed changes (JSON) |
| change_description | text | Description of changes |
| changed_by_user_id | uuid | Foreign key to User |
| status | enum | PENDING / ACCEPTED / DECLINED |
| actions | enum | CREATED / UPDATED / DELETED |
| created_at | timestamp | Change request date |

#### ChangeLogHistory
Audit trail of ChangeLog edits (1:Many with ChangeLog)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| changelog_id | uuid | Foreign key to ChangeLog |
| previous_specifications | jsonb | Old specification values |
| previous_change_description | text | Old description |
| previous_status | text | Old status |
| previous_actions | text | Old action type |
| new_specifications | jsonb | New specification values |
| new_change_description | text | New description |
| new_status | text | New status |
| new_actions | text | New action type |
| edit_reason | text | Reason for editing changelog |
| edited_by_user_id | uuid | Who made the edit |
| edited_at | timestamp | When edited |

---

### **Job Management (3 tables)**

#### Jobs
Maintenance/repair work orders

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| property_id | uuid | Foreign key to Property |
| tradie_id | uuid | Optional lead tradesperson |
| title | text | Job title/summary |
| pin | text | Job access PIN |
| created_at | timestamp | Job creation date |
| end_time | timestamp | Job completion time |

#### JobAssets
Many-to-many: Links jobs to affected assets

| Column | Type | Description |
|--------|------|-------------|
| job_id | uuid | Foreign key to Jobs |
| asset_id | uuid | Foreign key to Assets |
| - | - | Composite primary key (job_id, asset_id) |

#### JobTradies
Many-to-many: Assigns tradies to jobs with status tracking

| Column | Type | Description |
|--------|------|-------------|
| job_id | uuid | Foreign key to Jobs |
| tradie_id | uuid | Foreign key to Tradesperson |
| status | enum | Assignment status |
| - | - | Composite primary key (job_id, tradie_id) |

---

### **Property Transfer System (3 tables)**

#### Transfers
Property ownership transfer requests

| Column | Type | Description |
|--------|------|-------------|
| transfer_id | uuid | Primary key |
| property_id | uuid | Foreign key to Property |
| status | enum | PENDING / ACCEPTED / DECLINED |
| created_at | timestamp | Transfer initiation date |

#### TransferOldOwners
Many-to-many: Current owners involved in transfer (each with individual acceptance status)

| Column | Type | Description |
|--------|------|-------------|
| transfer_id | uuid | Foreign key to Transfers |
| owner_id | uuid | Foreign key to Owner |
| status | enum | Individual approval status |
| - | - | Composite primary key (transfer_id, owner_id) |

#### TransferNewOwners
Many-to-many: Prospective new owners (each with individual acceptance status)

| Column | Type | Description |
|--------|------|-------------|
| transfer_id | uuid | Foreign key to Transfers |
| owner_id | uuid | Foreign key to Owner |
| status | enum | Individual approval status |
| - | - | Composite primary key (transfer_id, owner_id) |

---

### **Supporting Tables (3 tables)**

#### Group
User groups for property management

| Column | Type | Description |
|--------|------|-------------|
| group_id | uuid | Primary key |
| name | text | Group name |
| description | text | Group description |

#### TradieSkills
Links tradies to their trade disciplines (1:Many with Tradesperson)

| Column | Type | Description |
|--------|------|-------------|
| tradie_id | uuid | Foreign key to Tradesperson |
| discipline | enum | Trade discipline |
| - | - | Composite primary key (tradie_id, discipline) |

---

## Custom Enums (USER-DEFINED Types)

| Enum Name | Values | Used In |
|-----------|--------|---------|
| **trade_discipline** | General, Plumbing, Electrical, HVAC, Carpentry, etc. | AssetTypes, TradieSkills |
| **changelog_status** | PENDING, ACCEPTED, DECLINED | ChangeLog |
| **actions** | CREATED, UPDATED, DELETED | ChangeLog |
| **Transfer_Accept_Status** | PENDING, ACCEPTED, DECLINED | TransferOldOwners, TransferNewOwners |
| **transfer_status** | PENDING, ACCEPTED, DECLINED, etc. | Transfers |
| **space_type** | Kitchen, Bathroom, Bedroom, Living Room, etc. | Spaces |
| **job_status** | Various job statuses | JobTradies |

---

## Security Features

- **Supabase Authentication**: All user accounts linked to `auth.users`
- **PIN Access Control**: 6-digit PINs for property and job access
- **Audit Trails**: Comprehensive change tracking via ChangeLog and ChangeLogHistory
- **Soft Deletes**: Assets and Spaces use `deleted` flag to preserve historical data
- **Multi-Party Approval**: Transfers require individual approval from all parties

---

## Notable Features

### JSONB Specifications
Flexible storage for asset attributes without schema changes:
- `Assets.current_specifications`
- `ChangeLog.specifications`

### Multi-Party Transfers
- Multiple old owners can independently accept/decline
- Multiple new owners can independently accept/decline
- Transfer only proceeds when all parties approve

### Change Tracking System
1. User proposes change → Creates ChangeLog entry (status: PENDING)
2. Admin reviews → Updates status to ACCEPTED/DECLINED
3. If ChangeLog is edited → ChangeLogHistory records the modification
4. Full audit trail of who changed what and when

### Skill-Based Matching
- AssetTypes have `discipline` (e.g., Plumbing)
- Tradies have skills via TradieSkills
- Enables matching tradies to relevant jobs based on asset types

### Soft Delete Pattern
Assets and Spaces use `deleted` boolean flag instead of physical deletion:
- Preserves historical data
- Maintains referential integrity
- Allows "undelete" functionality

---

## Database Statistics

- **Total Tables**: 26
- **Primary Keys**: All tables use UUID (except AssetTypes uses integer)
- **Foreign Keys**: 31 foreign key relationships
- **Many-to-Many**: 6 junction tables
- **Enums**: 6+ custom enum types
- **JSONB Columns**: 2 (flexible schema storage)
- **Soft Deletes**: 2 tables (Assets, Spaces)

---

## Quick Reference: Table Categories

| Category | Tables | Count |
|----------|--------|-------|
| **User Management** | User, Owner, Admin, Tradesperson | 4 |
| **Property** | Property, PropertyImages, Spaces, OwnerProperty, PropertyGroup | 5 |
| **Assets** | Assets, AssetTypes, AssetImages, ChangeLog, ChangeLogHistory | 5 |
| **Jobs** | Jobs, JobAssets, JobTradies | 3 |
| **Transfers** | Transfers, TransferOldOwners, TransferNewOwners | 3 |
| **Supporting** | Group, TradieSkills | 2 |
| **Auth** | auth.users (Supabase) | 1 |

---

**Generated**: 2025-11-07
**Database**: PostgreSQL via Supabase
**Schema**: public (primary), auth (Supabase)
